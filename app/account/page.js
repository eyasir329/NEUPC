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
import { supabaseAdmin } from '@/app/_lib/integrations/supabase';
import { roleDashboards } from '@/app/_lib/config/role-dashboard-config';
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

  // Fetch member profile for bio/skills (non-critical — silently ignore errors)
  let memberProfile = null;
  if (user?.id) {
    try {
      const { data } = await supabaseAdmin
        .from('member_profiles')
        .select('bio, skills, username')
        .eq('user_id', user.id)
        .maybeSingle();
      memberProfile = data;
    } catch {
      // non-critical — page renders fine without it
    }
  }

  const availableRoles = getAvailableDashboards(userRoles, user);
  // Single accessible dashboard → smooth client-side redirect
  const redirectPath =
    availableRoles.length === 1 ? availableRoles[0].config.path : null;

  return (
    <AccountPageClient redirectPath={redirectPath}>
      {/* Decorative gradient blobs — outside the overflow-clipped wrapper so sticky works */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="from-primary-500/8 absolute -top-20 -left-20 h-96 w-96 rounded-full bg-linear-to-br to-transparent blur-3xl" />
        <div className="from-secondary-500/8 absolute -right-20 -bottom-20 h-96 w-96 rounded-full bg-linear-to-tl to-transparent blur-3xl" />
      </div>

      {/* No overflow-x-hidden here — it would break position:sticky on the profile card */}
      <div className="relative z-10 w-full bg-[#030408] px-4 pt-24 pb-16 selection:bg-[#7C5CFF]/30 sm:px-6 sm:pt-28 lg:px-8 lg:pt-28">
        <div className="mx-auto w-full max-w-7xl">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
            {/* Left col — sticky profile card, clears the navbar */}
            <div className="lg:sticky lg:top-24 lg:col-span-4">
              <AccountHeader
                session={session.user}
                accountStatus={user?.account_status}
                user={user}
                userRoles={userRoles}
                bio={memberProfile?.bio ?? null}
                skills={memberProfile?.skills ?? []}
                username={memberProfile?.username ?? user?.username ?? null}
              />
            </div>

            {/* Right col — scrolls normally */}
            <div className="space-y-6 lg:col-span-8">
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
