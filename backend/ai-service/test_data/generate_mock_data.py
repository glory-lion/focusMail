"""One-off generator for realistic mock email data, for manually exercising
/classify-batch and /style-profile without needing real Gmail data.

Usage:
    python generate_mock_data.py
Writes test_data/mock_inbox.json and test_data/mock_sent.json.
"""

import json
import os

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

MODEL = os.environ.get("OPENAI_MODEL", "gpt-5-mini")

INBOX_PROMPT = """Generate 15 mock emails as a JSON object: {"emails": [...]}.

Each email must match this exact schema:
{
  "gmail_id": string (unique, e.g. "mock_g01"),
  "thread_id": string (unique, e.g. "mock_t01"),
  "sender": string ("Name <email@domain.com>" format),
  "subject": string,
  "snippet": string (the first ~15 words of body, truncated with "..."),
  "body": string — a REALISTIC, FULL-LENGTH email: 100-250 words, with a greeting, 2-4 natural paragraphs of real content and context (not a terse one-liner), and a sign-off/signature. Write it like an actual email a person would send, not a summary of one.
  "received_at": string (ISO 8601, spread across the last few days of July 2026),
  "gmail_link": string (e.g. "https://mail.google.com/mail/u/0/#inbox/mock_g01")
}

Cover this mix across the 15:
- 3 genuinely urgent/important (real deadline, escalation, security alert, or a decision only this person can make)
- 2 deadline-but-low-stakes (a form/survey due by a specific day, not urgent)
- 4 routine/no-action (newsletter, shipping notification, FYI, automated report)
- 6 tricky edge cases: sarcastic use of "urgent", marketing spam that says "URGENT SALE", an angry-but-not-actually-urgent message, an implicit deadline with no explicit date/keyword, a message containing "by [day]" that ISN'T actually a deadline, and an important email that has nothing to do with a deadline (e.g. a client is upset and needs a callback).

Vary senders (colleagues, external clients, automated systems, marketing) and writing styles between senders. Output only the JSON object."""

SENT_PROMPT = """Generate 8 mock "sent" emails as a JSON object: {"emails": [...]}.

Each email must match this exact schema:
{
  "gmail_id": string (unique),
  "thread_id": string (unique),
  "sender": "Me <me@example.com>",
  "subject": string,
  "snippet": string (first ~15 words of body, truncated with "..."),
  "body": string — a REALISTIC, FULL-LENGTH email: 60-180 words, natural paragraphs, not a terse one-liner.
  "received_at": string (ISO 8601, spread across the last couple weeks of July 2026),
  "gmail_link": string
}

All 8 must be written in ONE consistent, recognizable voice — pick a specific style (e.g. terse and formal, or warm and casual, or brief and to-the-point) and apply it consistently across all 8, covering varied contexts (replying to a colleague, confirming a meeting, answering a question, following up, declining something). The point is for the voice to be extractable as a pattern, not randomly different each time. Output only the JSON object."""


def generate(prompt: str) -> list[dict]:
    client = OpenAI()
    response = client.chat.completions.create(
        model=MODEL,
        response_format={"type": "json_object"},
        messages=[{"role": "user", "content": prompt}],
    )
    return json.loads(response.choices[0].message.content)["emails"]


if __name__ == "__main__":
    import sys
    from pathlib import Path

    sys.stdout.reconfigure(encoding="utf-8")
    out_dir = Path(__file__).parent

    inbox = generate(INBOX_PROMPT)
    with open(out_dir / "mock_inbox.json", "w", encoding="utf-8") as f:
        json.dump(inbox, f, ensure_ascii=False, indent=2)
    print(f"wrote {len(inbox)} emails to mock_inbox.json")

    sent = generate(SENT_PROMPT)
    with open(out_dir / "mock_sent.json", "w", encoding="utf-8") as f:
        json.dump(sent, f, ensure_ascii=False, indent=2)
    print(f"wrote {len(sent)} emails to mock_sent.json")
