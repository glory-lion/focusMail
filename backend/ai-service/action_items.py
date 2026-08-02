"""Action-item + deadline extraction for a single email (see README.md —
Action-item to-do list extraction, and the Deadline field).

- deadline: a single, whole-email deadline (ISO 8601 date or datetime),
  populated ONLY if the email explicitly states one — never inferred.
- actionItems: a to-do checklist. Each item gets a stable id (derived from
  the email id + item text) so the frontend checklist can persist
  checked/unchecked state across app opens, plus its own optional dueDate —
  populated only for a stated due date, EXCEPT one documented exception:
  a task to attend/confirm/prepare for a specific event inherits that
  event's own stated date/time as its dueDate (see SYSTEM_PROMPT).

Both date fields resolve relative phrases ("tomorrow", "by Friday", "6pm")
against the email's received_at + reference weekday, and include a time
component (YYYY-MM-DDTHH:MM) when the email states a specific time —
otherwise a bare date, or null if nothing is stated at all. Any stated
time is converted to UTC: an explicit timezone/abbreviation ("2pm ET") is
converted directly; a bare time with no timezone at all is assumed to be
in DEFAULT_TIMEZONE (a hardcoded placeholder for "the recipient's local
time" until per-user timezone tracking exists) before converting.
"""

import hashlib
import json
import os
from datetime import date, datetime, timedelta, timezone

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

MODEL = os.environ.get("OPENAI_MODEL", "gpt-5-mini")

# Placeholder until per-user timezone tracking exists (User model has no
# such field yet): any email that states a time with NO timezone at all is
# assumed to mean the recipient's own local time — SGT/UTC+8 hardcoded
# here as a single fixed default, not a real multi-user solution. The
# model is deliberately NOT asked to guess/convert this case itself (see
# SYSTEM_PROMPT) — it just emits the bare literal time, and this constant
# is where the "assume it's local time" decision actually happens, in
# Python, deterministically. See _normalize_to_utc_naive below.
DEFAULT_TIMEZONE = timezone(timedelta(hours=8))

SYSTEM_PROMPT = """Extract deadline information from a single email.

Return ONLY a JSON object with exactly these fields:
- deadline: an ISO 8601 date ("YYYY-MM-DD") or datetime ("YYYY-MM-DDTHH:MM:SS") for the email AS A WHOLE, ONLY if the email explicitly states one (e.g. "before the 6pm deadline", "due Friday"). Timezone handling: if the email states an explicit timezone or abbreviation ("2pm ET", "10am PST", "14:00 GMT+2"), CONVERT that stated time to UTC and emit it WITH a trailing "Z" (e.g. "2026-08-06T18:00:00Z") — never emit the local number as if it were UTC. If the email states a time with NO timezone at all, do NOT guess or convert — emit the bare local time with NO "Z" and no offset (e.g. "2026-08-07T17:00:00"); a fixed default timezone is applied downstream, not by you. If only a date is stated (no time), just emit the date with no time component. null if the email does not state an overall deadline.
- actionItems: an array of objects, each with:
  - text: a short, concrete action phrased as a task (e.g. "Send the signed contract to Legal"), not a rehash of the email. Include specific details mentioned (slide numbers, names, links) when present.
  - dueDate: same format and timezone rules as `deadline` above, ONLY if the email states an actual calendar date, day of week, time, or unambiguous relative day/time (e.g. "by Friday", "tomorrow", "end of month", "by 6pm"), resolved against the reference date/weekday given below. Do NOT set a date just because the email sounds urgent — words like "immediately", "ASAP", "within the hour", or "now" are urgency, not a date, and mean dueDate is null. Explicit exception: if the task is to attend/confirm/prepare for a specific event that itself has a stated date/time (e.g. "confirm attendance for Tuesday's 2pm kickoff"), use that event's date/time as the task's dueDate, even though no separate deadline was stated for the task itself — the event's own timing is the natural due date for anything that must happen by or at the event.

Only include action items where the recipient is personally being asked to do something. Skip promotional/marketing calls-to-action ("buy now", "shop the sale"), informational content, greetings, and anything already completed. If there are no genuine action items, return an empty array. Never invent a date/time that isn't grounded in the email text."""


