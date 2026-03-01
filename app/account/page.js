/**
 * @file Account hub / role-selection page (server component).
 * Authenticates the user, auto-redirects single-role users to their
 * dashboard, and renders the role-selection grid for multi-role users.
 *
 * @module AccountPage
 * @requires requireAuth  — redirects unauthenticated visitors to /login
 * @requires roleDashboards — role → dashboard config mapping
 */

import { redirect } from 'next/navigation';
import { requireAuth } from '../_lib/auth-guard';
import { roleDashboards } from '../_lib/roleDashboardConfig';
import AccountPageClient from './_components/AccountPageClient';
import AccountHeader from './_components/AccountHeader';
import UserAvatar from './_components/UserAvatar';
import AvailableRoles from './_components/AvailableRoles';
import AccountStatusMessages from './_components/AccountStatusMessages';
import UpgradeBanner from './_components/UpgradeBanner';

export const metadata = { title: 'My Account | NEUPC' };

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Check whether a user with the given role can access their dashboard.
 * Guests only need `active` account status; other roles also need `is_active`.
 */
function canAccessDashboard(role, user) {
  if (user?.account_status !== 'active') return false;
  return role === 'guest' || user?.is_active === true;
}

/**
 * Build the list of dashboards the user is eligible to enter.
 * @param {string[]} roles
 * @param {Object}   user
 */
function getAvailableDashboards(roles, user) {
  return roles
    .map((role) => ({ role, config: roleDashboards[role] }))
    .filter(({ role, config }) => config && canAccessDashboard(role, user));
}

// ── Page ────────────────────────────────────────────────────────────────────

export default async function AccountPage() {
  const { session, user, userRoles } = await requireAuth();

  // Single-role users: auto-redirect to their dashboard
  if (userRoles.length === 1 && canAccessDashboard(userRoles[0], user)) {
    redirect(`/account/${userRoles[0]}`);
  }

  const availableRoles = getAvailableDashboards(userRoles, user);

  return (
    <AccountPageClient>
      <div className="min-h-screen px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <AccountHeader session={session.user} />
          <UserAvatar session={session.user} />
          <AvailableRoles
            availableRoles={availableRoles}
            accountStatus={user?.account_status}
          />
          <AccountStatusMessages
            accountStatus={user?.account_status}
            statusReason={user?.status_reason}
            statusChangedBy={user?.status_changed_by}
            suspensionExpiresAt={user?.suspension_expires_at}
            userId={user?.id}
          />
          <UpgradeBanner
            accountStatus={user?.account_status}
            userRoles={userRoles}
          />
        </div>
      </div>
    </AccountPageClient>
  );
}
