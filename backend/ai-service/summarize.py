"""Summarization: produces the two summary tiers used on different screens
(see README.md — Summarization section).

- summaryShort: main list view, one line, tight character budget (placeholder
  below — confirm the real number with Person C, it depends on their
  font size/screen width, not something to guess here).
- summaryDetailed: email detail view, once opened — includes specifics the
  short version omits (meeting links, named dates/times, other concrete
  details worth surfacing).
"""

import json
import os

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

MODEL = os.environ.get("OPENAI_MODEL", "gpt-5-mini")

SHORT_SUMMARY_CHAR_BUDGET = 140  # placeholder — confirm exact budget with Person C

SYSTEM_PROMPT = f"""You summarize a single email for a mobile inbox app, at two levels of detail.

Return ONLY a JSON object with exactly these fields:
- summaryShort: one line, at most {SHORT_SUMMARY_CHAR_BUDGET} characters, for a scannable inbox list row. Core point only — no greetings, no filler.
- summaryDetailed: a fuller summary (2-4 sentences) for when the user opens the email. Include concrete specifics the short version omits: meeting links, named dates/times, numbers, names, anything actionable.

Never invent facts, dates, or details that are not present in the email."""


def build_user_prompt(email: dict) -> str:
    return f"Subject: {email['subject']}\n\n{email['body']}"


def summarize_email(email: dict) -> dict:
    client = OpenAI()
    response = client.chat.completions.create(
        model=MODEL,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": build_user_prompt(email)},
        ],
    )
    return json.loads(response.choices[0].message.content)


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
        summary = summarize_email(email)
        print(f"[{email['id']}] {email['subject']}")
        print(f"  short:    {summary['summaryShort']}  ({len(summary['summaryShort'])} chars)")
        print(f"  detailed: {summary['summaryDetailed']}")
        print()
