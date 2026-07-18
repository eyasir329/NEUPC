/**
 * @file actions
 * @module actions
 */

'use server';

import { auth, signIn, signOut } from '@/app/_lib/auth/auth';
import { redirect } from 'next/navigation';

export async function signInAction() {
  await signIn('google', { redirectTo: '/account' });
}

export async function signOutAction() {
  await signOut({ redirectTo: '/' });
}

export async function switchRoleAction(role, path) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Only allow same-site relative paths — a client-supplied absolute URL
  // (or protocol-relative "//host") would make this an open redirect.
  const safePath =
    typeof path === 'string' && path.startsWith('/') && !path.startsWith('//')
      ? path
      : '/account';
  redirect(safePath);
}

export async function setRoleAction(role) {
  // No-op function for now - role is set by the route being accessed
  return;
}
