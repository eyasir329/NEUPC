import { requireRole } from '@/app/_lib/auth-guard';

export default async function GuestLayout({ children }) {
  await requireRole('guest', { checkIsActive: false });
  return children;
}
