import json
from datetime import datetime, timezone
from database import get_db
from models.schemas import DependenciesResponse, CrossTeamDependency
from services.ai_service import _get_client

async def scan_organization_dependencies(user_uid: str) -> DependenciesResponse:
    """Scans all open tasks across all teams and meetings to find undocumented cross-team dependencies."""
    db = get_db()
    
    # 1. Fetch all members and their departments/teams
    teams_docs = list(db.collection("teams").where("created_by", "==", user_uid).stream())
    team_map = {}
    for t in teams_docs:
        t_data = t.to_dict()
        team_name = t_data.get("name", "Unknown Team")
        members = list(t.reference.collection("members").stream())
        for m in members:
            email = m.to_dict().get("email")
            if email:
                team_map[email.lower()] = team_name
            
    # 2. Fetch all open tasks from the user's meetings
    meetings_docs = list(db.collection("meetings").where("created_by", "==", user_uid).stream())
    all_open_tasks = []
    
    for doc in meetings_docs:
        for t in doc.reference.collection("tasks").stream():
            td = t.to_dict()
            if td.get("status") == "completed":
                continue
                
            owner_email = td.get("owner_email")
            if owner_email is not None:
                owner_email = owner_email.lower()
            else:
                owner_email = ""
                
            team_affiliation = team_map.get(owner_email) if owner_email else None
            if not team_affiliation and td.get("department"):
                team_affiliation = td.get("department")
            if not team_affiliation:
                team_affiliation = "Cross-Functional"

            all_open_tasks.append({
                "task": td.get("task"),
                "assigned_to": td.get("owner", "Unassigned"),
                "affiliated_team": team_affiliation
            })
            
    if not all_open_tasks:
        return DependenciesResponse(generated_at=datetime.now(timezone.utc).isoformat(), dependencies=[])

    # 3. Ask Groq to map dependencies
    client = _get_client()
    prompt = f"""
    You are an elite organizational project manager. Given a list of active tasks across various organizational teams, look for CROSS-TEAM DEPENDENCIES.
    For example, if the Design team has a task "Wait for final copy from Marketing", that's a dependency where Design is waiting on Marketing.
    
    Tasks:
    {json.dumps(all_open_tasks, indent=2)}
    
    Return a JSON object strictly matching this schema:
    {{
      "dependencies": [
        {{
          "waiting_team": "Team A",
          "blocking_team": "Team B",
          "description": "Brief description of the dependency",
          "recommended_action": "What they should do to unblock"
        }}
      ]
    }}
    If no explicit cross-team dependencies exist, return an empty array for dependencies. Only return cross-team blocks, not intra-team.
    """
    
    try:
        resp = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a cross-team dependency analyzer. Break silos."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
            response_format={"type": "json_object"}
        )
        ai_data = json.loads(resp.choices[0].message.content)
        deps = [CrossTeamDependency(**d) for d in ai_data.get("dependencies", [])]
    except Exception as e:
        print(f"Dependency scan failed: {e}")
        deps = []
        
    return DependenciesResponse(
        generated_at=datetime.now(timezone.utc).isoformat(),
        dependencies=deps
    )
