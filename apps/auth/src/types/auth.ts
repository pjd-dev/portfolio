export interface User {
  id: string;
  email: string;
  role?: string;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface SignUpData {
  email: string;
  password: string;
  metadata?: Record<string, any>;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface OAuthProvider {
  provider: 'google' | 'github' | 'discord';
  redirectUrl?: string;
}

export interface RefreshTokenData {
  refreshToken: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  password: string;
}

export interface UpdateUserData {
  email?: string;
  password?: string;
  metadata?: Record<string, any>;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}
