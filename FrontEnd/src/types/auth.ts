// Shapes the backend sends/accepts for accounts (see backend/app/schemas/auth.py and profile.py).

export interface Session {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // seconds since 1970
}

export interface AuthResult {
  session: Session | null;
  needsEmailConfirmation: boolean;
}

export interface Me {
  id: string;
  email: string | null;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  phone: string | null;
  pushNotificationsEnabled: boolean;
  createdAt: string; // ISO date
}

export interface SignUpInput {
  email: string;
  displayName: string;
  username: string;
  password: string;
}

export interface MeUpdate {
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  phone?: string | null; // null or "" removes it
  pushNotificationsEnabled?: boolean;
}
