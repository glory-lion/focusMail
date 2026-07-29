import { mockEmails } from '@/data/mockEmails';
import type { DayBucket, Email, WeeklyInsightsStats } from '@/types/mail';

const CRITICAL_URGENCY_THRESHOLD = 90;

const SIMULATED_DELAY_MS = 300;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), SIMULATED_DELAY_MS));
}

export function getEmails(): Promise<Email[]> {
  return delay(mockEmails.map((email) => ({ ...email })));
}

export function getEmailById(id: string): Promise<Email | undefined> {
  return delay(mockEmails.find((email) => email.id === id));
}

export function sendReply(_id: string, _text: string): Promise<void> {
  return delay(undefined);
}

export function markAsRead(id: string): Promise<void> {
  const email = mockEmails.find((item) => item.id === id);
  if (email) {
    email.read = true;
  }
  return delay(undefined);
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

export type EmailFilter = 'all' | 'unread' | 'attachments' | 'urgent';

export function filterEmails(emails: Email[], filter: EmailFilter): Email[] {
  switch (filter) {
    case 'unread':
      return emails.filter((email) => !email.read);
    case 'attachments':
      return emails.filter((email) => email.hasAttachment);
    case 'urgent':
      return emails.filter((email) => email.important);
    default:
      return emails;
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
