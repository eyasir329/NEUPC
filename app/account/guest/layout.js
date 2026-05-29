/**
 * @file Guest layout
 * @module GuestLayout
 */

import { requireRole } from '@/app/_lib/auth/auth-guard';

export default async function GuestLayout({ children }) {
  await requireRole('guest', { checkIsActive: false });
  return children;
}
