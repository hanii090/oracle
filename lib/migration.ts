/**
 * One-time migration from Oracle → Sorca localStorage keys.
 * Copies data from old `oracle_*` keys to new `sorca_*` keys,
 * then deletes the old keys. Safe to run multiple times.
 */

const KEY_MAP: Record<string, string> = {
  oracle_user_id: 'sorca_user_id',
  oracle_thread: 'sorca_thread',
  oracle_onboarding_seen: 'sorca_onboarding_seen',
  oracle_night_banner_seen: 'sorca_night_banner_seen',
  oracle_streak_data: 'sorca_streak_data',
  oracle_cookie_consent: 'sorca_cookie_consent',
};

const MIGRATION_FLAG = 'sorca_migration_v1_done';

export function migrateLocalStorage(): void {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(MIGRATION_FLAG)) return;

  // Migrate fixed keys
  for (const [oldKey, newKey] of Object.entries(KEY_MAP)) {
    const value = localStorage.getItem(oldKey);
    if (value !== null && localStorage.getItem(newKey) === null) {
      localStorage.setItem(newKey, value);
    }
    localStorage.removeItem(oldKey);
  }

  // Migrate per-user keys: oracle_profile_{uid}, oracle_sessions_{uid}
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;

    if (key.startsWith('oracle_profile_')) {
      const uid = key.replace('oracle_profile_', '');
      const newKey = `sorca_profile_${uid}`;
      const value = localStorage.getItem(key);
      if (value !== null && localStorage.getItem(newKey) === null) {
        localStorage.setItem(newKey, value);
      }
      keysToRemove.push(key);
    }

    if (key.startsWith('oracle_sessions_')) {
      const uid = key.replace('oracle_sessions_', '');
      const newKey = `sorca_sessions_${uid}`;
      const value = localStorage.getItem(key);
      if (value !== null && localStorage.getItem(newKey) === null) {
        localStorage.setItem(newKey, value);
      }
      keysToRemove.push(key);
    }
  }

  for (const key of keysToRemove) {
    localStorage.removeItem(key);
  }

  localStorage.setItem(MIGRATION_FLAG, 'true');
}
