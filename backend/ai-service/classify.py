"""Importance classification: binary important/not-important flag for a
single email (see README.md — Classification: importance badge only, no
multi-tier urgency score).
"""

import json
import os

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

MODEL = os.environ.get("OPENAI_MODEL", "gpt-5-mini")

SYSTEM_PROMPT = """Classify whether a single email is important enough that the recipient should be interrupted/notified, versus something they can skim or ignore.

Return ONLY a JSON object with exactly this field:
- important: true | false

Mark important=true for: genuine deadlines or time pressure, requests that specifically need this person's action/decision, escalations, an upset sender needing a response, security/account alerts.
Mark important=false for: newsletters, marketing/promotional content, automated receipts/notifications, FYI-only messages, routine social messages with no ask, and sarcastic/joking use of urgent-sounding language that isn't a real request.

Do not be fooled by urgency keywords alone ("urgent", "ASAP") when the content is actually promotional or sarcastic. Do not miss real urgency just because it lacks those keywords."""


def build_user_prompt(email: dict) -> str:
    return f"Subject: {email['subject']}\n\n{email['body']}"


def classify_email(email: dict) -> bool:
    client = OpenAI()
    response = client.chat.completions.create(
        model=MODEL,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": build_user_prompt(email)},
        ],
    )
    result = json.loads(response.choices[0].message.content)
    return bool(result["important"])


if __name__ == "__main__":
    import sys
    from pathlib import Path

    sys.stdout.reconfigure(encoding="utf-8")

    dataset_path = Path(__file__).parent.parent.parent / "eval" / "dataset" / "labeled_emails.jsonl"
    with dataset_path.open(encoding="utf-8") as f:
        emails = [json.loads(line) for line in f if line.strip()]

    if len(sys.argv) > 1:
        emails = [e for e in emails if e["id"] == sys.argv[1]]

    correct = 0
    for email in emails:
        predicted = classify_email(email)
        actual = email["important"]
        ok = predicted == actual
        correct += ok
        status = "OK" if ok else "MISS"
        print(f"[{email['id']}] predicted={predicted!s:5} actual={actual!s:5} {status}  {email['subject']}")

    print(f"\naccuracy: {correct}/{len(emails)} = {correct / len(emails):.0%}")
