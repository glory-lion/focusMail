"""Concurrent batch runner (see README.md — classify-batch / Batching
behavior).

The single-email functions in classify.py, summarize.py, action_items.py,
and reply_draft.py are the building blocks. This wraps any of them to run
over a list of emails with bounded concurrency instead of one-at-a-time —
the same code path handles a 1-5 email steady-state poll and a 100+ email
onboarding backlog sweep; batch size is just how many items go in.
"""

import os
from concurrent.futures import ThreadPoolExecutor

MAX_CONCURRENCY = int(os.environ.get("AI_SERVICE_MAX_CONCURRENCY", "10"))


def run_batch(fn, items: list, max_workers: int = MAX_CONCURRENCY) -> list:
    """Runs fn(item) for every item concurrently, preserving input order."""
    if not items:
        return []
    with ThreadPoolExecutor(max_workers=min(max_workers, len(items))) as pool:
        return list(pool.map(fn, items))


def classify_batch(emails: list[dict]) -> list[dict]:
    from classify import classify_email

    important_flags = run_batch(classify_email, emails)
    return [
        {"id": email["id"], "important": important}
        for email, important in zip(emails, important_flags)
    ]


def summarize_batch(emails: list[dict]) -> list[dict]:
    from summarize import summarize_email

    summaries = run_batch(summarize_email, emails)
    return [{"id": email["id"], **summary} for email, summary in zip(emails, summaries)]


def action_items_batch(emails: list[dict]) -> list[dict]:
    from action_items import extract_deadline_and_action_items

    results = run_batch(extract_deadline_and_action_items, emails)
    return [{"id": email["id"], **result} for email, result in zip(emails, results)]


def reply_draft_batch(emails: list[dict], style_profile: dict | None = None) -> list[dict]:
    from reply_draft import draft_reply

    drafts = run_batch(lambda email: draft_reply(email, style_profile), emails)
    return [{"id": email["id"], **draft} for email, draft in zip(emails, drafts)]


def process_email(email: dict, style_profile: dict | None = None) -> dict:
    """Runs all four extractions for one email concurrently (they're
    independent of each other), producing the full classify-batch result
    shape. Used by classify_batch_full so a single email's latency is
    bounded by the slowest of the four calls, not their sum."""
    from action_items import extract_deadline_and_action_items
    from classify import classify_email
    from reply_draft import draft_reply
    from summarize import summarize_email

    with ThreadPoolExecutor(max_workers=4) as pool:
        important_future = pool.submit(classify_email, email)
        summary_future = pool.submit(summarize_email, email)
        deadline_items_future = pool.submit(extract_deadline_and_action_items, email)
        reply_future = pool.submit(draft_reply, email, style_profile)

        summary = summary_future.result()
        deadline_items = deadline_items_future.result()
        reply = reply_future.result()
        important = important_future.result()

    return {
        "id": email["id"],
        "important": important,
        "summaryShort": summary["summaryShort"],
        "summaryDetailed": summary["summaryDetailed"],
        "deadline": deadline_items["deadline"],
        "actionItems": deadline_items["actionItems"],
        "suggestedReply": reply["suggestedReply"],
        "containsCommitment": reply["containsCommitment"],
    }


def classify_batch_full(emails: list[dict], style_profile: dict | None = None) -> list[dict]:
    """The full /classify-batch pipeline: every email's 4 extractions run
    concurrently, and emails run concurrently with each other."""
    return run_batch(lambda email: process_email(email, style_profile), emails)


if __name__ == "__main__":
    import json
    import sys
    import time
    from pathlib import Path

    sys.stdout.reconfigure(encoding="utf-8")

    dataset_path = Path(__file__).parent.parent.parent / "eval" / "dataset" / "labeled_emails.jsonl"
    with dataset_path.open(encoding="utf-8") as f:
        emails = [json.loads(line) for line in f if line.strip()]

    for batch_size in (1, 5, len(emails)):
        batch = emails[:batch_size]
        start = time.perf_counter()
        results = classify_batch(batch)
        elapsed = time.perf_counter() - start
        print(f"classify_batch n={batch_size}: {elapsed:.1f}s ({elapsed / batch_size:.2f}s/email)")

    print()
    print("sample output:", json.dumps(classify_batch(emails[:3]), indent=2))
