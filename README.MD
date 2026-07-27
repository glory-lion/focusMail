# Project: Email Triage Assistant

## What this is

A mobile app (hackathon build, 10-day timeline, 3-person team) that connects to a user's Gmail (and later Outlook) account, automatically classifies incoming emails by urgency, summarizes them, and lets the user act on what matters without reading a full inbox. Only the last 7 days of email are ever stored; older mail is auto-discarded.

## Core user-facing features

- Log in / connect Gmail (Outlook is a secondary, additive integration — see Scope below)
- Emails automatically sorted by urgency, grouped by day (like Outlook's date-grouped list)
- Each email shows a short AI-generated summary beneath it in the list
- Opening an email shows full content + an AI-generated suggested reply
- User can send the suggested reply as-is, edit it, or write their own — **the app never auto-sends anything**
- Only the last 7 days of email are visible; anything older is discarded, not archived
- Notification preference set at onboarding, changeable later in settings:
  - **Immediate**: push notification the moment a new email is classified important
  - **Daily**: one push notification at a user-chosen time, summarizing total emails / important count / key insights

## Scope decisions (why things are built this way)

- **Suggested replies are draft-only, never auto-sent.** A wrong summary is low-stakes; a wrong reply goes out under the user's name. The UI must always route through an editable/review state before send is enabled.
- **7-day retention is a hard cutoff, not a soft archive.** This is a deliberate privacy/scope decision, not a missing feature — don't build a way to retrieve discarded emails.

## Team ownership

- **Person A — Backend & Integrations**: `/backend/api`, OAuth, Gmail/Outlook fetch, storage, 7-day discard job, notification sending
- **Person B — AI Pipeline**: `/backend/ai-service`, `/eval`
- **Person C — Mobile/Frontend**: `/mobile` — all screens (connect account, onboarding, inbox, email detail, settings)
