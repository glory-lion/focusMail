"""Generates a large synthetic labeled dataset for eval at scale.

IMPORTANT CAVEAT: labels here are LLM-assigned against an explicit rubric,
not independently hand-labeled like the original 19-email
labeled_emails.jsonl. Evaluating an LLM classifier against LLM-labeled
data is more circular than evaluating against independently-reasoned
ground truth — describe this dataset honestly (e.g. "LLM-generated,
rubric-labeled, spot-checked") rather than "hand-labeled." Recommended:
manually spot-check a random sample before trusting the numbers.

Usage:
    python generate_large_dataset.py [target_count]   # default 1000
Writes labeled_emails_1000.jsonl (or labeled_emails_<N>.jsonl) alongside
the original curated labeled_emails.jsonl.
"""

import json
import os
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv(Path(__file__).parent.parent.parent / "backend" / "ai-service" / ".env")

MODEL = os.environ.get("OPENAI_MODEL", "gpt-5-mini")
BATCH_SIZE = 25
MAX_CONCURRENCY = 8

CATEGORIES = [
    "urgent",
    "deadline_low_stakes",
    "routine",
    "edge_sarcasm",
    "edge_implicit_deadline",
    "edge_angry_tone",
    "edge_keyword_misuse",
    "edge_implicit_high_stakes",
    "edge_false_positive_trap",
]

PROMPT_TEMPLATE = """Generate {n} mock emails as a JSON object: {{"emails": [...]}}.

Each email must match this exact schema:
{{
  "category": string (one of: {categories}),
  "sender": string ("Name <email@domain.com>" format),
  "subject": string,
  "body": string — a realistic email, 60-180 words, natural paragraphs, greeting and sign-off, like a real email a person would receive (not a terse one-liner, not a summary of one),
  "important": boolean — ground truth label per this rubric: true if the email states or clearly implies the recipient must take a specific action within a bounded timeframe, OR represents genuine urgent/escalated/security-related content needing near-term attention. false for newsletters, marketing, automated notifications, FYI-only content, routine social messages with no real ask, and sarcastic/joking use of urgent-sounding language that isn't a real request.
}}

Distribute the {n} emails roughly across these categories, varying senders/domains/writing styles (work, personal, school, banking, shopping, travel, subscriptions, healthcare, dating apps, community groups):
- ~20% urgent (real deadline, escalation, security alert, decision only the recipient can make) — important=true
- ~15% deadline_low_stakes (a form/survey due by a specific day, not urgent) — important=true
- ~30% routine (newsletter, shipping notification, FYI, automated report, routine social) — important=false
- ~35% split across edge cases: sarcastic use of "urgent" (important=false), an angry-but-not-actually-urgent message (important=false), marketing spam using urgency keywords like "URGENT SALE" (important=false), an implicit deadline with no explicit keyword but real time pressure (important=true), a message containing "by [day]" that ISN'T actually a deadline e.g. "I'll stop by Friday" (important=false), and an important message with no deadline at all e.g. an upset client needing a callback (important=true)

Make each email genuinely different in content, sender, and phrasing — no template repetition. Output only the JSON object."""


def generate_batch(batch_index: int, n: int) -> list[dict]:
    client = OpenAI()
    prompt = PROMPT_TEMPLATE.format(n=n, categories=", ".join(CATEGORIES))
    response = client.chat.completions.create(
        model=MODEL,
        response_format={"type": "json_object"},
        messages=[{"role": "user", "content": prompt}],
    )
    emails = json.loads(response.choices[0].message.content)["emails"]
    for i, email in enumerate(emails):
        email["id"] = f"g{batch_index:03d}-{i:02d}"
    return emails


def main(target_count: int) -> None:
    num_batches = -(-target_count // BATCH_SIZE)  # ceil division
    batch_sizes = [BATCH_SIZE] * num_batches
    remainder = target_count - BATCH_SIZE * num_batches
    if remainder:
        batch_sizes[-1] += remainder  # absorb leftover into last batch

    print(f"generating {target_count} emails in {num_batches} batches of ~{BATCH_SIZE}...")

    all_emails: list[dict] = []
    with ThreadPoolExecutor(max_workers=MAX_CONCURRENCY) as pool:
        futures = [
            pool.submit(generate_batch, i, size) for i, size in enumerate(batch_sizes)
        ]
        for i, future in enumerate(futures):
            try:
                batch = future.result()
                all_emails.extend(batch)
                print(f"  batch {i + 1}/{num_batches} done ({len(batch)} emails, {len(all_emails)} total)")
            except Exception as e:
                print(f"  batch {i + 1}/{num_batches} FAILED: {e}")

    out_path = Path(__file__).parent / f"labeled_emails_{target_count}.jsonl"
    with out_path.open("w", encoding="utf-8") as f:
        for email in all_emails:
            f.write(json.dumps(email, ensure_ascii=False) + "\n")

    print(f"\nwrote {len(all_emails)} emails to {out_path}")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    target = int(sys.argv[1]) if len(sys.argv) > 1 else 1000
    main(target)
