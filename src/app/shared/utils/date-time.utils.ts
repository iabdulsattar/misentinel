export const STORAGE_KEY_TIMEZONE = 'user_timezone';
export const DEFAULT_TIMEZONE = 'UTC';

export function getStoredTimezone(): string {
  if (typeof window === 'undefined') return DEFAULT_TIMEZONE;
  try {
    return localStorage.getItem(STORAGE_KEY_TIMEZONE) || DEFAULT_TIMEZONE;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}

export function setStoredTimezone(timezone: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_TIMEZONE, timezone);
  } catch {
    // ignore
  }
}

export function getBrowserTimezone(): string {
  if (typeof Intl === 'undefined') return DEFAULT_TIMEZONE;
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TIMEZONE;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}

export function getEffectiveTimezone(): string {
  const stored = getStoredTimezone();
  if (stored && stored !== DEFAULT_TIMEZONE) return stored;
  return getBrowserTimezone();
}

export function formatUtcToLocal(
  isoString: string | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  },
  timezone?: string
): string {
  if (!isoString) return '—';
  const date = isoString instanceof Date ? isoString : new Date(isoString);
  if (isNaN(date.getTime())) return '—';
  const tz = timezone || getEffectiveTimezone();
  try {
    return new Intl.DateTimeFormat('en-GB', { ...options, timeZone: tz }).format(date);
  } catch {
    return new Intl.DateTimeFormat('en-GB', { ...options, timeZone: DEFAULT_TIMEZONE }).format(date);
  }
}

export function formatUtcToLocalDateOnly(
  isoString: string | Date | null | undefined,
  timezone?: string
): string {
  return formatUtcToLocal(isoString, { year: 'numeric', month: 'short', day: 'numeric' }, timezone);
}

export function formatUtcToLocalTimeOnly(
  isoString: string | Date | null | undefined,
  timezone?: string
): string {
  return formatUtcToLocal(isoString, { hour: '2-digit', minute: '2-digit', hour12: false }, timezone);
}

export function formatUtcToLocalRelative(
  isoString: string | Date | null | undefined,
  timezone?: string
): string {
  if (!isoString) return '—';
  const date = isoString instanceof Date ? isoString : new Date(isoString);
  if (isNaN(date.getTime())) return '—';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatUtcToLocalDateOnly(date, timezone);
}

export function toUtcIsoString(date: Date): string {
  return date.toISOString();
}

export function parseUtcToDate(isoString: string): Date | null {
  const date = new Date(isoString);
  return isNaN(date.getTime()) ? null : date;
}

export function isValidIsoString(value: string): boolean {
  const date = new Date(value);
  return !isNaN(date.getTime());
}