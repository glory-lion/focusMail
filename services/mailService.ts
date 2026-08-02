import { apiFetch, ApiError } from '@/services/apiClient';
import type { ActionItem, Attachment, DayBucket, Email, EmailSender, WeeklyInsightsStats } from '@/types/mail';

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const CRITICAL_URGENCY_THRESHOLD = 90;

function dayBucketFor(date: Date): DayBucket {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((startOfToday.getTime() - startOfDate.getTime()) / 86400000);

  if (diffDays === 0) return 'TODAY';
  if (diffDays === 1) return 'YESTERDAY';
  return WEEKDAY_NAMES[date.getDay()];
}

// backend/api stores and serializes datetimes as naive UTC (no "Z"/offset,
// e.g. "2026-07-28T09:00:00") — but JS's Date constructor treats a
// timezone-less ISO string as LOCAL time, not UTC. Left alone, every
// timestamp would be off by exactly the device's UTC offset. Fixed once
// here, at the API boundary, so every downstream consumer that does
// `new Date(email.timestamp)` gets a correctly UTC-tagged string already.
function utcIso(raw: string): string {
  return /Z|[+-]\d\d:\d\d$/.test(raw) ? raw : `${raw}Z`;
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

function formatFileSize(bytes: number): string {
  if (bytes <= 0) return '0 KB';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(unitIndex === 0 || value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

const MIME_TYPE_LABELS: Record<string, string> = {
  'application/pdf': 'PDF Document',
  'application/msword': 'Word Document',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Document',
  'application/vnd.ms-excel': 'Excel Spreadsheet',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel Spreadsheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint Presentation',
  'image/png': 'PNG Image',
  'image/jpeg': 'JPEG Image',
  'image/gif': 'GIF Image',
  'text/plain': 'Text File',
  'text/csv': 'CSV File',
};

function fileTypeLabel(mimeType: string): string {
  return MIME_TYPE_LABELS[mimeType] ?? mimeType.split('/')[1]?.toUpperCase() ?? 'File';
}

// --- backend/api response shapes (see backend/api/app/routes/emails.py and shared/schema.py) ---

interface ApiActionItem {
  id: string;
  text: string;
  due_date: string | null;
}

interface ApiClassification {
  is_important: boolean;
  urgency_score: number;
  summary_short: string;
  summary_detailed: string;
  deadline: string | null;
  action_items: ApiActionItem[];
  suggested_reply: string;
  reply_contains_commitment: boolean;
}

interface ApiAttachment {
  attachment_id: string;
  filename: string;
  mime_type: string;
  size: number;
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
  attachments: ApiAttachment[];
  has_attachment: boolean;
  is_read: boolean;
  is_archived: boolean;
  is_deleted: boolean;
  is_replied: boolean;
}

interface ApiDayGroup {
  date: string;
  emails: ApiEmail[];
}

function mapApiAttachment(api: ApiAttachment): Attachment {
  return {
    fileName: api.filename,
    fileSizeLabel: formatFileSize(api.size),
    fileType: fileTypeLabel(api.mime_type),
  };
}

function mapApiEmail(api: ApiEmail): Email {
  const classification = api.classification;
  const deadline = classification?.deadline ? utcIso(classification.deadline) : null;
  const deadlines = deadline ? [new Date(deadline).toLocaleString()] : [];
  const keyPoints = [classification?.summary_detailed].filter((v): v is string => Boolean(v));
  const actionItems: ActionItem[] = (classification?.action_items ?? []).map((item) => ({
    id: item.id,
    text: item.text,
    dueDate: item.due_date ? utcIso(item.due_date) : null,
  }));

  return {
    id: String(api.id),
    sender: parseSender(api.sender),
    subject: api.subject,
    preview: api.snippet,
    body: api.body ?? '',
    timestamp: utcIso(api.received_at),
    dayBucket: dayBucketFor(new Date(utcIso(api.received_at))),
    gmailLink: api.gmail_link,
    important: classification?.is_important ?? false,
    urgencyScore: classification?.urgency_score ?? 0,
    deadline,
    summary: classification?.summary_short ?? api.snippet,
    detailedSummary: {
      deadlines,
      keyPoints: keyPoints.length > 0 ? keyPoints : [api.snippet],
    },
    suggestedReply: classification?.suggested_reply ?? '',
    actionItems,
    read: api.is_read,
    hasAttachment: api.has_attachment,
    attachments: api.attachments.map(mapApiAttachment),
    archived: api.is_archived,
    deleted: api.is_deleted,
    replied: api.is_replied,
  };
}

async function patchEmailState(
  id: string,
  patch: Partial<{ is_read: boolean; is_archived: boolean; is_deleted: boolean; is_replied: boolean }>
): Promise<void> {
  await apiFetch(`/emails/${id}/state`, { method: 'PATCH', body: JSON.stringify(patch) });
}

export async function getEmails(): Promise<Email[]> {
  // Fetch archived/deleted too — filterEmails below does that split
  // client-side over the full list, so it needs everything present.
  const groups = await apiFetch<ApiDayGroup[]>('/emails?include_archived=true&include_deleted=true');
  return groups.flatMap((group) => group.emails.map(mapApiEmail));
}

export async function getEmailById(id: string): Promise<Email | undefined> {
  try {
    const api = await apiFetch<ApiEmail>(`/emails/${id}`);
    // GET /emails/{id} already marks is_read=true server-side on open.
    return mapApiEmail(api);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return undefined;
    throw err;
  }
}

export interface ReplyAttachment {
  name: string;
  mimeType: string;
  base64: string;
}

export async function sendReply(
  id: string,
  text: string,
  attachments: ReplyAttachment[] = []
): Promise<void> {
  // POST /emails/{id}/send already sets is_replied=true server-side.
  await apiFetch(`/emails/${id}/send`, {
    method: 'POST',
    body: JSON.stringify({
      body: text,
      attachments: attachments.map((a) => ({
        filename: a.name,
        mime_type: a.mimeType,
        content_base64: a.base64,
      })),
    }),
  });
}

export async function markAsRead(id: string): Promise<void> {
  await patchEmailState(id, { is_read: true });
}

export async function markAsUnread(id: string): Promise<void> {
  await patchEmailState(id, { is_read: false });
}

export async function setArchived(id: string, archived: boolean): Promise<void> {
  await patchEmailState(id, archived ? { is_archived: true, is_deleted: false } : { is_archived: false });
}

export async function setDeleted(id: string, deleted: boolean): Promise<void> {
  await patchEmailState(id, deleted ? { is_deleted: true, is_archived: false } : { is_deleted: false });
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

  // Plain reverse-chronological — urgencyScore/deadline-based priority
  // sort was tried and dropped: too many real emails (e.g. one message
  // covering several unrelated tasks with different due dates) don't fit
  // a single "how urgent is this" score cleanly, making the ordering less
  // predictable than just showing newest first.
  const sections: EmailSection[] = Array.from(buckets.entries()).map(([dayBucket, data]) => ({
    dayBucket,
    data: [...data].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
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
  const critical = emails.filter((email) => email.urgencyScore >= CRITICAL_URGENCY_THRESHOLD).length;
  const needAction = emails.filter(
    (email) => email.important && email.urgencyScore < CRITICAL_URGENCY_THRESHOLD
  ).length;
  const unread = emails.filter((email) => !email.read).length;

  return {
    totalEmails: emails.length,
    needAction,
    unread,
    critical,
  };
}
