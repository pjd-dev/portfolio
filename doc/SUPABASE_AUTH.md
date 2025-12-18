# Supabase Authentication Implementation

Complete authentication service for Vault platform with email/password and OAuth support.

## Location

All authentication code is in: `/apps/auth/`

## Structure

```
apps/auth/
├── src/
│   ├── config/
│   │   └── supabase.ts          # Supabase client configuration
│   ├── middleware/
│   │   ├── auth.middleware.ts   # JWT authentication middleware
│   │   └── error.middleware.ts  # Error handling
│   ├── routes/
│   │   └── auth.routes.ts       # API endpoints
│   ├── services/
│   │   └── auth.service.ts      # Authentication business logic
│   ├── types/
│   │   └── auth.ts              # TypeScript interfaces
│   ├── utils/
│   │   └── jwt.ts               # JWT token utilities
│   └── index.ts                 # Express app entry point
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
└── README.md
```

## Features

### ✅ Email/Password Authentication

- User registration with email validation
- Secure password-based login
- Password reset flow
- Email verification

### ✅ OAuth Providers

- Google OAuth
- GitHub OAuth
- Discord OAuth
- Easy to add more providers

### ✅ JWT Token Management

- Custom JWT token generation
- Access token with configurable expiration
- Refresh token for long sessions
- Token verification middleware

### ✅ User Management

- Get user profile
- Update user metadata
- Delete user account
- Role-based access control

## API Endpoints

All endpoints are prefixed with `/auth`:

| Method | Endpoint                | Description              | Auth Required |
| ------ | ----------------------- | ------------------------ | ------------- |
| POST   | `/auth/signup`          | Register new user        | No            |
| POST   | `/auth/signin`          | Sign in with credentials | No            |
| POST   | `/auth/signout`         | Sign out user            | Yes           |
| POST   | `/auth/refresh`         | Refresh access token     | No            |
| POST   | `/auth/password-reset`  | Request password reset   | No            |
| GET    | `/auth/oauth/:provider` | Get OAuth URL            | No            |
| GET    | `/auth/oauth/callback`  | OAuth callback handler   | No            |
| GET    | `/auth/me`              | Get current user         | Yes           |
| PATCH  | `/auth/me`              | Update user metadata     | Yes           |
| DELETE | `/auth/me`              | Delete account           | Yes           |
| GET    | `/health`               | Health check             | No            |

## Setup Instructions

### 1. Install Dependencies

```bash
cd apps/auth
npm install
```

### 2. Configure Supabase

Create a Supabase project at https://supabase.com

1. Create new project
2. Go to Settings > API
3. Copy your project credentials:
   - Project URL
   - Anon key
   - Service role key

### 3. Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required variables:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
JWT_SECRET=your-secret-key-change-in-production
```

Optional (for OAuth):

```env
OAUTH_GOOGLE_ENABLED=true
OAUTH_GOOGLE_CLIENT_ID=your-client-id
OAUTH_GOOGLE_CLIENT_SECRET=your-client-secret

OAUTH_GITHUB_ENABLED=true
OAUTH_GITHUB_CLIENT_ID=your-client-id
OAUTH_GITHUB_CLIENT_SECRET=your-client-secret

OAUTH_DISCORD_ENABLED=true
OAUTH_DISCORD_CLIENT_ID=your-client-id
OAUTH_DISCORD_CLIENT_SECRET=your-client-secret
```

### 4. Enable Authentication in Supabase

In your Supabase dashboard:

1. Go to **Authentication** > **Providers**
2. Enable **Email** provider
3. (Optional) Enable OAuth providers:
   - Click on provider (Google/GitHub/Discord)
   - Enable and configure with Client ID and Secret
   - Add callback URL: `https://your-project.supabase.co/auth/v1/callback`

### 5. Run the Service

Development:

```bash
npm run dev
```

Production:

```bash
npm run build
npm start
```

Service runs on port 3001 by default (configurable via `AUTH_PORT` env var).

## Usage Examples

### Sign Up

```bash
curl -X POST http://localhost:3001/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123",
    "metadata": {
      "name": "John Doe"
    }
  }'
```

Response:

```json
{
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "role": "authenticated",
    "metadata": {
      "name": "John Doe"
    },
    "created_at": "2025-12-06T04:00:00Z"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 604800,
    "tokenType": "Bearer"
  }
}
```

### Sign In

```bash
curl -X POST http://localhost:3001/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123"
  }'
```

### Get Current User

```bash
curl -X GET http://localhost:3001/auth/me \
  -H "Authorization: Bearer <access_token>"
```

### OAuth Flow

1. Get OAuth URL:

```bash
curl http://localhost:3001/auth/oauth/google?redirect=http://localhost:3000/callback
```

2. Redirect user to returned URL
3. User authorizes on provider
4. Provider redirects to `/auth/oauth/callback?code=...`
5. Service exchanges code for session and redirects with tokens

## Security Features

- ✅ Secure password hashing (handled by Supabase)
- ✅ JWT token signing with secret
- ✅ Token expiration and refresh
- ✅ CORS configuration
- ✅ Request validation with Zod
- ✅ Error handling middleware
- ✅ Role-based access control

## Integration with Vault Platform

The auth service is designed to work with other Vault services:

1. **MCP Server** - Can validate JWT tokens for authenticated tool access
2. **Frontend** - Use tokens in Authorization headers
3. **API Gateway** - Validate tokens before routing requests

### Example Middleware Integration

```typescript
import { verifyToken } from '@vault/auth/utils/jwt';

// In your Express app
app.use((req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    try {
      req.user = verifyToken(token);
    } catch (err) {
      // Invalid token
    }
  }
  next();
});
```

## OAuth Provider Setup Guides

### Google OAuth

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create project > Enable Google+ API
3. Create OAuth 2.0 Client ID credentials
4. Add authorized redirect: `https://your-project.supabase.co/auth/v1/callback`
5. Copy Client ID and Secret to `.env`

### GitHub OAuth

1. Visit [GitHub Developer Settings](https://github.com/settings/developers)
2. Create new OAuth App
3. Set callback: `https://your-project.supabase.co/auth/v1/callback`
4. Copy Client ID and Secret to `.env`

### Discord OAuth

1. Visit [Discord Developer Portal](https://discord.com/developers/applications)
2. Create application > OAuth2 settings
3. Add redirect: `https://your-project.supabase.co/auth/v1/callback`
4. Copy Client ID and Secret to `.env`

## Development

Type check:

```bash
npm run typecheck
```

Build:

```bash
npm run build
```

Watch mode:

```bash
npm run dev
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Use strong `JWT_SECRET`
3. Enable HTTPS
4. Set up rate limiting
5. Enable email verification in Supabase
6. Configure proper CORS origins
7. Set up monitoring and logging

## Troubleshooting

### "Missing required environment variables"

- Check `.env` file exists and contains all required variables
- Verify Supabase credentials are correct

### "OAuth provider not enabled"

- Set `OAUTH_*_ENABLED=true` in `.env`
- Configure OAuth credentials in Supabase dashboard

### "Invalid or expired token"

- Check JWT_SECRET matches between requests
- Verify token hasn't expired (default 7 days)
- Use refresh token to get new access token

## Next Steps

- [ ] Add rate limiting for production
- [ ] Implement 2FA support
- [ ] Add session management
- [ ] Set up email templates
- [ ] Add audit logging
- [ ] Implement account lockout after failed attempts

## Related Documentation

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OAuth 2.0 Spec](https://oauth.net/2/)
