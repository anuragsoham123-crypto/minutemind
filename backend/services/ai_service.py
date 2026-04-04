import re
import json
from openai import OpenAI
from config import GROQ_API_KEY, CONFIDENCE_THRESHOLD
from models.schemas import AnalysisResult, ActionItem, Gap, Decision


# ── Preprocessing ──

FILLER_WORDS = re.compile(
    r'\b(um+|uh+|hmm+|like|you know|I mean|basically|actually|literally|right\?)\b',
    re.IGNORECASE,
)

def preprocess_transcript(text: str) -> str:
    """Clean the transcript: remove fillers, normalize speakers, strip noise."""
    text = FILLER_WORDS.sub('', text)
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r'(?m)^(Speaker\s*\d+)\s*:', lambda m: m.group(1).title() + ':', text)
    return text.strip()


def chunk_transcript(text: str, max_chars: int = 12000) -> list[str]:
    """Split long transcripts at paragraph boundaries."""
    if len(text) <= max_chars:
        return [text]
    paragraphs = text.split('\n\n')
    chunks, current = [], ''
    for para in paragraphs:
        if len(current) + len(para) + 2 > max_chars and current:
            chunks.append(current.strip())
            current = ''
        current += para + '\n\n'
    if current.strip():
        chunks.append(current.strip())
    return chunks


# ── System Prompt ──

SYSTEM_PROMPT = """You are an AI meeting assistant that extracts structured execution data from meeting transcripts.

Given a transcript, return a JSON object with exactly these keys:
{
  "summary": "A brief, to-the-point summary of the meeting (2-4 sentences)",
  "decisions": [
    {
      "decision": "Description of what was decided",
      "confidence": "high | medium | low",
      "reasoning": "Why you scored it this way (1 sentence)",
      "transcript_excerpt": "The exact quote from the transcript"
    }
  ],
  "action_items": [
    {
      "task": "Description of the action item",
      "owner": "Person responsible (or null if unclear)",
      "department": "Department or team (e.g. Engineering, Design, Marketing, Product, HR, Sales, Finance, Operations, or null)",
      "deadline": "Deadline if mentioned (ISO date string or natural language, or null)",
      "deadline_type": "explicit or inferred or null",
      "priority": "high | medium | low",
      "confidence_score": 0.0 to 1.0,
      "commitment_type": "verbal_commitment | assignment | self_volunteered | unclear",
      "transcript_excerpt": "The exact quote where this commitment was made",
      "transcript_position": 0.0 to 1.0 (approximate position in the transcript, 0.0 = start, 1.0 = end)
    }
  ],
    }
  ],
  "gaps": [
    "Description of missing information"
  ],
  "ghost_tasks": [
    {
      "description": "Ghost task description (completely missed workstream)",
      "reason": "Why this was missed logically"
    }
  ],
  "bomb_risks": [
    {
      "description": "Bomb risk description (unspoken blockers)",
      "reason": "Why this is a structural risk"
    }
  ]
}

Decision confidence rules:
- "high": speaker used definitive language — "Let's go with", "We're going with", "Final decision", "That's decided"
- "medium": speaker used tentative language — "I think we should", "Probably", "Leaning toward"
- "low": speaker used uncertain language — "Maybe", "Could work", "What if we", "We should explore" — flag these as SOFT DECISIONS

Commitment type rules:
- "verbal_commitment": someone said "I'll do it", "I'll handle it", "I will get that done"
- "assignment": someone was told to do it — "Rahul, can you handle X", "Let's have Priya take care of"
- "self_volunteered": someone offered — "I can take that on", "Let me do that"
- "unclear": task was discussed but no clear ownership moment

Other rules:
- confidence_score: 1.0 = owner explicitly named, 0.5 = inferred from context, 0.0 = no idea
- deadline_type: "explicit" if a specific date/day was stated, "inferred" if guessed from "soon"/"next week", null if none
- gaps: Flag missing owners, deadlines, ambiguous assignments, unresolved questions
- priority: "high" for urgent/critical, "low" for nice-to-haves, "medium" for everything else
- ghost_tasks: Proactively surface completely missed workstreams. If the team discussed following up but assigned no one, or if there is an obvious logical next step (like "send client calendar invite") that nobody took ownership of.
- bomb_risks: Read between the lines for unspoken risks and blockers. For example, if they plan to launch by Friday but no one mentioned QA, stakeholder sign-off, or deployment access. Inject domain knowledge about what is missing from their plan.
- Return ONLY valid JSON, no markdown fences, no explanation text
"""


# ── Groq Client (OpenAI-compatible) ──

_client = None

def _get_client():
    global _client
    if _client is None:
        _client = OpenAI(
            api_key=GROQ_API_KEY,
            base_url="https://api.groq.com/openai/v1",
        )
    return _client


def _call_llm(transcript_chunk: str) -> dict:
    """Call Groq Llama 3.3 70B and parse the JSON response."""
    client = _get_client()

    print(f"  [Groq/Llama-3.3-70B] Sending request...")
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Here is the meeting transcript:\n\n{transcript_chunk}"},
        ],
        temperature=0.3,
        response_format={"type": "json_object"},
    )

    raw = response.choices[0].message.content.strip()
    tokens = response.usage.total_tokens if response.usage else "?"
    print(f"  [Groq/Llama-3.3-70B] Response received ({tokens} tokens)")

    return json.loads(raw)


