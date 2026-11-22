# SchemeSathi — recommendation-first rebuild (2026-11-22)

## What changed
- Main Discover screen now shows **only ELIGIBLE** source-backed scheme matches, not all catalogue records.
- `NEEDS_INFORMATION` results appear separately, collapsed, with rule-specific questions; failed and unverified programmes are not recommended.
- Structured programme rules in `data/schemes.json` are now synced into the existing database at FastAPI startup (by slug, without deleting applications or other records).
- Two programmes are marked source-checked using government pages: Telangana ePASS Post-Matric Scholarship and Mahatma Jyothiba Phule BC/EBC Overseas Vidya Nidhi. The other named programmes remain unverified and are not recommended.
- Profile parsing now recognises more education/admission context, and ePASS category-specific income rules are applied by the eligibility engine. The LangGraph workflow remains in place.
- Post-Matric deadline: **31 March 2027**, as displayed by the government ePASS Student Services page checked 22 November 2026.

## Important limits
- This pilot targets Telangana students, which the hackathon explicitly permits as one audience in one state. Pension matching is **not implemented**.
- The official ePASS portal may have newer 2026-27 rules not reflected on its older eligibility pages; verify current government orders before production use. Source checked dates mean page reviewed, not legal certification of the entire scheme.
- "Likely eligible" means all rules recorded in the dataset passed; it is not an award guarantee. Other official conditions may apply.
- No email/push notification service exists. Reminder UI works only in an open browser tab when deadlines are available.
- Current user database is preserved. Back it up before first startup because the app syncs the official scheme entries by slug.

## Deploy to existing Codebenders project
1. Back up `R:\Hack\schemesathi.db` (while server stopped).
2. Extract this ZIP to a new folder; copy `frontend/src/App.jsx`, `backend/app/main.py`, `backend/app/routers/chat.py`, `backend/app/services/{agent,profile_extractor}.py`, and `data/schemes.json` into corresponding locations under `R:\Hack`.
3. From `R:\Hack`, set `PYTHONPATH=R:\Hack\backend` and run backend with the existing `.venv`. Run `npm run build` and `npm run lint` in `R:\Hack\frontend`.
4. Check example profiles: BC B.Tech ₹1.8 lakh urban (requires admission/mode info); BC B.Tech regular convener quota ₹1.8 lakh urban (post-matric likely match); BC B.Tech ₹3 lakh urban (excluded).

## Sources reviewed
- https://telanganaepass.cgg.gov.in/WhoareEligible.do
- https://telanganaepass.cgg.gov.in/Scholarships.do
- https://telanganaepass.cgg.gov.in/epassonlinelinks.do
- https://telanganaepass.cgg.gov.in/FreshRegistration202627.do
- https://mahabubnagar.telangana.gov.in/bc-development/

## Verification performed
- Python syntax compilation: passed.
- Dataset Pydantic validation: passed (10 entries; 2 verified, 3 unverified named, 5 illustrative).
- Four sample-profile rule checks: passed expected outputs.
- Full pytest suite: could not collect due to `langgraph` not installed in this container.
- Frontend npm build/lint: could not run because npm offline cache lacks dependencies. Run on Codebenders machine with installed node_modules.
