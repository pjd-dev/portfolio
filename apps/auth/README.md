# Vault Auth Service

Supabase authentication service for the Vault platform with email/password and OAuth support.

## Features

- ✅ Email/Password authentication
- ✅ OAuth (Google, GitHub, Discord)
- ✅ JWT token management
- ✅ Password reset flow
- ✅ User profile management
- ✅ Role-based access control

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Required variables:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
- `JWT_SECRET`: Secret key for JWT signing

### 3. Set up Supabase

1. Create a Supabase project at https://supabase.com
2. Enable Email authentication in Authentication > Providers
3. (Optional) Enable OAuth providers (Google, GitHub, Discord)
4. Copy your project credentials to `.env`

### 4. Run the service

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm run build
npm start
```

## API Endpoints

### Authentication

#### Sign Up
```http
POST /auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "metadata": {
    "name": "John Doe"
  }
}
```

#### Sign In
```http
POST /auth/signin
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

#### Sign Out
```http
POST /auth/signout
Authorization: Bearer <access_token>
```

#### Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "<refresh_token>"
}
```

### OAuth

#### Get OAuth URL
```http
GET /auth/oauth/:provider?redirect=http://localhost:3000/callback
```

Supported providers: `google`, `github`, `discord`

#### OAuth Callback
```http
GET /auth/oauth/callback?code=<authorization_code>
```

### User Management

#### Get Current User
```http
GET /auth/me
Authorization: Bearer <access_token>
```

#### Update User Metadata
```http
PATCH /auth/me
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Jane Doe",
  "avatar": "https://example.com/avatar.jpg"
}
```

#### Delete Account
```http
DELETE /auth/me
Authorization: Bearer <access_token>
```

### Password Reset

#### Request Reset
```http
POST /auth/password-reset
Content-Type: application/json

{
  "email": "user@example.com"
}
```

## Response Format

### Success Response
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "authenticated",
    "metadata": {},
    "created_at": "2025-01-01T00:00:00Z"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 604800,
    "tokenType": "Bearer"
  }
}
```

### Error Response
```json
{
  "error": "Unauthorized",
  "message": "Invalid credentials"
}
```

## OAuth Provider Setup

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`
6. Copy Client ID and Secret to `.env`

### GitHub OAuth

1. Go to [GitHub Settings > Developer Settings](https://github.com/settings/developers)
2. Create new OAuth App
3. Set callback URL: `https://your-project.supabase.co/auth/v1/callback`
4. Copy Client ID and Secret to `.env`

### Discord OAuth

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create new application
3. Go to OAuth2 settings
4. Add redirect: `https://your-project.supabase.co/auth/v1/callback`
5. Copy Client ID and Secret to `.env`

## Security Notes

- Always use HTTPS in production
- Keep `JWT_SECRET` and `SUPABASE_SERVICE_ROLE_KEY` secure
- Enable email verification in Supabase settings
- Set up rate limiting for production
- Use strong password requirements
- Enable 2FA for admin accounts

## Development

Type checking:
```bash
npm run typecheck
```

Build:
```bash
npm run build
```

## Architecture

```
src/
├── config/         # Configuration and Supabase client
├── middleware/     # Express middleware (auth, errors)
├── routes/         # API route handlers
├── services/       # Business logic
├── types/          # TypeScript type definitions
├── utils/          # Utility functions (JWT, etc.)
└── index.ts        # Application entry point
```

## License

MIT
