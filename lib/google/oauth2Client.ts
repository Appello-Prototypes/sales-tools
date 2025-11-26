import { google } from 'googleapis';

/**
 * Create OAuth2 client instance
 * Returns null if credentials are not configured (instead of throwing)
 */
export function createOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback';

  if (!clientId || !clientSecret) {
    // Don't throw - return null so calling code can handle gracefully
    // This prevents server crashes when Google OAuth is not configured
    console.warn('⚠️  Google OAuth2 credentials not configured. Google SSO features will be disabled.');
    return null;
  }

  return new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );
}

