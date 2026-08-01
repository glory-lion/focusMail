import { apiFetch, ApiError } from '@/services/apiClient';
import { getAllOverlay, getOverlay, setOverlay } from '@/services/emailOverlay';
import type { DayBucket, Email, EmailSender, WeeklyInsightsStats } from '@/types/mail';

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function dayBucketFor(date: Date): DayBucket {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((startOfToday.getTime() - startOfDate.getTime()) / 86400000);

  if (diffDays === 0) return 'TODAY';
  if (diffDays === 1) return 'YESTERDAY';
  return WEEKDAY_NAMES[date.getDay()];
}

function parseSender(raw: string): EmailSender {
  // "From" header, typically `Name <email@domain.com>` or just an address.
  const match = raw.match(/^(.*?)\s*<([^>]+)>\s*$/);
  if (match) {
    const name = match[1].replace(/^"|"$/g, '').trim();
    return { name: name || match[2], email: match[2] };
  }
  return { name: raw, email: raw };
}

// --- backend/api response shapes (see backend/api/app/routes/emails.py and shared/schema.py) ---

interface ApiActionItem {
  id: string;
  text: string;
  due_date: string | null;
}

interface ApiClassification {
  is_important: boolean;
  summary_short: string;
  summary_detailed: string;
  deadline: string | null;
  action_items: ApiActionItem[];
  suggested_reply: string;
  reply_contains_commitment: boolean;
}

interface ApiEmail {
  id: number;
  gmail_id: string;
  thread_id: string;
  sender: string;
  subject: string;
  snippet: string;
  received_at: string;
  gmail_link: string;
  classification: ApiClassification | null;
  body?: string | null;
}

interface ApiDayGroup {
  date: string;
  emails: ApiEmail[];
}

function mapApiEmail(api: ApiEmail, overlay: { read?: boolean; archived?: boolean; deleted?: boolean; replied?: boolean }): Email {
  const classification = api.classification;
  const deadlines = classification?.deadline ? [new Date(classification.deadline).toLocaleString()] : [];
  const keyPoints = [
    classification?.summary_detailed,
    ...(classification?.action_items.map((item) => item.text) ?? []),
  ].filter((v): v is string => Boolean(v));

  return {
    id: String(api.id),
    sender: parseSender(api.sender),
    subject: api.subject,
    preview: api.snippet,
    body: api.body ?? '',
    timestamp: api.received_at,
    dayBucket: dayBucketFor(new Date(api.received_at)),
    important: classification?.is_important ?? false,
    // The backend only classifies importance as a boolean — there's no
    // numeric urgency score. Kept as a 0/1 sort key (not a real "score")
    // purely so important mail floats to the top of each day's list.
    urgencyScore: classification?.is_important ? 1 : 0,
    summary: classification?.summary_short ?? api.snippet,
    detailedSummary: {
      deadlines,
      keyPoints: keyPoints.length > 0 ? keyPoints : [api.snippet],
    },
    suggestedReply: classification?.suggested_reply ?? '',
    // Not tracked by the backend yet — see services/emailOverlay.ts.
    read: overlay.read ?? true,
    hasAttachment: false,
    attachments: [],
    archived: overlay.archived ?? false,
    deleted: overlay.deleted ?? false,
    replied: overlay.replied ?? false,
  };
}

export async function getEmails(): Promise<Email[]> {
  const groups = await apiFetch<ApiDayGroup[]>('/emails');
  const overlay = await getAllOverlay();
  return groups.flatMap((group) => group.emails.map((email) => mapApiEmail(email, overlay[String(email.id)] ?? {})));
}

export async function getEmailById(id: string): Promise<Email | undefined> {
  try {
    const api = await apiFetch<ApiEmail>(`/emails/${id}`);
    const overlay = await getOverlay(id);
    return mapApiEmail(api, overlay);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return undefined;
    throw err;
  }
}

export async function sendReply(id: string, text: string): Promise<void> {
  await apiFetch(`/emails/${id}/send`, { method: 'POST', body: JSON.stringify({ body: text }) });
  await setOverlay(id, { replied: true });
}

export async function markAsRead(id: string): Promise<void> {
  await setOverlay(id, { read: true });
}

export async function markAsUnread(id: string): Promise<void> {
  await setOverlay(id, { read: false });
}

export async function setArchived(id: string, archived: boolean): Promise<void> {
  await setOverlay(id, archived ? { archived: true, deleted: false } : { archived: false });
}

export async function setDeleted(id: string, deleted: boolean): Promise<void> {
  await setOverlay(id, deleted ? { deleted: true, archived: false } : { deleted: false });
}

export interface EmailSection {
  dayBucket: DayBucket;
  data: Email[];
}

const BUCKET_ORDER = ['TODAY', 'YESTERDAY'];

export function groupEmailsByDay(emails: Email[]): EmailSection[] {
  const buckets = new Map<DayBucket, Email[]>();

  for (const email of emails) {
    const list = buckets.get(email.dayBucket) ?? [];
    list.push(email);
    buckets.set(email.dayBucket, list);
  }

  const sections: EmailSection[] = Array.from(buckets.entries()).map(([dayBucket, data]) => ({
    dayBucket,
    data: [...data].sort((a, b) => b.urgencyScore - a.urgencyScore),
  }));

  sections.sort((a, b) => {
    const aIndex = BUCKET_ORDER.indexOf(a.dayBucket);
    const bIndex = BUCKET_ORDER.indexOf(b.dayBucket);
    if (aIndex !== -1 || bIndex !== -1) {
      return (aIndex === -1 ? BUCKET_ORDER.length : aIndex) - (bIndex === -1 ? BUCKET_ORDER.length : bIndex);
    }
    // Both are weekday-named buckets further in the past; preserve most-recent-first
    // by comparing the latest timestamp in each section.
    const aLatest = Math.max(...a.data.map((e) => new Date(e.timestamp).getTime()));
    const bLatest = Math.max(...b.data.map((e) => new Date(e.timestamp).getTime()));
    return bLatest - aLatest;
  });

  return sections;
}

export type EmailFilter = 'all' | 'unread' | 'attachments' | 'urgent' | 'archived' | 'deleted';

export function filterEmails(emails: Email[], filter: EmailFilter): Email[] {
  if (filter === 'archived') {
    return emails.filter((email) => email.archived);
  }
  if (filter === 'deleted') {
    return emails.filter((email) => email.deleted);
  }

  const active = emails.filter((email) => !email.archived && !email.deleted);
  switch (filter) {
    case 'unread':
      return active.filter((email) => !email.read);
    case 'attachments':
      return active.filter((email) => email.hasAttachment);
    case 'urgent':
      return active.filter((email) => email.important);
    default:
      return active;
  }
}

export function getWeeklyStats(emails: Email[]): WeeklyInsightsStats {
  // "Critical" = important AND has an actual deadline attached — the only
  // two real signals the backend gives us, no fabricated scoring involved.
  const critical = emails.filter(
    (email) => email.important && (email.detailedSummary.deadlines?.length ?? 0) > 0
  ).length;
  const needAction = emails.filter(
    (email) => email.important && (email.detailedSummary.deadlines?.length ?? 0) === 0
  ).length;
  const unread = emails.filter((email) => !email.read).length;

  return {
    totalEmails: emails.length,
    needAction,
    unread,
    critical,
  };
}
