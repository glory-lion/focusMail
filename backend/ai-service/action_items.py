"""Action-item + deadline extraction for a single email (see README.md —
Action-item to-do list extraction, and the Deadline field).

- deadline: a single, whole-email deadline (ISO 8601 date or datetime),
  populated ONLY if the email explicitly states one — never inferred.
- actionItems: a to-do checklist. Each item gets a stable id (derived from
  the email id + item text) so the frontend checklist can persist
  checked/unchecked state across app opens, plus its own optional dueDate.

Both date fields resolve relative phrases ("tomorrow", "by Friday", "6pm")
against the email's received_at + reference weekday, and include a time
component (YYYY-MM-DDTHH:MM) when the email states a specific time —
otherwise a bare date, or null if nothing is stated at all.
"""

import hashlib
import json
import os
from datetime import date

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

MODEL = os.environ.get("OPENAI_MODEL", "gpt-5-mini")

SYSTEM_PROMPT = """Extract deadline information from a single email.

Return ONLY a JSON object with exactly these fields:
- deadline: an ISO 8601 date ("YYYY-MM-DD") or datetime ("YYYY-MM-DDTHH:MM") for the email AS A WHOLE, ONLY if the email explicitly states one (e.g. "before the 6pm deadline", "due Friday"). Include the time component if a specific time is stated, otherwise just the date. null if the email does not state an overall deadline.
- actionItems: an array of objects, each with:
  - text: a short, concrete action phrased as a task (e.g. "Send the signed contract to Legal"), not a rehash of the email. Include specific details mentioned (slide numbers, names, links) when present.
  - dueDate: same format as `deadline` above (date, or datetime if a time is stated), ONLY if the email states an actual calendar date, day of week, time, or unambiguous relative day/time (e.g. "by Friday", "tomorrow", "end of month", "by 6pm"), resolved against the reference date/weekday given below. Do NOT set a date just because the email sounds urgent — words like "immediately", "ASAP", "within the hour", or "now" are urgency, not a date, and mean dueDate is null.

Only include action items where the recipient is personally being asked to do something. Skip promotional/marketing calls-to-action ("buy now", "shop the sale"), informational content, greetings, and anything already completed. If there are no genuine action items, return an empty array. Never invent a date/time that isn't grounded in the email text."""


def build_user_prompt(email: dict, reference_date: str) -> str:
    reference_weekday = date.fromisoformat(reference_date).strftime("%A")
    return (
        f"Reference date: {reference_date} ({reference_weekday}) — use this to resolve relative dates like 'tomorrow', 'Friday', or 'today'\n\n"
        f"Subject: {email['subject']}\n\n{email['body']}"
    )


def _make_item_id(email_id: str, text: str) -> str:
    text_hash = hashlib.sha1(text.strip().lower().encode()).hexdigest()[:8]
    return f"{email_id}-{text_hash}"


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
        "deadline": result.get("deadline"),
        "actionItems": [
            {
                "id": _make_item_id(email["id"], item["text"]),
                "text": item["text"],
                "dueDate": item.get("dueDate"),
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
