# Project: Email Triage Assistant

## What this is

A mobile app that connects to a user's Gmail (and later Outlook) account, automatically classifies incoming emails by urgency, summarizes them, and lets the user act on what matters without reading a full inbox. Only the last 7 days of email are ever stored; older mail is auto-discarded.

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
