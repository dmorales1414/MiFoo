import type { AuthResult, Me, MeUpdate, Session, SignUpInput } from '../types/auth';
import type { Item, NewItem } from '../types/item';
import type { ProductSuggestion } from '../types/product';
import { API_URL, REQUEST_TIMEOUT_MS } from './config';
import { clearSession, getAccessToken, hasSession, refreshSession, setRefresher } from './session';

// Thrown for every failed request. `status` is the HTTP code, or 0 when the server
// could not be reached at all (wrong address, backend not running, no network).
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// FastAPI errors look like {"detail": "text"} or, for validation, {"detail": [{"msg": ...}]}.
function detailToMessage(body: unknown, fallback: string): string {
  const detail = (body as { detail?: unknown } | null)?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map((d) => (d as { msg?: string }).msg ?? 'Invalid value').join('; ');
  }
  return fallback;
}

interface RequestOptions {
  auth?: boolean; // send the login token (default true). Login/sign-up/refresh turn it off.
}

async function send(path: string, init: RequestInit | undefined, token: string | null): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(`${API_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiError(0, `Could not reach the server at ${API_URL}. Is the backend running?`);
  } finally {
    clearTimeout(timer);
  }
}

async function request<T>(path: string, init?: RequestInit, { auth = true }: RequestOptions = {}): Promise<T> {
  let response = await send(path, init, auth ? await getAccessToken() : null);

  // The token may have just expired: refresh once and retry.
  if (auth && response.status === 401 && hasSession()) {
    const next = await refreshSession();
    if (next) {
      response = await send(path, init, next.accessToken);
    } else if (!hasSession()) {
      throw new ApiError(401, 'Your login has expired. Please log in again.');
    }
    if (response.status === 401) await clearSession();
  }

  if (response.status === 204) return undefined as T;

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    // Not JSON (for example an HTML error page): fall through to the generic message.
  }
  if (!response.ok) {
    throw new ApiError(response.status, detailToMessage(body, `Server error (${response.status}).`));
  }
  return body as T;
}

// ---- Accounts ---------------------------------------------------------------------------
const post = (body: unknown): RequestInit => ({ method: 'POST', body: JSON.stringify(body) });

export function signUp(input: SignUpInput): Promise<AuthResult> {
  return request<AuthResult>('/auth/signup', post(input), { auth: false });
}

// `identifier` is a username or an email address.
export function logIn(identifier: string, password: string): Promise<Session> {
  return request<Session>('/auth/login', post({ identifier, password }), { auth: false });
}

setRefresher((refreshToken) =>
  request<Session>('/auth/refresh', post({ refreshToken }), { auth: false }),
);

export function fetchMe(): Promise<Me> {
  return request<Me>('/me');
}

export function updateMe(changes: MeUpdate): Promise<Me> {
  return request<Me>('/me', { method: 'PATCH', body: JSON.stringify(changes) });
}

// ---- Products (Open Food Facts, through our backend) ----------------------------------
// Rejects with ApiError(404) when the barcode is not in Open Food Facts.
export function lookupBarcode(barcode: string): Promise<ProductSuggestion> {
  return request<ProductSuggestion>(`/products/barcode/${encodeURIComponent(barcode)}`);
}

// ---- Items ----------------------------------------------------------------------------
export function fetchItems(): Promise<Item[]> {
  return request<Item[]>('/items');
}

export function createItem(item: NewItem): Promise<Item> {
  return request<Item>('/items', { method: 'POST', body: JSON.stringify(item) });
}

export function deleteItem(id: string): Promise<void> {
  return request<void>(`/items/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
