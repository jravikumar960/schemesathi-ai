from app.services.scheme_groups import group_by_status


def _entry(name, status, is_illustrative=False):
    return {
        "scheme_slug": name,
        "scheme_name": name,
        "status": status,
        "rules": [],
        "is_illustrative": is_illustrative,
        "verification_status": "VERIFIED",
    }


def test_eligible_maps_to_eligible():
    entry = _entry("a", "ELIGIBLE")
    groups = group_by_status([entry])
    assert groups["eligible"] == [entry]
    assert groups["needs_information"] == []
    assert groups["not_eligible"] == []
    assert groups["not_determined"] == []


def test_needs_information_maps_to_needs_information():
    entry = _entry("a", "NEEDS_INFORMATION")
    groups = group_by_status([entry])
    assert groups["needs_information"] == [entry]
    assert groups["eligible"] == []


def test_not_eligible_maps_to_not_eligible():
    entry = _entry("a", "NOT_ELIGIBLE")
    groups = group_by_status([entry])
    assert groups["not_eligible"] == [entry]
    assert groups["eligible"] == []


def test_not_determined_maps_to_not_determined():
    entry = _entry("a", "NOT_DETERMINED")
    groups = group_by_status([entry])
    assert groups["not_determined"] == [entry]
    assert groups["eligible"] == []


def test_illustrative_entries_are_skipped():
    illustrative = _entry("ill", "ELIGIBLE", is_illustrative=True)
    real = _entry("real", "ELIGIBLE")
    groups = group_by_status([illustrative, real])
    assert groups["eligible"] == [real]


def test_order_is_preserved():
    first = _entry("first", "NOT_ELIGIBLE")
    second = _entry("second", "NOT_ELIGIBLE")
    third = _entry("third", "NOT_ELIGIBLE")
    groups = group_by_status([first, second, third])
    assert groups["not_eligible"] == [first, second, third]


def test_unknown_status_goes_to_needs_information():
    entry = _entry("a", "SOMETHING_NEW")
    groups = group_by_status([entry])
    assert groups["needs_information"] == [entry]
    assert groups["eligible"] == []
    assert groups["not_eligible"] == []
    assert groups["not_determined"] == []


def test_empty_list_gives_four_empty_lists():
    assert group_by_status([]) == {
        "eligible": [],
        "needs_information": [],
        "not_eligible": [],
        "not_determined": [],
    }
