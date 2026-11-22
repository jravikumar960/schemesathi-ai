"""Group evaluated scheme results by eligibility status.

Purely presentational: each entry is passed through unchanged and no
eligibility rule is applied here.
"""

_STATUS_TO_GROUP = {
    "ELIGIBLE": "eligible",
    "NEEDS_INFORMATION": "needs_information",
    "NOT_ELIGIBLE": "not_eligible",
    "NOT_DETERMINED": "not_determined",
}


def group_by_status(results: list[dict]) -> dict:
    groups = {
        "eligible": [],
        "needs_information": [],
        "not_eligible": [],
        "not_determined": [],
    }

    for entry in results:
        if entry.get("is_illustrative") is True:
            continue

        group = _STATUS_TO_GROUP.get(entry.get("status"), "needs_information")
        groups[group].append(entry)

    return groups
