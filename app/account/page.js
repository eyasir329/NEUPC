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
import { requireAuth } from '@/app/_lib/auth/auth-guard';
import { roleDashboards } from '@/app/_lib/config/roleDashboardConfig';
import AccountPageClient from './_components/AccountPageClient';
import AccountHeader from './_components/AccountHeader';
import AvailableRoles from './_components/AvailableRoles';
import AccountStatusMessages from './_components/AccountStatusMessages';
import PendingRoleAssignment from './_components/PendingRoleAssignment';
import UpgradeBanner from './_components/UpgradeBanner';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'My Account | NEUPC' };

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Check whether a user with the given role can access their dashboard.
 * Only account_status matters — is_online is a heartbeat/presence flag updated
 * every 60 s and must NOT gate access (users would get kicked out mid-session).
 */
function canAccessDashboard(role, user) {
  return user?.account_status === 'active';
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
  const { session, user, userRoles: rawRoles } = await requireAuth();

  // Users must have roles explicitly assigned by admin — no default guest role
  const userRoles = rawRoles;

  const availableRoles = getAvailableDashboards(userRoles, user);

  // Single accessible dashboard → smooth client-side redirect
  const redirectPath =
    availableRoles.length === 1 ? availableRoles[0].config.path : null;

  return (
    <AccountPageClient redirectPath={redirectPath}>
      <div className="relative w-full overflow-x-hidden bg-[#030408] px-4 pt-24 pb-16 sm:px-6 sm:pt-28 lg:px-8 lg:pt-32 selection:bg-[#7C5CFF]/30">
        {/* Decorative gradient blobs */}
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="from-primary-500/10 absolute -top-20 -left-20 h-96 w-96 rounded-full bg-linear-to-br to-transparent blur-3xl" />
          <div className="from-secondary-500/10 absolute -right-20 -bottom-20 h-96 w-96 rounded-full bg-linear-to-tl to-transparent blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto max-w-5xl w-full">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            {/* Left: sticky profile card */}
            <div className="w-full lg:w-72 lg:shrink-0 lg:sticky lg:top-8">
              <AccountHeader
                session={session.user}
                accountStatus={user?.account_status}
                user={user}
                userRoles={userRoles}
              />
            </div>

            {/* Right: main content */}
            <div className="min-w-0 flex-1 space-y-6">
              <AvailableRoles
                availableRoles={availableRoles}
                accountStatus={user?.account_status}
              />

              {userRoles.length === 0 && user?.account_status === 'active' && (
                <PendingRoleAssignment />
              )}

              <AccountStatusMessages
                accountStatus={user?.account_status}
                statusReason={user?.status_reason}
                statusChangedBy={user?.status_changed_by}
                suspensionExpiresAt={user?.suspension_expires_at}
                userId={user?.id}
                userName={session.user?.name ?? ''}
                userEmail={session.user?.email ?? ''}
              />

              <UpgradeBanner
                accountStatus={user?.account_status}
                userRoles={userRoles}
              />
            </div>
          </div>
        </div>
      </div>
    </AccountPageClient>
  );
}
