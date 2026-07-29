import type { NotificationSettings, UserProfile } from '@/types/mail';

export const defaultProfile: UserProfile = {
  name: 'Chelsea Gratia',
  email: 'chelseagratiaa@gmail.com',
};

export const defaultNotificationSettings: NotificationSettings = {
  immediateEnabled: true,
  dailyDigestEnabled: true,
  digestTime: '08:00',
};
