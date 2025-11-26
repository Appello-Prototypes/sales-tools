import { google } from 'googleapis';
import { createOAuth2Client } from './oauth2Client';

/**
 * Get OAuth2 authorization URL
 * @param state - State parameter (userId for email connection, 'login' for initial login)
 * @param redirectUri - OAuth redirect URI
 * @returns Authorization URL
 */
export function getAuthUrl(state: string, redirectUri: string): string {
  // Check credentials first before creating client
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    throw new Error('Google OAuth2 credentials not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.');
  }
  
  const client = createOAuth2Client();
  
  if (!client) {
    throw new Error('Google OAuth2 client creation failed. Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.');
  }
  
  const scopes = [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
  ];

  const url = client.generateAuthUrl({
    access_type: 'offline', // Required to get refresh token
    scope: scopes,
    prompt: 'consent', // Force consent screen to get refresh token
    state: state || 'login', // Pass state for security
    redirect_uri: redirectUri
  });

  return url;
}

/**
 * Exchange authorization code for tokens
 * @param code - Authorization code from Google
 * @param redirectUri - OAuth redirect URI
 * @returns Tokens and user info
 */
export async function getTokensFromCode(code: string, redirectUri: string) {
  const client = createOAuth2Client();
  
  if (!client) {
    throw new Error('Google OAuth2 credentials not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.');
  }
  
  client.redirectUri = redirectUri;

  try {
    const { tokens } = await client.getToken(code);
    
    // Get user info
    client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: client });
    const { data: userInfo } = await oauth2.userinfo.get();

    return {
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token!,
      tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      email: userInfo.email!,
      scope: tokens.scope
    };
  } catch (error) {
    console.error('Error getting tokens:', error);
    throw new Error('Failed to exchange authorization code for tokens');
  }
}

/**
 * Get valid access token (refresh if needed)
 * @param user - User document with googleOAuth
 * @returns Valid access token
 */
export async function getValidAccessToken(user: any): Promise<string> {
  if (!user.googleOAuth || !user.googleOAuth.refreshToken) {
    throw new Error('Google account not connected');
  }

  const client = createOAuth2Client();
  if (!client) {
    throw new Error('Google OAuth2 credentials not configured');
  }
  
  // Check if token is expired or expires soon (within 5 minutes)
  const expiresSoon = user.googleOAuth.tokenExpiry && 
    new Date(user.googleOAuth.tokenExpiry) < new Date(Date.now() + 5 * 60 * 1000);

  if (!user.googleOAuth.accessToken || expiresSoon) {
    // Refresh the token
    client.setCredentials({
      refresh_token: user.googleOAuth.refreshToken
    });

    try {
      const { credentials } = await client.refreshAccessToken();
      
      // Update user's tokens
      user.googleOAuth.accessToken = credentials.access_token!;
      if (credentials.refresh_token) {
        user.googleOAuth.refreshToken = credentials.refresh_token;
      }
      user.googleOAuth.tokenExpiry = credentials.expiry_date ? new Date(credentials.expiry_date) : null;
      await user.save();

      return credentials.access_token!;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw new Error('Failed to refresh access token. Please reconnect your Google account.');
    }
  }

  return user.googleOAuth.accessToken;
}

/**
 * Revoke access token
 * @param refreshToken - Refresh token to revoke
 */
export async function revokeToken(refreshToken: string) {
  const client = createOAuth2Client();
  if (!client) {
    throw new Error('Google OAuth2 credentials not configured');
  }
  client.setCredentials({ refresh_token: refreshToken });
  
  try {
    await client.revokeCredentials();
  } catch (error) {
    console.error('Error revoking token:', error);
    // Don't throw - token might already be revoked
  }
}

