/**
 * @file Account hub quick actions — settings shortcut + sign-out.
 * Rendered in the hero so users can manage or leave their account without
 * first entering a dashboard. Settings links to the primary role's settings
 * page (every role exposes one); sign-out is always available.
 *
 * @module AccountActions
 */

import Link from 'next/link';
import { Settings, LogOut } from 'lucide-react';
import { signOutAction } from '@/app/_lib/actions/actions';

/** @param {{ primaryRole: string|null, accountStatus: string }} props */
export default function AccountActions({ primaryRole, accountStatus }) {
  const showSettings = accountStatus === 'active' && Boolean(primaryRole);

  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
      {showSettings && (
        <Link
          href={`/account/${primaryRole}/settings`}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-gray-200 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:outline-none active:scale-[0.98]"
        >
          <Settings className="h-4 w-4" />
          Account settings
        </Link>
      )}
      <form action={signOutAction}>
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/5 px-4 py-2 text-sm font-medium text-red-300 backdrop-blur-sm transition-all hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-200 focus-visible:ring-2 focus-visible:ring-red-500/40 focus-visible:outline-none active:scale-[0.98]"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </form>
    </div>
  );
}