def build_user_prompt(email: dict, reference_date: str) -> str:
    ref = date.fromisoformat(reference_date)
    # A precomputed lookup table, not just "today is Monday" — LLMs are
    # unreliable at mentally counting forward to "the next Friday from a
    # Monday" and can be off by a day. Giving every date its weekday name
    # directly turns this into a lookup instead of arithmetic.
    calendar_lines = "\n".join(
        f"  {(ref + timedelta(days=offset)).isoformat()} = {(ref + timedelta(days=offset)).strftime('%A')}"
        for offset in range(14)
    )
    return (
        f"Reference date: {ref.isoformat()} ({ref.strftime('%A')})\n"
        "Upcoming dates (use this table directly to resolve day names like "
        "'Friday' or 'next Tuesday' — do not compute weekdays yourself):\n"
        f"{calendar_lines}\n\n"
        f"Subject: {email['subject']}\n\n{email['body']}"
    )


def _make_item_id(email_id: str, text: str) -> str:
    text_hash = hashlib.sha1(text.strip().lower().encode()).hexdigest()[:8]
    return f"{email_id}-{text_hash}"


def _normalize_to_utc_naive(value: str | None) -> str | None:
    """Defensive normalization independent of the model actually following
    the prompt's formatting rules.

    - Date-only ("YYYY-MM-DD", no "T"): no time-of-day, nothing to convert
      — returned as-is.
    - Datetime with an explicit offset/"Z" (model converted a stated
      timezone like "ET" itself): converted to UTC directly.
    - Datetime with no offset (no timezone was stated in the email, per
      the prompt the model leaves this bare rather than guessing):
      DEFAULT_TIMEZONE is assumed here — deterministically, not left to
      the model — then converted to UTC.

    Either way, the returned value is stripped back to naive before
    returning. The rest of this codebase stores naive-but-implicitly-UTC
    datetimes throughout (see gmail/client.py's received_at) specifically
    because SQLite strips tzinfo on read-back and mixing naive/aware
    datetimes later raises a TypeError when comparing them — this keeps
    deadline/due_date consistent with that same convention.
    """
    if not value:
        return None
    if "T" not in value:
        return value  # date-only — no time-of-day to apply a timezone to
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return value  # unparseable — pass through rather than silently drop
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=DEFAULT_TIMEZONE)
    return parsed.astimezone(timezone.utc).replace(tzinfo=None).isoformat()


def extract_deadline_and_action_items(email: dict) -> dict:
    reference_date = email.get("received_at", date.today().isoformat())[:10]

    client = OpenAI()
    response = client.chat.completions.create(
        model=MODEL,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": build_user_prompt(email, reference_date)},
        ],
    )
    result = json.loads(response.choices[0].message.content)

    return {
        "deadline": _normalize_to_utc_naive(result.get("deadline")),
        "actionItems": [
            {
                "id": _make_item_id(email["id"], item["text"]),
                "text": item["text"],
                "dueDate": _normalize_to_utc_naive(item.get("dueDate")),
            }
            for item in result.get("actionItems", [])
        ],
    }


if __name__ == "__main__":
    import sys
    from pathlib import Path

    sys.stdout.reconfigure(encoding="utf-8")

    dataset_path = Path(__file__).parent.parent.parent / "eval" / "dataset" / "labeled_emails.jsonl"
    with dataset_path.open(encoding="utf-8") as f:
        emails = [json.loads(line) for line in f if line.strip()]

    if len(sys.argv) > 1:
        emails = [e for e in emails if e["id"] == sys.argv[1]]

    for email in emails:
        result = extract_deadline_and_action_items(email)
        print(f"[{email['id']}] {email['subject']}  (deadline: {result['deadline'] or 'none'})")
        if not result["actionItems"]:
            print("  (no action items)")
        for item in result["actionItems"]:
            due = item["dueDate"] or "—"
            print(f"  - [{item['id']}] {item['text']}  (due: {due})")
        print()
