import { supabase, supabaseAdmin } from '../config/supabase.js';
import type { SignUpData, SignInData, AuthResponse, User } from '../types/auth.js';
import { createTokens } from '../utils/jwt.js';

export class AuthService {
  /**
   * Sign up a new user with email and password
   */
  async signUp(data: SignUpData): Promise<AuthResponse> {
    const { email, password, metadata } = data;

    // Sign up with Supabase
    const { data: authData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata || {},
      },
    });

    if (error) {
      throw new Error(`Sign up failed: ${error.message}`);
    }

    if (!authData.user) {
      throw new Error('User creation failed');
    }

    // Create custom JWT tokens
    const tokens = createTokens({
      id: authData.user.id,
      email: authData.user.email!,
      role: authData.user.role,
    });

    return {
      user: {
        id: authData.user.id,
        email: authData.user.email!,
        role: authData.user.role,
        metadata: authData.user.user_metadata,
        created_at: authData.user.created_at,
      },
      tokens,
    };
  }

  /**
   * Sign in with email and password
   */
  async signIn(data: SignInData): Promise<AuthResponse> {
    const { email, password } = data;

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(`Sign in failed: ${error.message}`);
    }

    if (!authData.user) {
      throw new Error('Authentication failed');
    }

    const tokens = createTokens({
      id: authData.user.id,
      email: authData.user.email!,
      role: authData.user.role,
    });

    return {
      user: {
        id: authData.user.id,
        email: authData.user.email!,
        role: authData.user.role,
        metadata: authData.user.user_metadata,
        created_at: authData.user.created_at,
      },
      tokens,
    };
  }

  /**
   * Sign out user
   */
  async signOut(accessToken: string): Promise<void> {
    const { error } = await supabase.auth.admin.signOut(accessToken);
    
    if (error) {
      throw new Error(`Sign out failed: ${error.message}`);
    }
  }

  /**
   * Get OAuth URL for provider
   */
  async getOAuthUrl(provider: 'google' | 'github' | 'discord', redirectUrl?: string): Promise<string> {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectUrl,
      },
    });

    if (error) {
      throw new Error(`OAuth initialization failed: ${error.message}`);
    }

    return data.url;
  }

  /**
   * Handle OAuth callback
   */
  async handleOAuthCallback(code: string): Promise<AuthResponse> {
    const { data: authData, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      throw new Error(`OAuth callback failed: ${error.message}`);
    }

    if (!authData.user) {
      throw new Error('OAuth authentication failed');
    }

    const tokens = createTokens({
      id: authData.user.id,
      email: authData.user.email!,
      role: authData.user.role,
    });

    return {
      user: {
        id: authData.user.id,
        email: authData.user.email!,
        role: authData.user.role,
        metadata: authData.user.user_metadata,
        created_at: authData.user.created_at,
      },
      tokens,
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const { data: authData, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error) {
      throw new Error(`Token refresh failed: ${error.message}`);
    }

    if (!authData.user) {
      throw new Error('Token refresh failed');
    }

    const tokens = createTokens({
      id: authData.user.id,
      email: authData.user.email!,
      role: authData.user.role,
    });

    return {
      user: {
        id: authData.user.id,
        email: authData.user.email!,
        role: authData.user.role,
        metadata: authData.user.user_metadata,
      },
      tokens,
    };
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: process.env.PASSWORD_RESET_REDIRECT_URL,
    });

    if (error) {
      throw new Error(`Password reset request failed: ${error.message}`);
    }
  }

  /**
   * Update password
   */
  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (error) {
      throw new Error(`Password update failed: ${error.message}`);
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User | null> {
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (error) {
      throw new Error(`Failed to get user: ${error.message}`);
    }

    if (!data.user) {
      return null;
    }

    return {
      id: data.user.id,
      email: data.user.email!,
      role: data.user.role,
      metadata: data.user.user_metadata,
      created_at: data.user.created_at,
      updated_at: data.user.updated_at,
    };
  }

  /**
   * Update user metadata
   */
  async updateUserMetadata(userId: string, metadata: Record<string, any>): Promise<User> {
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: metadata,
    });

    if (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }

    return {
      id: data.user.id,
      email: data.user.email!,
      role: data.user.role,
      metadata: data.user.user_metadata,
      updated_at: data.user.updated_at,
    };
  }

  /**
   * Delete user
   */
  async deleteUser(userId: string): Promise<void> {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }
}

export const authService = new AuthService();
