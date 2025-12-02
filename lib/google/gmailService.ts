import { google } from 'googleapis';
import { createOAuth2Client } from './oauth2Client';
import User from '@/models/User';
import connectDB from '@/lib/mongodb';

/**
 * Send an email using Gmail API
 * Uses the authenticated user's Google OAuth tokens
 */
export async function sendEmail(
  userEmail: string,
  to: string,
  subject: string,
  htmlBody: string,
  textBody?: string
): Promise<void> {
  await connectDB();
  
  // Find the user who will send the email (must have Google OAuth connected)
  const user = await User.findOne({ email: userEmail.toLowerCase() });
  
  if (!user || !user.googleOAuth?.refreshToken) {
    throw new Error('User does not have Google account connected. Please connect your Google account in settings.');
  }

  const oauth2Client = createOAuth2Client();
  if (!oauth2Client) {
    throw new Error('Google OAuth2 client not configured');
  }

  // Set credentials
  oauth2Client.setCredentials({
    refresh_token: user.googleOAuth.refreshToken,
    access_token: user.googleOAuth.accessToken,
    expiry_date: user.googleOAuth.tokenExpiry?.getTime(),
  });

  // Refresh token if needed
  if (user.googleOAuth.tokenExpiry && user.googleOAuth.tokenExpiry.getTime() < Date.now()) {
    const { credentials } = await oauth2Client.refreshAccessToken();
    oauth2Client.setCredentials(credentials);
    
    // Update stored tokens
    if (user.googleOAuth) {
      user.googleOAuth.accessToken = credentials.access_token || user.googleOAuth.accessToken;
      user.googleOAuth.tokenExpiry = credentials.expiry_date 
        ? new Date(credentials.expiry_date) 
        : user.googleOAuth.tokenExpiry;
      await user.save();
    }
  }

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  // Create email message
  const messageParts = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/html; charset=utf-8',
    '',
    htmlBody,
  ];

  const message = messageParts.join('\n');
  const encodedMessage = Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedMessage,
    },
  });
}

