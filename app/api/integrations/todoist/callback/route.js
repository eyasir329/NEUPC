/**
 * GET /api/integrations/todoist/callback
 * Todoist redirects here after consent. Verifies the CSRF state, exchanges the
 * code for access token, stores the connection, and redirects the member.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/app/_lib/auth/auth';
import {
  exchangeCode,
  fetchTodoistUserInfo,
  saveConnection,
} from '@/app/_lib/integrations/todoist';

const DEST = '/account/member/daily-activity';

function back(req, status) {
  return NextResponse.redirect(new URL(`${DEST}?todoist=${status}`, req.url));
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
  const expectedState = req.cookies.get('todoist_oauth_state')?.value;

  const finish = (status) => {
    const res = back(req, status);
    res.cookies.delete('todoist_oauth_state');
    return res;
  };

  if (error || !code) return finish('denied');
  if (!state || !expectedState || state !== expectedState) {
    return finish('error');
  }

  try {
    const token = await exchangeCode(code);
    const userInfo = await fetchTodoistUserInfo(token);
    await saveConnection(session.user.id, {
      token,
      email: userInfo.email,
      name: userInfo.name,
    });
    return finish('connected');
  } catch (err) {
    console.error('todoist callback error:', err?.message);
    const returnUrl = new URL(`${DEST}?todoist=error&message=${encodeURIComponent(err.message || 'Unknown error')}`, req.url);
    const res = NextResponse.redirect(returnUrl);
    res.cookies.delete('todoist_oauth_state');
    return res;
  }
}
