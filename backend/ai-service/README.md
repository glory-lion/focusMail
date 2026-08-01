# /backend/ai-service — AI Pipeline Module (Person B)

FastAPI HTTP service: classification, summarization, deadline/action-item extraction, and reply-draft generation, all backed by OpenAI. Request/response types are shared with `backend/api` via `shared/schema.py` — both services import the same file, so they can't drift apart on field names.

## Scope (current, narrowed from original plan)

- **Classification**: importance badge only — binary (important / not important). No multi-tier urgency score, no separate sensitivity classifier.
- **Summarization — two tiers, different detail levels for different screens:**
  - _Main list view_ (`summary_short`): one line, ≤140 chars (placeholder budget — still TBD with Person C, since the real limit depends on their font size/screen width).
  - _Email detail view_ (`summary_detailed`): a fuller summary — includes specifics the short version omits, e.g. meeting links, named dates, other concrete details worth surfacing once the user has opened the email.
- **Action-item to-do list extraction**: due date per item (with time-of-day when the email states one), only when actually stated in the email — never inferred from urgency language alone (e.g. "immediately"/"ASAP" without a real date → `due_date: null`). Each item has a stable `id` (hash of email id + item text) so the frontend checklist can persist checked/unchecked state across app opens. Filters out promotional/marketing calls-to-action ("buy now") — those aren't real action items.
- **Deadline**: one whole-email field, populated only if the email explicitly states a deadline; never inferred. `null` when absent. Same date/time extraction logic as action items (shares a reference-date + weekday anchor to resolve "tomorrow"/"by Friday"/"6pm" correctly).
- **Reply-draft**: always generated, regardless of email content or sensitivity — the user decides whether to use it, edit it, or ignore it. Grounded — never invents facts/dates/numbers not in the source email (uses `[confirm ...]` placeholders instead). Formality follows the *actual wording* of the incoming email, not the sender's relationship or stakes (a blunt, informal message from an angry client still gets a casual reply, matching the profile) — not the style profile's default, and not assumptions about "this is important so be formal." Flags any draft containing a specific date/number/promise via `reply_contains_commitment`, so the UI can surface it for extra scrutiny before send.
- **classify-batch**: a single endpoint handles both backlog sweep (30-100+ emails at once, at connect time) and steady-state new-mail batches (typically 0-5 emails, from a poll cycle). No separate per-email endpoint.
- **Eval**: labeled dataset + baseline + precision/recall/false-negative rate, scoped to the importance badge specifically.

## Endpoints

- `GET /health` — liveness check.
- `POST /classify-batch` — body: `{ emails: NormalizedEmail[], style_profile: StyleProfile | null }`. Returns `{ results: Classification[] }`, same order as the input `emails`. Called for both backlog sweep and every steady-state batch, regardless of size — internally, every email's classification/summarization/extraction/reply-draft runs concurrently, and emails run concurrently with each other (`batch.py: classify_batch_full`).
- `POST /style-profile` — body: `{ sent_emails: NormalizedEmail[] }`. Returns `{ profile: StyleProfile }`. One-time call per user at connect time (see Tone matching below).

## Schema

Lives in `shared/schema.py`, imported directly by both services (`pip install -e ../../shared`) — not duplicated here.

```python
class NormalizedEmail(BaseModel):
    gmail_id: str
    thread_id: str
    sender: str
    subject: str
    snippet: str
    body: Optional[str] = None   # full text; falls back to snippet if missing
    received_at: datetime
    gmail_link: str

class ActionItem(BaseModel):
    id: str
    text: str
    due_date: Optional[datetime] = None

class Classification(BaseModel):
    is_important: bool
    summary_short: str
    summary_detailed: str
    deadline: Optional[datetime] = None
    action_items: list[ActionItem] = []
    suggested_reply: str
    reply_contains_commitment: bool = False

class StyleProfile(BaseModel):
    formality: str        # "casual" | "neutral" | "formal"
    avg_length: str        # "short" | "medium" | "long"
    uses_contractions: bool
    greeting: str          # "none" | "casual" | "formal"
    sign_off: str
    quirks: str
```

`id` isn't part of `NormalizedEmail` (that's assigned by Person A's DB after classification) — internally this service uses `gmail_id` to correlate results and build stable action-item ids.

## Files

| File | Responsibility |
|---|---|
| `main.py` | FastAPI app — the two endpoints, and the adapter between shared schema (snake_case) and this service's internal dict shape (camelCase — an implementation detail, not exposed) |
| `batch.py` | Concurrency: `run_batch` (across-email), `classify_batch_full` (across-email **and** across the 4 per-email extractions) |
| `classify.py` | Importance classifier |
| `summarize.py` | Short + detailed summaries |
| `action_items.py` | Deadline + action-item checklist extraction |
| `reply_draft.py` | Reply-draft generation, tone-adapted |
| `style_profile.py` | Style-profile extraction from sent mail, + cold-start default |
| `test_data/sent_emails_sample.jsonl` | Synthetic sent-mail sample for exercising `style_profile.py` standalone |

Each of `classify.py` / `summarize.py` / `action_items.py` / `reply_draft.py` can be run standalone against the eval dataset for quick iteration: `python classify.py` (whole dataset) or `python classify.py e05` (one email by id).

## Running locally

```
pip install -r requirements.txt
pip install -e ../../shared
cp .env.example .env   # fill in OPENAI_API_KEY
uvicorn main:app --reload --port 8001
```

## Tone matching (built)

