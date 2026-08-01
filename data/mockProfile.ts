import type { NotificationSettings, UserProfile } from '@/types/mail';

export const defaultProfile: UserProfile = {
  name: 'Your Name',
  title: '',
  email: '',
};

export const defaultNotificationSettings: NotificationSettings = {
  immediateEnabled: true,
  dailyDigestEnabled: true,
  digestTime: '08:00',
};
