/**
 * @file Avatar
 * @module Avatar
 */

import Link from 'next/link';
import { auth } from '@/app/_lib/auth';

async function Avatar() {
  const session = await auth();

  if (!session?.user?.image) return null;

  return (
    <Link
      href="/account"
      className="hover:text-accent-400 flex items-center gap-2 transition-colors"
    >
      <img
        src={session.user.image}
        alt={session.user.name || 'User Avatar'}
        referrerPolicy="no-referrer"
        className="h-8 w-8 rounded-full"
      />
      <span className="hidden text-sm font-medium sm:inline">
        {session.user.name || 'Account'}
      </span>
    </Link>
  );
}

export default Avatar;
