"""Regression test for a relative-weekday resolution bug: "by Friday" with
a Monday reference date was resolved to Thursday (one day early) instead
of the correct Friday — the model was asked to mentally count forward from
"today is Monday," which it got wrong. Fixed in action_items.py's
build_user_prompt by giving it a precomputed date-to-weekday-name lookup
table instead of asking it to do the arithmetic itself.

Integration test — calls the real OpenAI API rather than mocking, since
the bug was specifically about the model's own date reasoning.
"""

from action_items import extract_deadline_and_action_items

# 2026-08-03 is a Monday; the next Friday is 2026-08-07.
RECEIVED_AT = "2026-08-03T09:00:00"


def test_relative_weekday_resolves_to_correct_date():
    email = {
        "id": "weekday-test-friday",
        "subject": "Form due",
        "body": "Please submit the form by Friday.",
        "received_at": RECEIVED_AT,
    }

    result = extract_deadline_and_action_items(email)

    assert result["deadline"] == "2026-08-07"
