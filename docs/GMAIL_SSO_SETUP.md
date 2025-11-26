# Gmail SSO Setup Guide

This guide explains how to set up Google Single Sign-On (SSO) authentication for the sales-tools application, based on the gmail-sso-standalone implementation.

## What Was Implemented

### Backend Components

1. **User Model Updates** (`models/User.ts`)
   - Added `googleOAuth` field to store OAuth tokens
   - Made `passwordHash` optional when Google OAuth is present
   - Added pre-save hook to skip password hashing for Google OAuth users

2. **OAuth Utilities** (`lib/google/`)
   - `oauth2Client.ts` - Creates Google OAuth2 client instance
   - `googleOAuth.ts` - OAuth helper functions (getAuthUrl, getTokensFromCode, getValidAccessToken, revokeToken)

3. **API Routes** (`app/api/auth/google/`)
   - `GET /api/auth/google/connect` - Initiates OAuth flow
   - `GET /api/auth/google/callback` - Handles OAuth callback
   - `GET /api/auth/google/status` - Check connection status
   - `POST /api/auth/google/disconnect` - Disconnect Google account

### Frontend Components

1. **Login Page** (`app/admin/login/page.tsx`)
   - Added "Sign in with Google" button
   - Opens OAuth flow in popup window
   - Handles popup communication

2. **Auth Callback** (`app/auth/callback/page.tsx`)
   - Handles OAuth callback
   - Stores token and redirects to dashboard
   - Supports both popup and direct navigation

## Setup Instructions

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Gmail API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Gmail API"
   - Click "Enable"

4. Configure OAuth Consent Screen:
   - Go to "APIs & Services" > "OAuth consent screen"
   - User Type: External (or Internal if using Google Workspace)
   - App name: Your App Name
   - User support email: Your email
   - Developer contact: Your email
   - Scopes: Add these scopes:
     - `https://www.googleapis.com/auth/gmail.send`
     - `https://www.googleapis.com/auth/userinfo.email`
     - `https://www.googleapis.com/auth/userinfo.profile`
   - Save and continue

5. Create OAuth2 Credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Application type: **Web application**
   - Name: Your App Name
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for local development)
     - `https://your-production-domain.com` (for production)
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/google/callback` (for local)
     - `https://your-production-domain.com/api/auth/google/callback` (for production)
   - Click "Create"
   - **Copy the Client ID and Client Secret**

### 2. Environment Variables

Add to your `.env.local` file:

```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# Already configured:
NEXT_PUBLIC_APP_URL=http://localhost:3000
JWT_SECRET=your-secret-key-change-in-production
```

### 3. Install Dependencies

The `googleapis` package should already be installed. If not:

```bash
npm install googleapis
```

## Usage

### For Users

1. Navigate to `/admin/login`
2. Click "Sign in with Google"
3. Complete OAuth flow in popup
4. User is automatically created/updated with Google account
5. Redirected to admin dashboard

### For Developers

#### Check Connection Status

```typescript
const response = await fetch('/api/auth/google/status', {
  headers: {
    'Cookie': `admin_token=${token}`
  }
});
const status = await response.json();
// { success: true, isConnected: true, email: "user@gmail.com" }
```

#### Disconnect Google Account

```typescript
await fetch('/api/auth/google/disconnect', {
  method: 'POST',
  headers: {
    'Cookie': `admin_token=${token}`
  }
});
```

## Features

- ✅ **One-click Google login** - No password required
- ✅ **Automatic user creation** - Users created on first Google login
- ✅ **Token management** - Automatic token refresh
- ✅ **Secure** - HTTP-only cookies, OAuth2 flow
- ✅ **Popup-based** - HubSpot-style popup flow
- ✅ **Backward compatible** - Existing password login still works

## User Flow

1. User clicks "Sign in with Google"
2. Popup opens with Google OAuth consent screen
3. User grants permissions
4. Google redirects to `/api/auth/google/callback`
5. Backend exchanges code for tokens
6. User is created/updated in database
7. JWT token generated and set as HTTP-only cookie
8. Redirect to `/auth/callback` with token in URL (for popup communication)
9. Frontend callback page stores token and closes popup
10. User redirected to admin dashboard

## Security Considerations

- Tokens stored securely in database
- HTTP-only cookies prevent XSS attacks
- OAuth state parameter for CSRF protection
- Token refresh handled automatically
- Token revocation on disconnect

## Troubleshooting

### "Google OAuth is not configured"
- Check that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in `.env.local`
- Restart the development server after adding environment variables

### "Invalid redirect URI"
- Check that redirect URI in Google Console matches exactly
- Include both frontend and backend callback URLs
- Verify protocol (http vs https)
- Wait 1-2 minutes after adding redirect URI

### "Popup blocked"
- Allow popups for your domain
- Check browser popup blocker settings
- Try in incognito mode

### "Token expired"
- System should auto-refresh tokens
- If fails, user needs to reconnect Google account
- Check refresh token is stored in database

## Next Steps

- Add Gmail sending functionality using the stored OAuth tokens
- Add settings page to connect/disconnect Google account
- Add email notifications using Gmail API

