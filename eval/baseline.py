"""Baseline importance classifier — dumb keyword/regex, no LLM.

This is the floor the real classifier (backend/ai-service) has to beat.
Expected to get the routine/urgent cases right and fail on most of the
edge cases in dataset/labeled_emails.jsonl (sarcasm, keyword misuse,
implicit deadlines) — that gap is the evidence for why the real
classifier is needed.
"""

import re

KEYWORDS = ["urgent", "asap", "deadline", "action required", "immediately"]

DAY_OR_TIME_PATTERN = re.compile(
    r"\bby (mon(day)?|tue(s|sday)?|wed(nesday)?|thu(rs|rsday)?|fri(day)?|"
    r"sat(urday)?|sun(day)?|eod|noon|end of day|end of week|end of month)\b",
    re.IGNORECASE,
)


def classify(subject: str, body: str) -> bool:
    """Returns True (important) if the text contains an urgency keyword or a 'by <day/time>' phrase."""
    text = f"{subject} {body}".lower()
    if any(keyword in text for keyword in KEYWORDS):
        return True
    return bool(DAY_OR_TIME_PATTERN.search(text))
