# SchemeSathi AI

Scholarship discovery, preliminary eligibility assessment, and application tracking assistant.

Developed for CODEBENDERS ACE BUILDERS' HACKATHON 2026.

## Features

- Natural-language extraction of student category, residence, and income
- Income-period clarification for ambiguous amounts
- Telangana Post-Matric Scholarship preliminary income assessment
- Official scholarship portal guidance
- Document checklist and application steps
- Application progress tracking
- Sensitive identification-data rejection
- Clearly labeled illustrative scholarship records

## Tech Stack

Frontend: React, Vite, Tailwind CSS, Lucide React

Backend: Python, FastAPI, SQLAlchemy, SQLite, Pydantic

Agent orchestration: LangGraph

## Architecture

The LangGraph workflow contains three nodes:

1. Evaluate scholarship records.
2. Check Telangana Post-Matric Scholarship income requirements.
3. Generate a preliminary explanation.

The chatbot uses deterministic Python rules, not a hosted LLM.

## Local Setup

Requirements:
- Python 3.10+
- Node.js compatible with Vite 8
- npm

### Backend

From the project root:

    py -3.10 -m venv .venv
    .\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
    $env:PYTHONPATH = "backend"
    .\.venv\Scripts\python.exe -m uvicorn app.main:app --reload

Backend URL: http://127.0.0.1:8000

API docs: http://127.0.0.1:8000/docs

### Frontend

Open a second PowerShell terminal:

    cd frontend
    npm ci
    npm run dev

Frontend URL: http://localhost:5173

## Example

Input:

    BC/urban/1.8 lakh annual family income

The assistant extracts the student category, residence,
and annual family income, then performs a preliminary
income assessment.

For ambiguous input such as:

    BC/urban/1.8 lakh income

the assistant asks whether the income is monthly or annual.

## Application Tracker

Supported statuses:

- NOT_STARTED
- IN_PROGRESS
- SUBMITTED
- COMPLETED

Tracking records are not connected to government application systems.

## Testing

Backend:

    $env:PYTHONPATH = "backend"
    .\.venv\Scripts\python.exe -m pytest tests -q

Frontend:

    cd frontend
    npm run lint
    npm run build

Latest verified results:
- 82 backend tests passed
- ESLint: zero errors and warnings
- Frontend production build: successful

## Official Scholarship Portal

Telangana ePASS:
https://telanganaepass.cgg.gov.in/

## Limitations

- Income assessment does not establish overall eligibility.
- Complete official eligibility rules are not encoded.
- Scholarship requirements must be confirmed on the official portal.
- No hosted LLM or external LLM API is required.
- The application tracker uses a browser session identifier,
  not production-grade authentication.
- Users should not submit sensitive identity numbers.

## Disclaimer

SchemeSathi AI is a hackathon prototype, not an official
government scholarship service.
