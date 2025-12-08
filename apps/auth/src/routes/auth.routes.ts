import { Router } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.service.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { authenticate, type AuthRequest } from '../middleware/auth.middleware.js';
import { OAUTH_PROVIDERS } from '../config/supabase.js';

const router = Router();

// Validation schemas
const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  metadata: z.record(z.any()).optional(),
});

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string(),
});

const passwordResetSchema = z.object({
  email: z.string().email(),
});

/**
 * POST /auth/signup
 * Register a new user with email and password
 */
router.post('/signup', asyncHandler(async (req, res) => {
  const data = signUpSchema.parse(req.body);
  const result = await authService.signUp(data);
  
  res.status(201).json(result);
}));

/**
 * POST /auth/signin
 * Sign in with email and password
 */
router.post('/signin', asyncHandler(async (req, res) => {
  const data = signInSchema.parse(req.body);
  const result = await authService.signIn(data);
  
  res.json(result);
}));

/**
 * POST /auth/signout
 * Sign out current user
 */
router.post('/signout', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const token = req.headers.authorization?.substring(7) || '';
  await authService.signOut(token);
  
  res.json({ message: 'Signed out successfully' });
}));

/**
 * POST /auth/refresh
 * Refresh access token
 */
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = refreshTokenSchema.parse(req.body);
  const result = await authService.refreshToken(refreshToken);
  
  res.json(result);
}));

/**
 * POST /auth/password-reset
 * Request password reset email
 */
router.post('/password-reset', asyncHandler(async (req, res) => {
  const { email } = passwordResetSchema.parse(req.body);
  await authService.requestPasswordReset(email);
  
  res.json({ message: 'Password reset email sent' });
}));

/**
 * GET /auth/oauth/:provider
 * Get OAuth URL for provider
 */
router.get('/oauth/:provider', asyncHandler(async (req, res) => {
  const provider = req.params.provider as 'google' | 'github' | 'discord';
  
  if (!OAUTH_PROVIDERS[provider]?.enabled) {
    res.status(400).json({
      error: 'Bad Request',
      message: `OAuth provider '${provider}' is not enabled`,
    });
    return;
  }
  
  const redirectUrl = req.query.redirect as string | undefined;
  const url = await authService.getOAuthUrl(provider, redirectUrl);
  
  res.json({ url, provider });
}));

/**
 * GET /auth/oauth/callback
 * Handle OAuth callback
 */
router.get('/oauth/callback', asyncHandler(async (req, res) => {
  const code = req.query.code as string;
  
  if (!code) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'Missing authorization code',
    });
    return;
  }
  
  const result = await authService.handleOAuthCallback(code);
  
  // Redirect to frontend with tokens
  const redirectUrl = new URL(process.env.OAUTH_SUCCESS_REDIRECT_URL || 'http://localhost:3000/auth/callback');
  redirectUrl.searchParams.set('access_token', result.tokens.accessToken);
  redirectUrl.searchParams.set('refresh_token', result.tokens.refreshToken);
  
  res.redirect(redirectUrl.toString());
}));

/**
 * GET /auth/me
 * Get current user info
 */
router.get('/me', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const user = await authService.getUserById(req.user!.id);
  
  if (!user) {
    res.status(404).json({
      error: 'Not Found',
      message: 'User not found',
    });
    return;
  }
  
  res.json({ user });
}));

/**
 * PATCH /auth/me
 * Update current user metadata
 */
router.patch('/me', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const metadata = z.record(z.any()).parse(req.body);
  const user = await authService.updateUserMetadata(req.user!.id, metadata);
  
  res.json({ user });
}));

/**
 * DELETE /auth/me
 * Delete current user account
 */
router.delete('/me', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  await authService.deleteUser(req.user!.id);
  
  res.json({ message: 'Account deleted successfully' });
}));

export default router;
