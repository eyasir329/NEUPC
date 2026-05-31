/**
 * GET /api/integrations/google-calendar/connect
 * Kicks off the per-member Google Calendar OAuth flow: sets a short-lived
 * CSRF state cookie and redirects the member to Google's consent screen.
 */

import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { auth } from '@/app/_lib/auth/auth';
import { getAuthUrl } from '@/app/_lib/integrations/google-calendar';

export async function GET(req) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const state = randomUUID();
  const res = NextResponse.redirect(getAuthUrl(state));
  res.cookies.set('gcal_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 600, // 10 minutes
  });
  return res;
}
