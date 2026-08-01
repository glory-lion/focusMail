"""Style-profile extraction: turns a user's sent emails into a compact tone
profile used to make reply drafts sound like them (see README.md — Tone
matching plan).

Runs once per user at connect time. Cold start (fewer than
COLD_START_THRESHOLD sent emails available) skips the LLM call and returns
a generic neutral profile instead of extracting from too little signal.
"""

import json
import os

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

MODEL = os.environ.get("OPENAI_MODEL", "gpt-5-mini")
COLD_START_THRESHOLD = 5

DEFAULT_PROFILE = {
    "formality": "neutral",
    "avgLength": "medium",
    "usesContractions": True,
    "greeting": "casual",
    "signOff": "Thanks,",
    "quirks": "",
}

SYSTEM_PROMPT = """You analyze a person's sent emails and extract a compact writing-style profile, used later to draft replies in their voice.

Return ONLY a JSON object with exactly these fields:
- formality: "casual" | "neutral" | "formal"
- avgLength: "short" | "medium" | "long"
- usesContractions: true | false
- greeting: "none" | "casual" | "formal"  (e.g. "Hey" = casual, "Dear" = formal, no greeting at all = none)
- signOff: string  (their actual, most commonly used sign-off, verbatim — e.g. "Thanks, Vin")
- quirks: string  (short free-text notes on anything distinctive: emoji use, exclamation points, one-word replies, etc. Empty string if nothing notable.)

Base this only on patterns you actually observe across the emails provided — do not guess beyond the evidence."""


def build_user_prompt(sent_emails: list[dict]) -> str:
    formatted = "\n\n---\n\n".join(
        f"Subject: {e['subject']}\n\n{e['body']}" for e in sent_emails
    )
    return f"Here are {len(sent_emails)} of this user's sent emails:\n\n{formatted}"


def extract_style_profile(sent_emails: list[dict]) -> dict:
    if len(sent_emails) < COLD_START_THRESHOLD:
        return dict(DEFAULT_PROFILE)

    client = OpenAI()
    response = client.chat.completions.create(
        model=MODEL,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": build_user_prompt(sent_emails)},
        ],
    )
    return json.loads(response.choices[0].message.content)


if __name__ == "__main__":
    sample_path = os.path.join(os.path.dirname(__file__), "test_data", "sent_emails_sample.jsonl")
    with open(sample_path, encoding="utf-8") as f:
        sample_emails = [json.loads(line) for line in f if line.strip()]

    profile = extract_style_profile(sample_emails)
    print(json.dumps(profile, indent=2))