1. Runs once per (new) user, at connect time — `backend/api/app/auth/routes.py` calls `gmail_client.fetch_sent_emails` + `ai_client.build_style_profile` right after a new user is created, best-effort (a failure here doesn't block connecting).
2. `style_profile.py` extracts a compact structured profile (see `StyleProfile` above) from ~15-20 sent emails in one call, rather than raw few-shot examples.
3. Cached on `User.style_profile` (JSON column) — not re-derived per call. `poller.py` loads it and passes it into every `classify_and_summarize_batch` call.
4. Cold start: fewer than 5 sent emails available → generic neutral/casual default profile (`style_profile.DEFAULT_PROFILE`), no extraction call made.
5. Evaluation for this feature specifically: blind "does this sound like them" 1-5 rating, not precision/recall — this is a subjective quality question, not a classification one.

## Batching behavior (built)

- Same endpoint, same code path, for backlog sweep and steady-state — batch size is the only difference (large vs. typically 0-5).
- `batch.py` uses a `ThreadPoolExecutor` (not `asyncio.gather` — simpler given the OpenAI calls here are synchronous, same concurrency effect) so per-call latency stays low even at batch size 1. Nested: `classify_batch_full` runs each email's 4 extractions concurrently *and* runs multiple emails concurrently with each other.
- Measured: 18 emails classified in ~4.1s concurrently (~0.23s/email) vs. ~5.8s for a single email alone — the overhead is dominated by per-call model latency, not batch size.
- Backlog sweep can tolerate a few seconds of loading (first-connect, one-time). Steady-state batch latency is what "immediate" actually means to the user — same code path handles both.

## Reply-draft constraints (non-negotiable)

- Never assume auto-send. A human always reviews/edits before anything is sent — enforced in Person C's UI, but drafts are written knowing a human reads first, not acts on them directly.
- No invented facts, dates, or commitments beyond what's stated in the email/thread — uses `[confirm ...]` placeholders instead of guessing.
- Reply in the same language as the incoming email.
- Always generated — no sensitivity-based skip.
- Formality is driven by the incoming email's actual wording, never by the sender's relationship (client/stranger/colleague) or by stakes/urgency — a blunt, informally-written escalation from an angry client gets a casual reply, matching the style profile, not a stiff formal one just because it's "serious."

## Evaluation

- `/eval/dataset/labeled_emails.jsonl`: 19 hand-labeled sample emails — urgent, deadline-but-low-stakes, routine/no-action, and tricky edge cases (sarcasm, implicit deadline, angry tone, keyword-misuse spam).
- `/eval/baseline.py`: keyword/regex classifier for importance ("urgent"/"deadline"/etc. or a "by <day>" phrase).
- `/eval/runEval.py`: runs baseline + the real classifier (`--classifier all`, the default) against the dataset, prints accuracy/precision/recall/false-negative rate for each.
- **Measured results**: baseline 56% accuracy (50% precision, 38% recall, 62% false-negative rate) vs. real classifier 94% accuracy (89% precision, **100% recall, 0% false-negative rate**) — the real classifier never misses an important email in this set; its one miss is a false positive (cheaper failure mode).
- Reply-draft / tone-matching quality: blind 1-5 "sounds like me" rating against a no-personalization baseline, not an automated metric — not yet run.

## Open items — confirm with Person A

- ~~Full body text missing~~ — resolved: `fetch_recent_emails`/`fetch_sent_emails` now use `format="full"` and populate `body`.
- ~~`classification` shape mismatch~~ — resolved: both services import `Classification` from `shared/schema.py`.
- ~~`id` type~~ — resolved: this service keys off `gmail_id`, not a DB id.
- ~~Sent-mail fetch for tone matching~~ — resolved: `fetch_sent_emails` built, wired into connect flow.
- ~~Push vs. poll~~ — resolved: poll-based, `POLL_INTERVAL_SECONDS = 75` in `notifications/scheduler.py`.
- Auth between services — still nothing there; a shared-secret header would be enough for a hackathon, just needs to actually be added to both sides.
- Whether attachments are in scope for v1 (currently ignored entirely).
- Timeout contract is set from Person A's side (`httpx` calls use `timeout=60.0`) but not yet confirmed as the agreed number.

## Open items — confirm with Person C

- Actual character/word budget for the ≤3-line main-list summary (a number, not just "3 lines" — depends on their font/screen width). Currently using 140 chars as a placeholder.
- Whether the to-do list is interactive/checkable (needs the per-item `id` above) or read-only.
- How the reply-draft screen enforces review-before-send — confirm there's no one-tap send sitting next to the draft.
- Loading state: per-email-row or whole-list, while waiting on a response from this service.
- How null/optional fields (`deadline`, empty `action_items`) are handled in the UI — confirm not every field is assumed populated.

## Definition of done

- ✅ `/classify-batch` returns schema-conformant output for any batch size (1 to 100+, verified at 1/5/18), including edge cases in the eval set.
- ✅ `/style-profile` returns a sensible profile for both normal and cold-start (thin sent-mail history) cases.
- ✅ Eval script runs and produces a saved precision/recall/false-negative comparison against baseline (see Evaluation above).
- ✅ Reply drafts respect all constraints above (fact-grounded, language-matched, always generated, context-driven formality) — verified against the eval dataset and a real-world example (a housing-offer email).
- ✅ No dependency on Gmail/Outlook specifics — this module only ever sees `NormalizedEmail`.
- ⬜ Reply-draft / tone-matching blind quality rating — not yet run.
- ⬜ Auth between backend/api and this service — not yet added.
