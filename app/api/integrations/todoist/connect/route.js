/**
 * GET /api/integrations/todoist/connect
 * Kicks off the per-member Todoist OAuth flow: sets a short-lived
 * CSRF state cookie and redirects the member to Todoist's consent screen.
 */

import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { auth } from '@/app/_lib/auth/auth';
import { getAuthUrl } from '@/app/_lib/integrations/todoist';

export async function GET(req) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  try {
    const state = randomUUID();
    const authUrl = getAuthUrl(state);
    const res = NextResponse.redirect(authUrl);

    res.cookies.set('todoist_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 600, // 10 minutes
    });

    return res;
  } catch (err) {
    console.error('Todoist connect error:', err?.message);
    const returnUrl = new URL('/account/member/daily-activity', req.url);
    returnUrl.searchParams.set('todoist', 'missing_config');
    return NextResponse.redirect(returnUrl);
  }
}
