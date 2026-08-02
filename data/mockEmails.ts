import type { DayBucket, Email } from '@/types/mail';

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

function timestampAt(daysAgo: number, hour: number, minute: number): { date: Date; iso: string } {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, minute, 0, 0);
  return { date, iso: date.toISOString() };
}

interface Seed {
  id: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  preview: string;
  body: string;
  daysAgo: number;
  hour: number;
  minute: number;
  important: boolean;
  urgencyScore: number;
  summary: string;
  detailedSummary: Email['detailedSummary'];
  suggestedReply: string;
  read: boolean;
  hasAttachment: boolean;
  attachments?: Email['attachments'];
}

const seeds: Seed[] = [
  {
    id: '1',
    senderName: 'Sarah Mitchell',
    senderEmail: 'sarah.mitchell@company.com',
    subject: 'Urgent: Q4 Strategy Review - Action Required',
    preview: 'Hi team, we need the final numbers for the Q4...',
    body: "Hi team,\n\nWe need the final numbers for the Q4 strategy deck before I present to the board tomorrow. Please send over the revenue breakdown and updated projections by 5 PM today so I have time to review before the meeting.\n\nThis is time-sensitive — the board meeting is first thing tomorrow morning and I can't push the deadline.\n\nThanks,\nSarah",
    daysAgo: 0,
    hour: 10,
    minute: 42,
    important: true,
    urgencyScore: 98,
    summary: "Deadline today. You need to provide the final Q4 financial data for Sarah's strategy deck before 5 PM.",
    detailedSummary: {
      deadlines: ['Send Q4 revenue breakdown and projections by 5 PM today'],
      keyPoints: [
        'Board meeting is tomorrow morning',
        'Sarah needs final numbers to finish the strategy deck',
        'No room to push the deadline',
      ],
    },
    suggestedReply:
      "Hi Sarah,\n\nI'll have the revenue breakdown and updated projections over to you by 4 PM today, ahead of your 5 PM deadline.\n\nBest,\n" ,
    read: false,
    hasAttachment: true,
    attachments: [{ fileName: 'Q4_Strategy_Deck.pdf', fileSizeLabel: '4.2 MB', fileType: 'PDF Document' }],
  },
  {
    id: '2',
    senderName: 'Product Sync',
    senderEmail: 'product-sync@company.com',
    subject: 'Weekly Roadmap Update & Feature Freeze',
    preview: 'The engineering team has requested a...',
    body: 'The engineering team has requested a feature freeze starting next week to stabilize the release. The roadmap priorities have been updated in the shared document — please review the changes before Monday standup.\n\nNo action needed unless you have objections to the freeze dates.',
    daysAgo: 0,
    hour: 9,
    minute: 15,
    important: true,
    urgencyScore: 62,
    summary: 'Feature freeze in effect next week. Roadmap priorities have been updated in the shared document.',
    detailedSummary: {
      deadlines: ['Review roadmap changes before Monday standup'],
      keyPoints: [
        'Engineering requested a feature freeze starting next week',
        'Roadmap priorities updated in the shared document',
      ],
    },
    suggestedReply: 'Thanks for the heads up — I\'ll review the updated roadmap before Monday standup.',
    read: true,
    hasAttachment: false,
  },
  {
    id: '3',
    senderName: 'David Chen',
    senderEmail: 'david.chen@gmail.com',
    subject: 'Re: Lunch on Thursday?',
    preview: 'Hey, would you be free to catch up over lunch...',
    body: "Hey, would you be free to catch up over lunch this Thursday? There's a new restaurant nearby I've been wanting to try — Terra Kitchen on 5th Ave. Let me know if 12:30 works for you!",
    daysAgo: 1,
    hour: 16,
    minute: 30,
    important: false,
    urgencyScore: 20,
    summary: 'David is inviting you to lunch this Thursday at a new restaurant nearby to catch up.',
    detailedSummary: {
      date: 'Thursday',
      time: '12:30 PM',
      venue: 'Terra Kitchen, 5th Ave',
      keyPoints: ['David wants to catch up over lunch', 'Suggests a new restaurant, Terra Kitchen'],
    },
    suggestedReply: '12:30 works great for me! Looking forward to catching up. See you at Terra Kitchen.',
    read: true,
    hasAttachment: false,
  },
  {
    id: '4',
    senderName: 'Emily Rodriguez',
    senderEmail: 'emily.rodriguez@company.com',
    subject: 'Client Escalation - Acme Corp needs response today',
    preview: 'We just got off a call with Acme Corp and they...',
    body: "We just got off a call with Acme Corp and they are escalating the outage from last night. They want a written response with a root cause summary and remediation plan by end of day. Can you draft this with the incident team?\n\nThis is a top priority — Acme is one of our largest accounts.",
    daysAgo: 0,
    hour: 11,
    minute: 5,
    important: true,
    urgencyScore: 95,
    summary: 'Acme Corp is escalating last night\'s outage. A written root cause summary and remediation plan is due today.',
    detailedSummary: {
      deadlines: ['Send written root cause summary and remediation plan by end of day'],
      keyPoints: [
        'Acme Corp escalated the outage from last night',
        'Response must be coordinated with the incident team',
        'Acme is a top-priority account',
      ],
    },
    suggestedReply: "Hi Emily,\n\nI'm looping in the incident team now and will have the root cause summary and remediation plan drafted before end of day.\n\nThanks,",
    read: false,
    hasAttachment: false,
  },
  {
    id: '5',
    senderName: 'Michael Park',
    senderEmail: 'michael.park@company.com',
    subject: 'Design Review - Onboarding Flow v2',
    preview: 'Attaching the updated mocks for the onboarding...',
    body: "Attaching the updated mocks for the onboarding redesign. Would love your feedback before we finalize. I've scheduled a design review for Friday at 2 PM over Zoom to walk through the changes together.\n\nZoom link: https://zoom.us/j/1234567890",
    daysAgo: 0,
    hour: 8,
    minute: 50,
    important: false,
    urgencyScore: 45,
    summary: 'Michael shared updated onboarding mocks and scheduled a design review call for Friday at 2 PM.',
    detailedSummary: {
      meetingLink: 'https://zoom.us/j/1234567890',
      date: 'Friday',
      time: '2:00 PM',
      keyPoints: ['Updated onboarding flow mocks attached', 'Feedback requested before finalizing'],
    },
    suggestedReply: "Thanks Michael, I'll take a look at the mocks and see you at the design review Friday at 2 PM.",
    read: false,
    hasAttachment: true,
    attachments: [{ fileName: 'Onboarding_Flow_v2.fig', fileSizeLabel: '8.1 MB', fileType: 'Figma File' }],
  },
  {
    id: '6',
    senderName: 'HR Team',
    senderEmail: 'hr@company.com',
    subject: 'Reminder: Annual Benefits Enrollment Closes Friday',
    preview: 'This is a reminder that open enrollment for...',
    body: 'This is a reminder that open enrollment for annual benefits closes this Friday at midnight. If you haven\'t reviewed or updated your elections yet, please log into the benefits portal to do so.',
    daysAgo: 1,
    hour: 9,
    minute: 0,
    important: true,
    urgencyScore: 55,
    summary: 'Benefits enrollment closes Friday at midnight — review or update your elections before then.',
    detailedSummary: {
      deadlines: ['Complete benefits enrollment by Friday midnight'],
      keyPoints: ['Open enrollment window is closing', 'Update elections in the benefits portal'],
    },
    suggestedReply: "Thanks for the reminder, I'll review my elections before the deadline.",
    read: true,
    hasAttachment: false,
  },
  {
    id: '7',
    senderName: 'Newsletter Weekly',
    senderEmail: 'news@techdigest.com',
    subject: 'This Week in Tech: 5 Stories You Missed',
    preview: 'Your weekly roundup of the biggest stories in...',
    body: 'Your weekly roundup of the biggest stories in tech this week, curated just for you. Read on for the highlights.',
    daysAgo: 1,
    hour: 7,
    minute: 30,
    important: false,
    urgencyScore: 5,
    summary: 'Weekly tech newsletter roundup — no action needed.',
    detailedSummary: {
      keyPoints: ['General newsletter digest, no action required'],
    },
    suggestedReply: '',
    read: true,
    hasAttachment: false,
  },
  {
    id: '8',
    senderName: 'Jessica Wu',
    senderEmail: 'jessica.wu@company.com',
    subject: 'Contract renewal for TechFlow needs sign-off',
    preview: 'The TechFlow contract renewal is ready for your...',
    body: "The TechFlow contract renewal is ready for your final sign-off. Legal has already approved the terms. Their current contract expires in two days, so we'll need your approval by tomorrow to avoid a lapse in service.",
    daysAgo: 2,
    hour: 13,
    minute: 20,
    important: true,
    urgencyScore: 80,
    summary: 'TechFlow contract renewal needs your sign-off by tomorrow to avoid a service lapse.',
    detailedSummary: {
      deadlines: ['Approve contract renewal by tomorrow'],
      keyPoints: ['Legal has already approved the terms', "Current contract expires in two days"],
    },
    suggestedReply: "Hi Jessica,\n\nI've reviewed the renewal and it looks good — approving now.\n\nThanks,",
    read: false,
    hasAttachment: true,
    attachments: [{ fileName: 'TechFlow_Contract_Renewal.pdf', fileSizeLabel: '1.8 MB', fileType: 'PDF Document' }],
  },
  {
    id: '9',
    senderName: 'Alex Thompson',
    senderEmail: 'alex.thompson@company.com',
    subject: 'Team offsite planning - venue options',
    preview: "I've narrowed down a few venue options for the...",
    body: "I've narrowed down a few venue options for the team offsite next month. Take a look and let me know your top pick when you get a chance — no rush.",
    daysAgo: 2,
    hour: 15,
    minute: 45,
    important: false,
    urgencyScore: 15,
    summary: 'Alex shared venue options for next month\'s team offsite and wants your input, no rush.',
    detailedSummary: {
      keyPoints: ['Venue shortlist shared for next month\'s offsite', 'Feedback requested, not urgent'],
    },
    suggestedReply: "Thanks Alex, I'll take a look and send my pick this week.",
    read: true,
    hasAttachment: false,
  },
  {
    id: '10',
    senderName: 'Finance Team',
    senderEmail: 'finance@company.com',
    subject: 'Expense report rejected - resubmission needed',
    preview: 'Your latest expense report was rejected due to...',
    body: 'Your latest expense report was rejected due to a missing receipt for the client dinner on the 12th. Please resubmit with the correct documentation by end of week.',
    daysAgo: 3,
    hour: 10,
    minute: 10,
    important: true,
    urgencyScore: 58,
    summary: 'Expense report rejected for a missing receipt — resubmit with documentation by end of week.',
    detailedSummary: {
      deadlines: ['Resubmit expense report with missing receipt by end of week'],
      keyPoints: ['Rejected due to missing receipt for client dinner on the 12th'],
    },
    suggestedReply: "I'll locate the receipt and resubmit the report by end of week.",
    read: false,
    hasAttachment: true,
    attachments: [{ fileName: 'Expense_Report_Rejected.xlsx', fileSizeLabel: '0.3 MB', fileType: 'Excel Spreadsheet' }],
  },
  {
    id: '11',
    senderName: 'Rachel Kim',
    senderEmail: 'rachel.kim@company.com',
    subject: 'Interview feedback needed for Senior Engineer role',
    preview: "We interviewed a strong candidate yesterday and...",
    body: "We interviewed a strong candidate yesterday and the hiring committee is meeting Thursday at 10 AM to make a decision. Could you submit your interview feedback before then?\n\nMeeting link: https://meet.google.com/abc-defg-hij",
    daysAgo: 3,
    hour: 14,
    minute: 0,
    important: true,
    urgencyScore: 70,
    summary: 'Submit interview feedback before Thursday\'s 10 AM hiring committee meeting.',
    detailedSummary: {
      meetingLink: 'https://meet.google.com/abc-defg-hij',
      date: 'Thursday',
      time: '10:00 AM',
      deadlines: ['Submit interview feedback before the Thursday 10 AM hiring meeting'],
      keyPoints: ['Hiring committee deciding on a Senior Engineer candidate'],
    },
    suggestedReply: "I'll submit my feedback before the meeting on Thursday.",
    read: true,
    hasAttachment: false,
  },
  {
    id: '12',
    senderName: 'GitHub',
    senderEmail: 'notifications@github.com',
    subject: '[repo] New pull request opened: Fix login redirect bug',
    preview: 'A new pull request was opened in your repository...',
    body: 'A new pull request was opened in your repository by a teammate. Review it when you have a chance.',
    daysAgo: 4,
    hour: 12,
    minute: 5,
    important: false,
    urgencyScore: 25,
    summary: 'A new pull request was opened for review — no urgent action required.',
    detailedSummary: {
      keyPoints: ['Pull request opened for the login redirect bug fix'],
    },
    suggestedReply: '',
    read: true,
    hasAttachment: false,
  },
  {
    id: '13',
    senderName: 'Tom Nguyen',
    senderEmail: 'tom.nguyen@company.com',
    subject: 'Server migration scheduled for this weekend',
    preview: "Heads up, we're migrating the production database...",
    body: "Heads up, we're migrating the production database this Saturday starting at 9 AM. Expect roughly 2 hours of downtime. Let me know if this conflicts with anything on your end before Friday.",
    daysAgo: 4,
    hour: 9,
    minute: 40,
    important: true,
    urgencyScore: 50,
    summary: 'Production database migration is scheduled for Saturday 9 AM with ~2 hours downtime.',
    detailedSummary: {
      date: 'Saturday',
      time: '9:00 AM',
      deadlines: ['Flag conflicts before Friday'],
      keyPoints: ['Database migration will cause ~2 hours of downtime'],
    },
    suggestedReply: 'No conflicts on my end — thanks for the heads up.',
    read: false,
    hasAttachment: false,
  },
  {
    id: '14',
    senderName: 'Priya Patel',
    senderEmail: 'priya.patel@company.com',
    subject: 'Great meeting today!',
    preview: 'Just wanted to say thanks for the productive...',
    body: 'Just wanted to say thanks for the productive discussion today. Looking forward to seeing where this project goes.',
    daysAgo: 5,
    hour: 17,
    minute: 15,
    important: false,
    urgencyScore: 8,
    summary: 'Priya followed up to thank you for a productive meeting — no action needed.',
    detailedSummary: {
      keyPoints: ['Friendly follow-up after a meeting'],
    },
    suggestedReply: 'Likewise, great chatting with you today!',
    read: true,
    hasAttachment: false,
  },
  {
    id: '15',
    senderName: 'Security Alerts',
    senderEmail: 'security@company.com',
    subject: 'New sign-in to your account from a new device',
    preview: 'We noticed a new sign-in to your account from...',
    body: 'We noticed a new sign-in to your account from a new device. If this was you, no action is needed. If you don\'t recognize this activity, please secure your account immediately.',
    daysAgo: 6,
    hour: 6,
    minute: 55,
    important: true,
    urgencyScore: 40,
    summary: 'A new sign-in to your account was detected from an unrecognized device.',
    detailedSummary: {
      keyPoints: ['New sign-in detected from a new device', 'Secure the account if this wasn\'t you'],
    },
    suggestedReply: '',
    read: false,
    hasAttachment: false,
  },
  {
    id: '16',
    senderName: 'Marcus Lee',
    senderEmail: 'marcus.lee@company.com',
    subject: 'Budget approval needed for Q1 marketing spend',
    preview: 'Could you approve the Q1 marketing budget...',
    body: "Could you approve the Q1 marketing budget proposal when you get a chance? It's not urgent, but we'd like to lock it in before planning kicks off.",
    daysAgo: 6,
    hour: 11,
    minute: 30,
    important: false,
    urgencyScore: 30,
    summary: 'Marcus is requesting approval of the Q1 marketing budget, no rush.',
    detailedSummary: {
      keyPoints: ['Q1 marketing budget proposal awaiting approval'],
    },
    suggestedReply: "I'll review and approve the budget proposal this week.",
    read: true,
    hasAttachment: false,
  },
];

export const mockEmails: Email[] = seeds.map((seed) => {
  const { date, iso } = timestampAt(seed.daysAgo, seed.hour, seed.minute);
  return {
    id: seed.id,
    sender: { name: seed.senderName, email: seed.senderEmail },
    subject: seed.subject,
    preview: seed.preview,
    body: seed.body,
    timestamp: iso,
    dayBucket: dayBucketFor(date),
    gmailLink: `https://mail.google.com/mail/u/0/#inbox/${seed.id}`,
    important: seed.important,
    urgencyScore: seed.urgencyScore,
    deadline: null,
    summary: seed.summary,
    detailedSummary: seed.detailedSummary,
    suggestedReply: seed.suggestedReply,
    actionItems: [],
    read: seed.read,
    hasAttachment: seed.hasAttachment,
    attachments: seed.attachments ?? [],
    archived: false,
    deleted: false,
    replied: false,
  };
});
