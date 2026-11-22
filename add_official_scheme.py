import json
from datetime import date
from pathlib import Path

path = Path("data/schemes.json")
data = json.loads(path.read_text(encoding="utf-8-sig"))

slug = "telangana-post-matric-scholarships"

record = {
    "name": "Telangana Post-Matric Scholarships",
    "slug": slug,
    "description": (
        "Government of Telangana ePASS programme supporting eligible "
        "students pursuing post-secondary education. Income limits vary "
        "by welfare category and, for BC/EBC/Minority students, residence."
    ),
    "benefit_summary": (
        "Reimbursement of eligible tuition fees (RTF) and maintenance "
        "support (MTF), subject to applicable programme rules."
    ),
    "level": "STATE",
    "eligibility_conditions": [],
    "document_requirements": [
        "SSC examination details",
        "MeeSeva caste or relevant category certificate, where applicable",
        "MeeSeva income certificate",
        "Study or bonafide certificate",
        "Previous academic marks memo",
        "Bank account documentation where applicable",
        "CET allotment order for applicable professional courses",
        "Aadhaar documentation required by the official portal"
    ],
    "application_steps": [
        "Visit the official Telangana ePASS portal.",
        "Open Post-Matric Scholarship Services.",
        "Select the appropriate fresh or renewal registration.",
        "Review the current academic-year instructions and eligibility.",
        "Complete registration on the government portal.",
        "Provide required certificates and documents directly to ePASS.",
        "Complete applicable institution or biometric verification.",
        "Use the official portal to check application status."
    ],
    "official_url": "https://telanganaepass.cgg.gov.in/",
    "application_deadline": None,
    "source_verified_on": date.today().isoformat(),
    "verification_status": "VERIFIED",
    "is_illustrative": False
}

schemes = data["schemes"]
schemes = [s for s in schemes if s["slug"] != slug]
schemes.append(record)
data["schemes"] = schemes

path.write_text(
    json.dumps(data, indent=2, ensure_ascii=False) + "\n",
    encoding="utf-8"
)

print("Official scheme added to JSON dataset.")
print("Total records:", len(schemes))
