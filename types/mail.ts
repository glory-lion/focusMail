export type Provider = 'gmail' | 'outlook';

export interface Account {
  provider: Provider;
  connected: boolean;
  emailAddress: string;
}

export type DayBucket = 'TODAY' | 'YESTERDAY' | string;

export interface DetailedSummary {
  meetingLink?: string;
  date?: string;
  time?: string;
  venue?: string;
  deadlines?: string[];
  keyPoints: string[];
}

export interface EmailSender {
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface Attachment {
  fileName: string;
  fileSizeLabel: string;
  fileType: string;
}

export interface Email {
  id: string;
  sender: EmailSender;
  subject: string;
  preview: string;
  body: string;
  timestamp: string;
  dayBucket: DayBucket;
  important: boolean;
  urgencyScore: number;
  summary: string;
  detailedSummary: DetailedSummary;
  suggestedReply: string;
  read: boolean;
  hasAttachment: boolean;
  attachments: Attachment[];
  archived: boolean;
  deleted: boolean;
  replied: boolean;
}

export interface NotificationSettings {
  immediateEnabled: boolean;
  dailyDigestEnabled: boolean;
  digestTime: string;
}

export interface UserProfile {
  name: string;
  title: string;
  email: string;
  avatarUrl?: string;
}

export interface WeeklyInsightsStats {
  totalEmails: number;
  needAction: number;
  unread: number;
  critical: number;
}
