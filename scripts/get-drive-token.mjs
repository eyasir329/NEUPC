/**
 * One-time script to obtain a Google Drive OAuth2 refresh token.
 * Run: GDRIVE_CLIENT_ID=... GDRIVE_CLIENT_SECRET=... node scripts/get-drive-token.mjs
 * Then copy the printed refresh token into GDRIVE_REFRESH_TOKEN in .env.local
 */

import http from 'http';
import { google } from 'googleapis';

const clientId = process.env.GDRIVE_CLIENT_ID;
const clientSecret = process.env.GDRIVE_CLIENT_SECRET;
const redirectUri = 'http://localhost:3001/callback';

if (!clientId || !clientSecret) {
  console.error('Missing GDRIVE_CLIENT_ID or GDRIVE_CLIENT_SECRET');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/drive.file',
  ],
  prompt: 'consent',
});

console.log('\nOpen this URL in your browser:\n');
console.log(authUrl);
console.log('\nWaiting for callback on http://localhost:3001/callback ...\n');

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost:3001');
  const code = url.searchParams.get('code');

  if (!code) {
    res.writeHead(400);
    res.end('No code found in callback URL.');
    return;
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Token obtained! Check your terminal.');

    console.log('\n=== REFRESH TOKEN ===');
    console.log(tokens.refresh_token);
    console.log('====================');
    console.log('\nAdd this to .env.local:');
    console.log(`GDRIVE_REFRESH_TOKEN=${tokens.refresh_token}`);
  } catch (err) {
    res.writeHead(500);
    res.end('Error getting token: ' + err.message);
    console.error('Error:', err);
  } finally {
    server.close();
  }
});

server.listen(3001);
