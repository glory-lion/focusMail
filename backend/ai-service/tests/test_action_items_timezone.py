"""Regression test for the deadline/due-date timezone bug: naive times
extracted by the LLM were getting a blanket "treat as UTC" conversion
applied on the frontend, which is correct for received_at (genuinely UTC)
but was wrong for LLM-extracted deadlines (no defined timezone at the
time). Fixed by having action_items.py always resolve to a real UTC value
before it ever reaches the frontend — see action_items.py's
_normalize_to_utc_naive and DEFAULT_TIMEZONE.

These are integration tests — they call the real OpenAI API (need
OPENAI_API_KEY in .env) rather than mocking the model, since the bug was
specifically about date/timezone arithmetic the model needs to get right.
"""

from action_items import extract_deadline_and_action_items

# Anchors "Thursday"/"Friday" phrasing to the correct calendar dates.
RECEIVED_AT = "2026-08-03T09:00:00"


def test_no_timezone_stated_assumes_recipient_local_time():
    """'5pm' with no timezone stated must NOT be treated as literally
    UTC (that was the bug — displayed as 1am the next day in SGT). It
    should assume DEFAULT_TIMEZONE (recipient's local time, SGT/UTC+8)
    and convert to UTC — so 5pm SGT normalizes to 09:00 UTC, which
    displays back as 5pm SGT with no shift."""
    email = {
        "id": "tz-test-no-zone",
        "subject": "Contract review",
        "body": "Please review the attached contract and get back to us by Friday, August 7 at 5pm.",
        "received_at": RECEIVED_AT,
    }

    result = extract_deadline_and_action_items(email)

    assert result["deadline"] == "2026-08-07T09:00:00"


def test_explicit_timezone_converts_to_utc():
    """'2pm ET' must be converted using the stated timezone, not treated
    as a bare local number. Eastern is in daylight time (UTC-4) in
    August, so 2pm ET -> 18:00 UTC."""
    email = {
        "id": "tz-test-explicit-zone",
        "subject": "Call scheduling",
        "body": "Can we schedule the kickoff call for Thursday, August 6 at 2pm ET?",
        "received_at": RECEIVED_AT,
    }

    result = extract_deadline_and_action_items(email)

    assert result["deadline"] == "2026-08-06T18:00:00"


def test_date_only_deadline_is_untouched_by_timezone_logic():
    """A bare date (no time stated) has no time-of-day, so no timezone
    assumption should be applied — it must stay a plain date, not shift
    to a neighboring day. Uses an explicit calendar date rather than a
    relative day name ("by Friday") deliberately: relative-day resolution
    is a separate concern from timezone handling, and mixing the two
    would make a failure here ambiguous about which one broke."""
    email = {
        "id": "tz-test-date-only",
        "subject": "Form due",
        "body": "Please submit the form by August 7.",
        "received_at": RECEIVED_AT,
    }

    result = extract_deadline_and_action_items(email)

    assert result["deadline"] == "2026-08-07"
