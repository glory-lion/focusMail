import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * backend/api doesn't track read/archived/deleted/replied state yet (no
 * columns for it on EmailMessage). Until it does, we keep that state
 * client-side, keyed by email id, and merge it onto whatever the API
 * returns. This is the one seam that will need to move server-side once
 * the backend grows those fields.
 */
export interface OverlayEntry {
  read?: boolean;
  archived?: boolean;
  deleted?: boolean;
  replied?: boolean;
}

const STORAGE_KEY = 'focus-mail-app/email-overlay';

let cache: Record<string, OverlayEntry> | null = null;

async function load(): Promise<Record<string, OverlayEntry>> {
  if (cache) return cache;
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  cache = raw ? JSON.parse(raw) : {};
  return cache as Record<string, OverlayEntry>;
}

async function persist(): Promise<void> {
  if (cache) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  }
}

export async function getOverlay(id: string): Promise<OverlayEntry> {
  const all = await load();
  return all[id] ?? {};
}

export async function getAllOverlay(): Promise<Record<string, OverlayEntry>> {
  return load();
}

export async function setOverlay(id: string, patch: OverlayEntry): Promise<void> {
  const all = await load();
  all[id] = { ...all[id], ...patch };
  await persist();
}
