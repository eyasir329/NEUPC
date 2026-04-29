/**
 * @file Guest dashboard layout.
 * Enforces `guest` role (skips `is_online` check since guests
 * don't require member activation). Wraps children in scoped
 * design-token root + sticky topbar matching Claude design spec.
 *
 * @module GuestLayout
 * @access guest
 */

import { requireRole } from '@/app/_lib/auth-guard';
import GuestTopbar from './_components/GuestTopbar';
import './_components/guest-design.css';

export default async function GuestLayout({ children }) {
  await requireRole('guest', { checkIsActive: false });

  return (
    <div className="guest-panel">
      <div className="gp-main">
        <GuestTopbar />
        {children}
      </div>
    </div>
  );
}
