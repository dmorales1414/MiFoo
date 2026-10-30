// Same rules as the backend (backend/app/schemas/auth.py) so people see problems before sending.
export const USERNAME_RE = /^[A-Za-z0-9_]{3,30}$/;
export const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
export const PHONE_RE = /^[0-9+()\-.\s]{7,20}$/;
export const MIN_PASSWORD = 8;
export const MAX_DISPLAY_NAME = 60;

export function emailError(v: string): string | undefined {
  return EMAIL_RE.test(v.trim()) ? undefined : 'Enter a valid email address.';
}
export function usernameError(v: string): string | undefined {
  return USERNAME_RE.test(v.trim()) ? undefined : '3-30 characters: letters, numbers and underscores only.';
}
export function displayNameError(v: string): string | undefined {
  const t = v.trim();
  if (!t) return 'Enter your name.';
  return t.length > MAX_DISPLAY_NAME ? `Keep it under ${MAX_DISPLAY_NAME} characters.` : undefined;
}
export function passwordError(v: string): string | undefined {
  return v.length >= MIN_PASSWORD ? undefined : `Use at least ${MIN_PASSWORD} characters.`;
}
export function phoneError(v: string): string | undefined {
  const t = v.trim();
  return t === '' || PHONE_RE.test(t) ? undefined : 'Enter a valid phone number.';
}
