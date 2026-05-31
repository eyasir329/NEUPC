/**
 * GET /api/integrations/google-calendar/callback
 * Google redirects here after consent. Verifies the CSRF state, exchanges the
 * code for tokens, stores the connection for the logged-in member, and returns
 * them to the Daily Activity page with a status flag.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/app/_lib/auth/auth';
import {
  exchangeCode,
  saveConnection,
} from '@/app/_lib/integrations/google-calendar';

const DEST = '/account/member/daily-activity';

function back(req, status) {
  return NextResponse.redirect(new URL(`${DEST}?gcal=${status}`, req.url));
}

export async function GET(req) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const expectedState = req.cookies.get('gcal_oauth_state')?.value;

  const finish = (status) => {
    const res = back(req, status);
    res.cookies.delete('gcal_oauth_state');
    return res;
  };

  if (error || !code) return finish('denied');
  if (!state || !expectedState || state !== expectedState) {
    return finish('error');
  }

  try {
    const { tokens, email } = await exchangeCode(code);
    await saveConnection(session.user.id, { tokens, email });
    return finish('connected');
  } catch (err) {
    console.error('google-calendar callback:', err?.message);
    return finish('error');
  }
}
