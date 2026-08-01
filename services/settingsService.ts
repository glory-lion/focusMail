import { apiFetch } from '@/services/apiClient';
import type { NotificationSettings } from '@/types/mail';

interface ApiSettings {
  notification_preference: 'immediate' | 'daily';
  digest_hour: number;
  digest_minute: number;
  push_token: string | null;
}

function toNotificationSettings(api: ApiSettings): NotificationSettings {
  return {
    immediateEnabled: api.notification_preference === 'immediate',
    dailyDigestEnabled: api.notification_preference === 'daily',
    digestTime: `${String(api.digest_hour).padStart(2, '0')}:${String(api.digest_minute).padStart(2, '0')}`,
  };
}

export async function getSettings(): Promise<NotificationSettings> {
  const api = await apiFetch<ApiSettings>('/settings');
  return toNotificationSettings(api);
}

/**
 * backend/api models notifications as a single `notification_preference`
 * enum ('immediate' | 'daily'), while the UI exposes two independent
 * toggles. If immediate is on we send 'immediate'; otherwise 'daily' — the
 * backend has no way to represent "both off" today.
 */
export async function updateSettings(next: NotificationSettings): Promise<void> {
  const [hourStr, minuteStr] = next.digestTime.split(':');
  await apiFetch('/settings', {
    method: 'PUT',
    body: JSON.stringify({
      notification_preference: next.immediateEnabled ? 'immediate' : 'daily',
      digest_hour: Number(hourStr),
      digest_minute: Number(minuteStr),
    }),
  });
}
