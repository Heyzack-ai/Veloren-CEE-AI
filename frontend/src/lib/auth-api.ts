import { User, AuthSession } from '@/types/user';

const SESSION_KEY = 'cee_auth_session';
const TOKEN_KEY = 'bearer_token';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  expiresAt?: string | number;
}

function persistToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (!token) {
    localStorage.removeItem(TOKEN_KEY);
  } else {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

function getTokenFromStorage(): string {
  if (typeof window === 'undefined') return '';
  const t = localStorage.getItem(TOKEN_KEY);
  if (t) return t;

  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return '';
  try {
    const parsed = JSON.parse(raw);
    return parsed?.token || '';
  } catch {
    return '';
  }
}

/**
 * Login using Next.js API route which proxies to backend: POST /api/auth/login
 */
export async function apiLogin(email: string, password: string): Promise<AuthSession> {
  if (!email || !password) throw new Error('Email and password are required');

  const body: LoginRequest = { email, password };

  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
    credentials: 'include',
  });

  if (!res.ok) {
    let errMsg = `Login failed: ${res.status} ${res.statusText}`;
    try {
      const err = await res.json();
      if (err && (err.message || err.error)) errMsg = String(err.message || err.error);
    } catch {
      // ignore parse errors
    }
    throw new Error(errMsg);
  }

  const data: LoginResponse & { access_token?: string } = await res.json();

  if (!data || !data.user) {
    throw new Error('Invalid response from authentication server');
  }

  // Normalize expiresAt to a Date
  let expiresAtDate: Date;
  if (typeof data.expiresAt === 'number') {
    expiresAtDate = new Date(data.expiresAt);
  } else if (typeof data.expiresAt === 'string') {
    expiresAtDate = new Date(data.expiresAt);
  } else {
    // default to 24 hours if backend didn't return expiresAt
    expiresAtDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
  }

  const session: AuthSession = {
    user: data.user,
    token: data.token || data.access_token || '',
    expiresAt: expiresAtDate,
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
          ...session,
          expiresAt: session.expiresAt.toISOString(),
        })
      );
      // ensure better-auth or other libs can read token
      persistToken(session.token);
    } catch (e) {
      console.warn('Failed to persist session to localStorage', e);
    }
  }

  return session;
}

/**
 * Fetch current authenticated session from API: GET /api/auth/me
 */
export async function fetchCurrentUser(): Promise<AuthSession | null> {
  try {
    const token = getTokenFromStorage();
    const res = await fetch('/api/auth/me', {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
    });

    if (!res.ok) {
      return null;
    }

    const data: LoginResponse = await res.json();

    if (!data?.user || !data?.token) return null;

    const expiresAt = data.expiresAt ? new Date(data.expiresAt) : new Date(Date.now() + 24 * 60 * 60 * 1000);

    const session: AuthSession = {
      user: data.user,
      token: data.token,
      expiresAt,
    };

    // persist session
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ ...session, expiresAt: expiresAt.toISOString() })
      );
      persistToken(session.token);
    }

    return session;
  } catch (e) {
    console.warn('Failed to fetch /api/auth/me', e);
    return null;
  }
}

export function apiLogout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_KEY);
    persistToken(null);
  }
  // Optionally inform server about logout (fire-and-forget)
  try {
    fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
  } catch {
    // ignore
  }
}

export function getStoredSession(): AuthSession | null {
  if (typeof window === 'undefined') return null;

  const stored = localStorage.getItem(SESSION_KEY);
  if (!stored) return null;

  try {
    const parsed = JSON.parse(stored);
    if (!parsed) return null;

    const expiresAt = parsed.expiresAt ? new Date(parsed.expiresAt) : null;
    if (expiresAt && expiresAt < new Date()) {
      localStorage.removeItem(SESSION_KEY);
      persistToken(null);
      return null;
    }

    const session: AuthSession = {
      user: parsed.user as User,
      token: parsed.token as string,
      expiresAt: expiresAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000),
    };

    return session;
  } catch (e) {
    console.warn('Failed to read stored session', e);
    return null;
  }
}
