import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { apiFetch } from '@/services/apiClient';

// Foreground notifications are silent by default in expo-notifications —
// without this handler, a push that arrives while the app is open never
// shows a banner at all.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Requests notification permission and returns an Expo push token, or null
 * if unavailable (web, permission denied, or no EAS project configured —
 * this hackathon build has no `extra.eas.projectId` set, so
 * getExpoPushTokenAsync can legitimately fail on a fresh checkout).
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'FocusMail',
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== 'granted') {
    status = (await Notifications.requestPermissionsAsync()).status;
  }
  if (status !== 'granted') return null;

  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    const { data } = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    return data;
  } catch (err) {
    console.warn('Could not get Expo push token:', err);
    return null;
  }
}

export async function registerPushToken(pushToken: string): Promise<void> {
  await apiFetch('/settings', {
    method: 'PUT',
    body: JSON.stringify({ push_token: pushToken }),
  });
}

/** Fires when the user taps a notification (app foregrounded, backgrounded, or killed). */
export function addNotificationTapListener(
  onTap: (data: Record<string, unknown>) => void
): () => void {
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    onTap(response.notification.request.content.data ?? {});
  });
  return () => subscription.remove();
}
