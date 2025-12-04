import { ApiUser, CreateUserRequest, CreateUserResponse, User } from "@/types/user";

function base(): string {
  return "/api/users";
}
const SESSION_KEY = 'cee_auth_session';
const TOKEN_KEY = 'bearer_token';

function toUser(api: ApiUser): User {
  return {
    id: api.id,
    name: api.name,
    email: api.email,
    role: api.role,
    active: api.active,
    lastLogin: api.last_login ? new Date(api.last_login) : undefined,
    createdAt: new Date(api.created_at),
  };
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

export async function createUser(req: CreateUserRequest): Promise<User> {
  const token = getTokenFromStorage();
  const res = await fetch(base(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      Accept: "application/json"
    },
    body: JSON.stringify(req),
    credentials: "include",
  });
  if (!res.ok) {
    let msg = `Create user failed: ${res.status} ${res.statusText}`;
    try {
      const err = await res.json();
      if (err && (err.message || err.error)) msg = String(err.message || err.error);
    } catch {}
    throw new Error(msg);
  }
  const data: CreateUserResponse = await res.json();
  return toUser(data);
}

export async function listUsers(params?: { role?: User["role"]; active?: boolean }): Promise<User[]> {
  const url = new URL(base(), window.location.origin);
  if (params?.role) url.searchParams.set("role", params.role);
  if (params?.active !== undefined) url.searchParams.set("active", String(params.active));
  const token = getTokenFromStorage();
  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
  });
  if (!res.ok) {
    let msg = `List users failed: ${res.status} ${res.statusText}`;
    try {
      const err = await res.json();
      if (err && (err.message || err.error)) msg = String(err.message || err.error);
    } catch {}
    throw new Error(msg);
  }
  const data: ApiUser[] = await res.json();
  return data.map(toUser);
}

/**
 * Fetch a single user by id
 */
export async function getUser(id: string): Promise<User> {
  const token = getTokenFromStorage();
  const url = `${base()}/${encodeURIComponent(id)}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
  });
  if (!res.ok) {
    let msg = `Get user failed: ${res.status} ${res.statusText}`;
    try {
      const err = await res.json();
      if (err && (err.message || err.error)) msg = String(err.message || err.error);
    } catch {}
    throw new Error(msg);
  }
  const data: ApiUser = await res.json();
  return toUser(data);
}

/**
 * Update a user. Payload should contain only updatable fields.
 * We accept Partial<CreateUserRequest> or a more specific update shape.
 */
export async function updateUser(id: string, payload: Partial<CreateUserRequest> & { active?: boolean } = {}): Promise<User> {
  const token = getTokenFromStorage();
  const url = `${base()}/${encodeURIComponent(id)}`;
  const res = await fetch(url, {
    method: "PATCH", // use PATCH; switch to PUT if your API expects it
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
    credentials: "include",
  });

  if (!res.ok) {
    let msg = `Update user failed: ${res.status} ${res.statusText}`;
    try {
      const err = await res.json();
      if (err && (err.message || err.error)) msg = String(err.message || err.error);
    } catch {}
    throw new Error(msg);
  }

  const data: ApiUser = await res.json();
  return toUser(data);
}

/**
 * Reset a user's password.
 * Endpoint: POST /api/users/{user_id}/reset-password?new_password=...
 * Returns: string (successful response body)
 */
export async function resetPassword(id: string, newPassword?: string): Promise<string> {
  const token = getTokenFromStorage();
  // Build URL with optional new_password query param
  const url = new URL(`${base()}/${encodeURIComponent(id)}/reset-password`, window.location.origin);
  if (newPassword) url.searchParams.set('new_password', newPassword);

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
  });

  if (!res.ok) {
    let msg = `Reset password failed: ${res.status} ${res.statusText}`;
    try {
      const err = await res.json();
      // The API may return a validation error structure
      if (err && (err.message || err.error)) msg = String(err.message || err.error);
      else if (err && err.detail) msg = JSON.stringify(err.detail);
    } catch {}
    throw new Error(msg);
  }

  // Try to parse JSON, fallback to text if necessary
  try {
    const json = await res.json();
    // If API returns a plain string in JSON, return that; otherwise stringify
    if (typeof json === 'string') return json;
    return JSON.stringify(json);
  } catch {
    // If response is not JSON, return raw text
    const txt = await res.text();
    return txt;
  }
}
