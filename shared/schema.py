from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class Attachment(BaseModel):
    """Safe attachment metadata. Attachment contents are never persisted."""

    attachment_id: str
    filename: str
    mime_type: str
    size: int = 0


class NormalizedEmail(BaseModel):
    """An email as fetched from Gmail, before classification.

    This is the contract between Person A's fetch pipeline and Person B's
    ai-service: whatever Gmail (or later Outlook) returns gets converted into
    this exact shape before it goes anywhere else.

    `body` is optional because it's currently only fetched on-demand (see
    GET /emails/{id}) rather than stored for every email — but the
    ai-service needs full body text to produce a meaningful detailed
    summary, deadline/action-item extraction, or reply draft. A snippet
    alone isn't enough for those. Needs a decision: fetch body eagerly
    during the backlog sweep so classification always has it, or accept
    that classification runs on snippet-only until the email is opened.
    """

    gmail_id: str
    thread_id: str
    sender: str
    subject: str
    snippet: str
    body: Optional[str] = None
    received_at: datetime
    gmail_link: str
    attachments: list[Attachment] = Field(default_factory=list)


class ActionItem(BaseModel):
    """A single to-do extracted from an email. `id` is stable across
    re-classification (derived from the email + item text) so the frontend
    checklist can persist checked/unchecked state across app opens."""

    id: str
    text: str
    due_date: Optional[datetime] = None


class Classification(BaseModel):
    """The result of Person B's ai-service classifying + summarizing an
    email. Expanded from the original needs_action/has_deadline/is_important/
    summary shape — that version had no field for the action-item checklist
    or the reply draft, both of which are core app features (see root
    README.MD). needs_action and has_deadline are still derivable
    (bool(action_items), deadline is not None) if existing code checks them."""

    is_important: bool
    urgency_score: int = Field(default=0, ge=0, le=100)  # derived, for frontend sort/threshold — is_important stays the source of truth
    summary_short: str  # <=3 lines, for the inbox list view
    summary_detailed: str  # fuller summary for the email detail view — meeting links, dates, specifics
    deadline: Optional[datetime] = None  # only if explicitly stated in the email; never inferred
    action_items: list[ActionItem] = []
    suggested_reply: str  # always generated — draft only, never auto-sent
    reply_contains_commitment: bool = False  # true if suggested_reply itself states a specific date/number/promise — surface for extra scrutiny before send


class ClassifiedEmail(NormalizedEmail):
    """A NormalizedEmail plus its classification, once available."""

    classification: Optional[Classification] = None


class StyleProfile(BaseModel):
    """Extracted once per user from their sent mail (POST /style-profile),
    cached by Person A, and passed into every subsequent /classify-batch
    call so suggested_reply matches how the user actually writes."""

    formality: str  # "casual" | "neutral" | "formal"
    avg_length: str  # "short" | "medium" | "long"
    uses_contractions: bool
    greeting: str  # "none" | "casual" | "formal"
    sign_off: str
    quirks: str
