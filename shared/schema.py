from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class NormalizedEmail(BaseModel):
    """An email as fetched from Gmail, before classification.

    This is the contract between Person A's fetch pipeline and Person B's
    ai-service: whatever Gmail (or later Outlook) returns gets converted into
    this exact shape before it goes anywhere else.
    """

    gmail_id: str
    thread_id: str
    sender: str
    subject: str
    snippet: str
    received_at: datetime
    gmail_link: str


class Classification(BaseModel):
    """The result of Person B's ai-service classifying + summarizing an email."""

    needs_action: bool
    has_deadline: bool
    is_important: bool
    summary: str


class ClassifiedEmail(NormalizedEmail):
    """A NormalizedEmail plus its classification, once available."""

    classification: Optional[Classification] = None
