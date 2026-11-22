# SchemeSathi AI — Architecture

SchemeSathi AI is a hackathon prototype. It gives Telangana students a preliminary scholarship income check, scheme information, document and application-step guidance, and a personal application tracker. It is not an official government service and does not decide eligibility.

## System overview

- **Frontend:** React 19, Vite 8, Tailwind CSS 4, Lucide React (`frontend/`).
- **Backend:** Python, FastAPI, SQLAlchemy, Pydantic (`backend/app/`).
- **Agent workflow:** LangGraph, three nodes (`backend/app/services/agent.py`).
- **Database:** SQLite by default, configured through `DATABASE_URL`.
- **Scheme data:** `data/schemes.json`, loaded into the database on first start.

## Frontend (`frontend/src/`)

- `App.jsx`: landing page, assessment form, extracted-profile panel, privacy notice, and the sections for scholarships and applications. It also shows a notice that deadline reminders are not implemented.
- `components/SchemeExplorer.jsx`: loads `GET /api/schemes` and separates source-recorded schemes from illustrative or unverified records.
- `components/ScholarshipRecommendation.jsx`: shows the income assessment, document checklist, application steps, and official link returned by `POST /api/chat`.
- `components/ApplicationTracker.jsx`: lists and creates tracked applications and updates their status through `/api/applications`. The browser stores a random session key in localStorage and sends it with each request.
- The frontend calls relative `/api` paths. The development proxy configuration in `frontend/vite.config.js` was not reviewed in this documentation pass.

## Backend (`backend/app/`)

- `main.py`: creates the FastAPI app. On startup it creates the tables and seeds schemes only if the schemes table is empty. CORS allows the origin set in `FRONTEND_ORIGIN`. Routers are mounted under `/api`.
- `config.py`: settings read from the environment or `.env`: `DATABASE_URL` (default `sqlite:///./schemesathi.db`) and `FRONTEND_ORIGIN`.
- `database.py`: SQLAlchemy engine and session factory, and table creation.
- `models/`: the `Scheme` and `ApplicationTracking` tables.
- `schemas/`: Pydantic models. `SchemeFile` validates `data/schemes.json`, including the rule that a verified scheme must have a source-verified date and an illustrative scheme must have no deadline. Other schemas validate API payloads.
- `services/seed.py`: loads `data/schemes.json` and inserts it only when the schemes table is empty. Later edits to the JSON do not reach an existing database.
- `services/profile_extractor.py`: regular-expression extraction of category, residence, income amount, income period, and whether the income is family or personal, from English text.
- `services/post_matric_rules.py`: the deterministic income check for the Telangana Post-Matric Scholarship. Income limits are hard-coded in this file and have not been verified against the official source. Monthly family income is converted to annual by multiplying by 12.
- `services/eligibility.py`: a generic deterministic evaluator for each scheme's `eligibility_conditions`. It returns PASS, FAIL, or NEEDS_INFORMATION per condition and NOT_ELIGIBLE, NEEDS_INFORMATION, or ELIGIBLE per scheme.
- `services/agent.py`: a LangGraph graph with three nodes in a fixed order: `evaluate`, then `post_matric`, then `explain`. There are no conditional branches or loops.
- `services/privacy.py`: rejects messages that mention Aadhaar, PAN, passport, or a 12-digit number. The application schema also rejects any field whose name contains "aadhaar".
- `routers/`: `health.py`, `schemes.py`, `applications.py`, and `chat.py`.

## Data (`data/schemes.json`)

- One verified record: Telangana Post-Matric Scholarships, with the official portal https://telanganaepass.cgg.gov.in/. Its recorded source-verified date must be confirmed manually against the portal before submission.
- Five illustrative records, marked `UNVERIFIED_ILLUSTRATIVE`, pointing to https://example.org/, with no deadlines. They are for development and testing only.
- No deadline is recorded for any scheme.

## API endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Health check, returns `{"status": "ok"}` |
| GET | `/api/schemes` | List schemes |
| GET | `/api/schemes/{slug}` | One scheme, or 404 |
| POST | `/api/chat` | Income assessment for a free-text message |
| POST | `/api/applications` | Start tracking a scheme for a session (409 if already tracked) |
| GET | `/api/applications?session_key=` | List tracked applications for a session |
| PATCH | `/api/applications/{id}?session_key=` | Update status; returns 404 unless the session owns the record |

## Request flow: assessment (`POST /api/chat`)

1. The message is limited to 2,000 characters and checked for sensitive identifiers. A match returns HTTP 422.
2. Profile fields are extracted from the text.
3. If the income period or the meaning of the income is unclear (for example personal salary), the response is a follow-up question and no assessment is made.
4. Otherwise the LangGraph agent evaluates the stored schemes, and the Telangana Post-Matric income check is run.
5. The response contains the explanation, the extracted profile, per-scheme results, and the recommendation for the verified scheme. The recommendation states that overall eligibility is NOT DETERMINED.

Chat requests are not written to the database.

## Application tracking

- Records are keyed by a browser session key. This is not authentication: anyone holding the key can see and update that session's records.
- Statuses: NOT_STARTED, IN_PROGRESS, SUBMITTED, COMPLETED.
- Records are not connected to any government application system.

## Privacy

- Sensitive-identifier checks are keyword and pattern based. They are not exhaustive.
- Stored data is limited to the session key, scheme, status, and timestamps of tracked applications.

## Not implemented

- No hosted LLM or LangChain integration. `LLM_PROVIDER` and `LLM_API_KEY` in `.env.example` are placeholders, and `config.py` does not read them.
- No FAISS or BM25 retrieval.
- No deadline reminders. No deadlines are verified in the data.
- No Telugu language support.
- No multi-turn conversation state. Each chat request is independent.
- No in-app editing of scheme rules. Changes to `data/schemes.json` apply only to an empty database.
- No user authentication.

## Testing

- Backend: `pytest` in `tests/`, run with `PYTHONPATH=backend`.
- Frontend: ESLint and `npm run build` in `frontend/`.

## Environment variables

- `DATABASE_URL`: default `sqlite:///./schemesathi.db`.
- `FRONTEND_ORIGIN`: default `http://localhost:5173`.
- `LLM_PROVIDER`, `LLM_API_KEY`: placeholders only, not used by the code.
