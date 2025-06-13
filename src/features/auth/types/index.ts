// Types for the Authentication feature

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  imageUrl?: string;
  bio?: string;
  location?: string;
  website?: string;
  lastActiveAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SessionInfo {
  userId: string;
  sessionId: string;
  isActive: boolean;
  createdAt: string;
  expiresAt: string;
  lastActiveAt: string;
  userAgent?: string;
  ipAddress?: string;
  device?: string;
}

export interface AuthMetadata {
  lastSignInAt?: string;
  lastSignInIp?: string;
  signInCount?: number;
  tosAcceptedAt?: string;
  privacyPolicyAcceptedAt?: string;
  signUpSource?: string;
  oauth?: {
    provider: string;
    providerId: string;
  };
}

export interface AuthProvider {
  type: 'email' | 'google' | 'apple' | 'github' | 'discord';
  isLinked: boolean;
  email?: string;
  providerId?: string;
  linkedAt?: string;
}

export interface AccountVerification {
  emailVerified: boolean;
  emailVerifiedAt?: string;
  phoneVerified: boolean;
  phoneVerifiedAt?: string;
  twoFactorEnabled: boolean;
  twoFactorEnabledAt?: string;
}

export interface AuthOptions {
  redirectUrl?: string;
  redirectUrlComplete?: string;
  initialValues?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    username?: string;
  };
}

export enum AuthEvent {
  SIGNED_IN = 'signedIn',
  SIGNED_OUT = 'signedOut',
  USER_UPDATED = 'userUpdated',
  SESSION_STARTED = 'sessionStarted',
  SESSION_ENDED = 'sessionEnded',
}

export type AuthEventCallback = (event: AuthEvent, data?: any) => void;
