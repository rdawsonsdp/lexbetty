'use client';

const ANON_COOKIE = 'lb_anon_session';
const ANON_LS_KEY = 'lb_anon_session_id';
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback (RFC 4122 v4)
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

function writeCookie(name: string, value: string) {
  if (typeof document === 'undefined') return;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${ONE_YEAR_SECONDS}; SameSite=Lax${secure}`;
}

export function getOrCreateAnonSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = readCookie(ANON_COOKIE);
  if (!id) {
    try {
      id = window.localStorage.getItem(ANON_LS_KEY);
    } catch {
      id = null;
    }
  }
  if (!id) {
    id = generateUuid();
  }
  writeCookie(ANON_COOKIE, id);
  try {
    window.localStorage.setItem(ANON_LS_KEY, id);
  } catch {
    // ignore quota / disabled storage
  }
  return id;
}

export function clearAnonSessionId() {
  if (typeof document !== 'undefined') {
    document.cookie = `${ANON_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
  }
  try {
    window.localStorage.removeItem(ANON_LS_KEY);
  } catch {
    // ignore
  }
}
