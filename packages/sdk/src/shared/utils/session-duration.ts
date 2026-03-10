const STORAGE_KEY_PREFIX = "b3-session-duration";
const DEFAULT_DAYS = 7;

// 0 = session cookie (expires when browser closes)
export const SESSION_DURATION_OPTIONS = [0, 1, 7, 14, 30] as const;
export type SessionDurationDays = (typeof SESSION_DURATION_OPTIONS)[number];

function storageKey(partnerId?: string) {
  return partnerId ? `${STORAGE_KEY_PREFIX}_${partnerId}` : STORAGE_KEY_PREFIX;
}

/**
 * Read session duration for a specific partner.
 *
 * preferences shape: { [partnerId]: { sessionDuration: number }, sessionDuration?: number }
 *
 * Priority: user.preferences[partnerId].sessionDuration
 *           → user.preferences.sessionDuration (global fallback)
 *           → localStorage (per-partner) → localStorage (global) → default 7d
 */
export function getSessionDurationDays(userPreferences?: Record<string, any>, partnerId?: string): SessionDurationDays {
  if (userPreferences) {
    if (partnerId) {
      const v = userPreferences[partnerId]?.sessionDuration;
      if (SESSION_DURATION_OPTIONS.includes(v as SessionDurationDays)) return v as SessionDurationDays;
    }
    const v = userPreferences["sessionDuration"];
    if (SESSION_DURATION_OPTIONS.includes(v as SessionDurationDays)) return v as SessionDurationDays;
  }
  try {
    if (partnerId) {
      const stored = localStorage.getItem(storageKey(partnerId));
      if (stored !== null) {
        const parsed = Number(stored);
        if (SESSION_DURATION_OPTIONS.includes(parsed as SessionDurationDays)) return parsed as SessionDurationDays;
      }
    }
    const stored = localStorage.getItem(STORAGE_KEY_PREFIX);
    if (stored !== null) {
      const parsed = Number(stored);
      if (SESSION_DURATION_OPTIONS.includes(parsed as SessionDurationDays)) return parsed as SessionDurationDays;
    }
  } catch {
    // localStorage unavailable (e.g. SSR)
  }
  return DEFAULT_DAYS;
}

/** Cache the preference locally so it's available immediately on next login */
export function setSessionDurationDays(days: SessionDurationDays, partnerId?: string): void {
  try {
    localStorage.setItem(storageKey(partnerId), String(days));
  } catch {
    // ignore
  }
}
