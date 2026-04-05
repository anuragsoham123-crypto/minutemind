# MinuteMind 🧠

> AI-powered meeting execution system — transforms raw meetings into tracked decisions, actions, and intelligent pre-meeting briefs.

[![Next.js](https://img.shields.io/badge/Next.js-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=flat-square&logo=openai&logoColor=white)](https://openai.com/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org/)

---

## What is MinuteMind?

Most meeting tools stop at the transcript. MinuteMind goes further.

It ingests your meeting audio, splits the conversation into **tasks, actions, and decisions**, then tracks everything across your team over time. Before your next meeting, it generates an intelligent **pre-meeting brief** built from past task statuses, unresolved accountability, and strategic gaps — so you walk in prepared, not reactive.

---

## Features

### 🎙️ Meeting Ingestion
- Upload audio files — MinuteMind transcribes and processes them automatically
- AI extracts and categorizes **tasks**, **decisions**, and **action items** separately

### 📋 Pre-Meeting Brief
- Auto-generated before each meeting based on history
- Surfaces **pending accountability**, **strategic blind spots**, **contextual gaps**, and items flagged for re-litigation
- Pulls from past meeting data so nothing falls through the cracks

### 📊 Execution Dashboard
- Full task lifecycle: create, assign, update, complete
- Real-time status tracking across individuals and teams
- Full editing loop — nothing is locked after the meeting ends

### 👥 Workload Analysis
- Detects when a person or team is becoming a bottleneck
- Highlights overloaded contributors before it becomes a problem

### 🔍 Meeting Insights
- Pattern recognition across your last 10 meetings
- Keyword-based search across all past meeting transcripts
- Spot recurring blockers, decision delays, and momentum drops

### 🚨 Attention Needed Tab
- Flags missed or required points that weren't covered in the meeting
- Surfaces gaps before they cascade into the next sprint

### 🔗 Cross-Team Dependency Scan
- Identifies task dependencies that span multiple teams
- Prevents handoff failures by making dependencies visible upfront

### 📧 Reminders
- Email reminders for assigned tasks and upcoming deadlines
- Async reminders to keep distributed teams aligned

### 🔁 Re-Meeting Score
- Scores each meeting on whether it achieved its purpose
- Tracks score trends to surface low-value recurring meetings

### 🤝 Collaborative Teams
- Shared workspaces for teams
- Assignments, visibility, and accountability scoped to the right people

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (React) |
| Backend | FastAPI (Python) |
| Database | Firebase (Firestore) |
| AI | OpenAI and Groq API |
| Auth | Firebase Auth |

---

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- Firebase project (with Firestore + Auth enabled)

### Installation

**1. Clone the repo**
```bash
git clone https://github.com/anuragsoham123-crypto/MinuteMind.git
cd MinuteMind
```

**2. Set up the backend**
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Add your OPENAI_API_KEY and Firebase service account credentials to .env
uvicorn main:app --reload
```

**3. Set up the frontend**
```bash
cd frontend
npm install
cp .env.example .env.local
# Add your Firebase config to .env.local
npm run dev
```

**4. Open** `http://localhost:3000`

---

## Environment Variables

**Backend (`.env`)**
```
GROQ_API_KEY=
OPENAI_API_KEY=
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=
```

**Frontend (`.env.local`)**
```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Built at

OceanLabxHackathon 2026

---

## Author

**Anurag Puthiyaveetil Othayoth**  
[anuragpo393@gmail.com](mailto:anuragpo393@gmail.com)  
B.Tech CSE (IoT) — G H Patel College of Engineering & Technology

**Soham Vidyasagar Yadav**  
[sohamrocz123@gmail.com](mailto:sohamrocz123@gmail.com)  
B.Tech CSE (IoT) — G H Patel College of Engineering & Technology
