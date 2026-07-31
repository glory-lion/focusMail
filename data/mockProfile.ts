import type { NotificationSettings, UserProfile } from '@/types/mail';

export const defaultProfile: UserProfile = {
  name: 'Chelsea Gratia',
  title: 'Product Manager',
  email: 'chelseagratiaa@gmail.com',
};

export const defaultNotificationSettings: NotificationSettings = {
  immediateEnabled: true,
  dailyDigestEnabled: true,
  digestTime: '08:00',
};
