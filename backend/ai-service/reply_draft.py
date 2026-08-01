"""Reply-draft generation (see README.md — Reply-draft constraints,
non-negotiable):

- Always generated, regardless of content or sensitivity — no skip logic.
  The safety line is "never auto-send," which lives in the UI, not here.
- No invented facts, dates, numbers, or commitments beyond what's stated in
  the email. Anything the draft can't ground in the source gets a bracketed
  placeholder instead of a guess.
- Reply in the same language as the incoming email.
- Matches the sender's own tone via the style profile from style_profile.py.
- Flags drafts that themselves state a specific date/number/promise, via
  `containsCommitment`, so the UI can surface those for extra scrutiny
  before send.
"""

import json
import os

from dotenv import load_dotenv
from openai import OpenAI

from style_profile import DEFAULT_PROFILE

load_dotenv()

MODEL = os.environ.get("OPENAI_MODEL", "gpt-5-mini")

SYSTEM_PROMPT = """Draft a reply to a single email, on behalf of the recipient, in their own writing style.

Rules:
- Never invent facts, dates, numbers, or commitments beyond what's explicitly stated in the email. If the reply would need specific info (a date, a decision, a number) that isn't in the source email, use a clear placeholder like [confirm date] rather than making one up.
- Reply in the same language as the incoming email.
- Always produce a draft, even if the email doesn't obviously need a reply — a human reviews, edits, or discards it before anything is sent. Never write as if the draft will be sent unedited.
- The style profile below describes the sender's general writing habits (typical length, sign-off, contractions, quirks) — use it as the default voice. But formality is primarily set by how the EMAIL BEING REPLIED TO is actually WRITTEN, not by the profile, and not by who sent it or how high-stakes it is: if its wording is formal (e.g. "Dear...", full sentences, no slang), write a more formal reply even if the profile's default formality is casual. If its wording is casual, blunt, or informal — even if it's from a client, a stranger, or an angry/urgent escalation — match that register; do not go formal just because the situation is serious or the sender is external. Only the actual words used should drive formality, never assumptions about the relationship or stakes. Drop quirks like emoji/exclamation points only when the incoming email's own wording is genuinely formal.

Return ONLY a JSON object with exactly these fields:
- suggestedReply: the drafted reply text, including a greeting and sign-off consistent with the style profile.
- containsCommitment: true if the reply itself states a specific date, number, or promise/commitment on the user's behalf (something that should get extra scrutiny before sending), false otherwise."""


def build_user_prompt(email: dict, style_profile: dict) -> str:
    return (
        f"Style profile to write in:\n{json.dumps(style_profile, indent=2)}\n\n"
        f"Email to reply to:\n\nSubject: {email['subject']}\n\n{email['body']}"
    )


def draft_reply(email: dict, style_profile: dict | None = None) -> dict:
    style_profile = style_profile or DEFAULT_PROFILE

    client = OpenAI()
    response = client.chat.completions.create(
        model=MODEL,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": build_user_prompt(email, style_profile)},
        ],
    )
    result = json.loads(response.choices[0].message.content)
    return {
        "suggestedReply": result["suggestedReply"],
        "containsCommitment": bool(result.get("containsCommitment", False)),
    }


if __name__ == "__main__":
    import sys
    from pathlib import Path

    from style_profile import extract_style_profile

    sys.stdout.reconfigure(encoding="utf-8")

    sample_path = Path(__file__).parent / "test_data" / "sent_emails_sample.jsonl"
    with sample_path.open(encoding="utf-8") as f:
        sample_sent_emails = [json.loads(line) for line in f if line.strip()]
    profile = extract_style_profile(sample_sent_emails)

    dataset_path = Path(__file__).parent.parent.parent / "eval" / "dataset" / "labeled_emails.jsonl"
    with dataset_path.open(encoding="utf-8") as f:
        emails = [json.loads(line) for line in f if line.strip()]

    if len(sys.argv) > 1:
        emails = [e for e in emails if e["id"] == sys.argv[1]]

    for email in emails:
        draft = draft_reply(email, profile)
        flag = " [FLAGGED: commitment]" if draft["containsCommitment"] else ""
        print(f"[{email['id']}] {email['subject']}{flag}")
        print(f"  {draft['suggestedReply']}")
        print()
