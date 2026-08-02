import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * backend/api's action items (see shared/schema.py ActionItem) have no
 * "done" concept at all — no column, no endpoint to toggle one. Checked
 * state is purely local, keyed by the item's own id (already globally
 * unique — derived server-side from the email id + item text — so no
 * collision risk across different emails).
 */
const STORAGE_KEY = 'focus-mail-app/action-item-done';

let cache: Record<string, boolean> | null = null;

async function load(): Promise<Record<string, boolean>> {
  if (cache) return cache;
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  cache = raw ? JSON.parse(raw) : {};
  return cache as Record<string, boolean>;
}

async function persist(): Promise<void> {
  if (cache) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  }
}

export async function getActionItemsDone(ids: string[]): Promise<Record<string, boolean>> {
  const all = await load();
  const result: Record<string, boolean> = {};
  for (const id of ids) {
    result[id] = all[id] ?? false;
  }
  return result;
}

export async function setActionItemDone(id: string, done: boolean): Promise<void> {
  const all = await load();
  all[id] = done;
  await persist();
}
