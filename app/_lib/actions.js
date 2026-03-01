/**
 * @file actions
 * @module actions
 */

'use server';

import { auth, signIn, signOut } from './auth';
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

  // Just redirect - role will be managed per-route
  redirect(path);
}

export async function setRoleAction(role) {
  // No-op function for now - role is set by the route being accessed
  return;
}
