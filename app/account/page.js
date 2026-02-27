import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import { getUserRoles, getUserByEmail } from '../_lib/data-service';
import { roleDashboards } from '../_lib/roleDashboardConfig';
import AccountPageClient from './_components/AccountPageClient';
import AccountHeader from './_components/AccountHeader';
import UserAvatar from './_components/UserAvatar';
import AvailableRoles from './_components/AvailableRoles';
import AccountStatusMessages from './_components/AccountStatusMessages';
import UpgradeBanner from './_components/UpgradeBanner';

async function page() {
  const session = await auth();
  // Redirect to login if not authenticated
  if (!session?.user) {
    redirect('/login');
  }

  const userRoles = await getUserRoles(session.user.email);

  // Fetch user account status and is_active flag
  const userData = await getUserByEmail(session.user.email);

  // if userRoles.length == 1 then redirect to that dashboard directly (only if account is active)
  if (userRoles.length === 1 && userData?.account_status === 'active') {
    const role = userRoles[0];
    // Guest role: redirect if account_status is active
    if (role === 'guest') {
      redirect('/account/guest');
    }
    // Other roles: redirect only if account_status is active AND is_active is true
    if (userData?.is_active === true) {
      if (role === 'admin') {
        redirect('/account/admin');
      } else if (role === 'mentor') {
        redirect('/account/mentor');
      } else if (role === 'executive') {
        redirect('/account/executive');
      } else if (role === 'advisor') {
        redirect('/account/advisor');
      } else if (role === 'member') {
        redirect('/account/member');
      }
    }
  }

  // Get available dashboards for user's roles
  // Filter based on account_status and is_active
  const availableRoles = userRoles
    .map((role) => ({ role, config: roleDashboards[role] }))
    .filter(({ config }) => config) // Filter out any invalid roles
    .filter(({ role }) => {
      // Guest role: only show if account_status is active
      if (role === 'guest') {
        return userData?.account_status === 'active';
      }
      // All other roles: show only if account_status is active AND is_active is true
      return (
        userData?.account_status === 'active' && userData?.is_active === true
      );
    });

  return (
    <AccountPageClient>
      <div className="min-h-screen px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <AccountHeader session={session.user} />
          <UserAvatar session={session.user} />
          <AvailableRoles
            availableRoles={availableRoles}
            accountStatus={userData?.account_status}
          />
          <AccountStatusMessages
            accountStatus={userData?.account_status}
            statusReason={userData?.status_reason}
            statusChangedBy={userData?.status_changed_by}
            suspensionExpiresAt={userData?.suspension_expires_at}
            userId={userData?.id}
          />
          <UpgradeBanner
            accountStatus={userData?.account_status}
            userRoles={userRoles}
          />
        </div>
      </div>
    </AccountPageClient>
  );
}

export default page;