# ── Post-processing ──

def _post_process(data: dict) -> AnalysisResult:
    """Validate, normalize, and flag low-confidence items."""
    action_items = []
    gaps = list(data.get("gaps", []))

    # Process decisions — handle both new object format and legacy string format
    decisions = []
    for d in data.get("decisions", []):
        if isinstance(d, str):
            decisions.append(Decision(decision=d, confidence="medium"))
        elif isinstance(d, dict):
            dec = Decision(
                decision=d.get("decision", ""),
                confidence=d.get("confidence", "medium"),
                reasoning=d.get("reasoning"),
                transcript_excerpt=d.get("transcript_excerpt"),
            )
            decisions.append(dec)
            # Flag soft decisions
            if dec.confidence == "low":
                gaps.append(f"Soft decision detected: \"{dec.decision}\" — may need re-discussion")

    for item in data.get("action_items", []):
        confidence = float(item.get("confidence_score", 0.5))
        owner = item.get("owner")

        if confidence < CONFIDENCE_THRESHOLD and owner:
            gaps.append(f"Low confidence ({confidence:.0%}) on owner \"{owner}\" for task: \"{item['task']}\" — please verify")

        if not owner:
            gaps.append(f"No owner assigned for: \"{item['task']}\"")

        if not item.get("deadline"):
            gaps.append(f"No deadline set for: \"{item['task']}\"")

        action_items.append(ActionItem(
            task=item.get("task", ""),
            owner=owner,
            department=item.get("department"),
            deadline=item.get("deadline"),
            deadline_type=item.get("deadline_type"),
            priority=item.get("priority", "medium"),
            confidence_score=confidence,
            status="created",
            commitment_type=item.get("commitment_type"),
            transcript_excerpt=item.get("transcript_excerpt"),
            transcript_position=item.get("transcript_position"),
        ))

    gap_objects = [Gap(description=g) for g in gaps]
    from models.schemas import GhostTask, BombRisk
    ghost_tasks = [GhostTask(**gt) for gt in data.get("ghost_tasks", [])]
    bomb_risks = [BombRisk(**br) for br in data.get("bomb_risks", [])]

    return AnalysisResult(
        summary=data.get("summary", ""),
        decisions=decisions,
        action_items=action_items,
        gaps=gap_objects,
        ghost_tasks=ghost_tasks,
        bomb_risks=bomb_risks
    )


# ── Public API ──

async def analyze_transcript(transcript: str) -> AnalysisResult:
    """Full pipeline: preprocess → chunk → LLM → post-process."""
    cleaned = preprocess_transcript(transcript)
    chunks = chunk_transcript(cleaned)

    merged = {"summary": "", "decisions": [], "action_items": [], "gaps": [], "ghost_tasks": [], "bomb_risks": []}

    for i, chunk in enumerate(chunks):
        print(f"[Pipeline] Processing chunk {i + 1}/{len(chunks)}...")
        result = _call_llm(chunk)
        merged["summary"] += " " + result.get("summary", "")
        merged["decisions"].extend(result.get("decisions", []))
        merged["action_items"].extend(result.get("action_items", []))
        merged["gaps"].extend(result.get("gaps", []))
        merged["ghost_tasks"].extend(result.get("ghost_tasks", []))
        merged["bomb_risks"].extend(result.get("bomb_risks", []))

    merged["summary"] = merged["summary"].strip()

    # If multiple chunks, re-summarize
    if len(chunks) > 1 and merged["summary"]:
        client = _get_client()
        resp = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "Combine these meeting summary fragments into one brief, coherent summary (2-4 sentences)."},
                {"role": "user", "content": merged["summary"]},
            ],
            temperature=0.3,
        )
        merged["summary"] = resp.choices[0].message.content.strip()

    print("[Pipeline] Analysis complete! Running Re-Meeting inference...")
    final_result = _post_process(merged)
    
    # Run the Re-Meeting Risk Score Inference
    client = _get_client()
    score_prompt = f"""
    Given the following parsed meeting data, calculate a 'Re-Meeting Risk Score' (0-100) representing the % chance this team will need to schedule another meeting to finish this topic.
    Formula hint: High soft decisions, empty deadlines, unresolved gaps = high score.
    
    Data:
    {final_result.model_dump_json()}
    
    Return a valid JSON object:
    {{
       "remeeting_risk_score": 78,
       "remeeting_risk_reason": "3 soft decisions + 2 ownerless tasks = high re-meeting risk."
    }}
    """
    
    try:
        score_resp = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a stark, honest organizational efficiency model."},
                {"role": "user", "content": score_prompt}
            ],
            temperature=0.1,
            response_format={"type": "json_object"}
        )
        score_data = json.loads(score_resp.choices[0].message.content)
        final_result.remeeting_risk_score = score_data.get("remeeting_risk_score", 0)
        final_result.remeeting_risk_reason = score_data.get("remeeting_risk_reason", "")
    except Exception as e:
        print(f"[Pipeline] Re-Meeting Risk logic failed: {e}")
        final_result.remeeting_risk_score = 0
        final_result.remeeting_risk_reason = "Failed to calculate risk."

    return final_result
