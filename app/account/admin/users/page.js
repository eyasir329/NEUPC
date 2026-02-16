import RoleSync from '../../_components/RoleSync';
import ComingSoon from '../../_components/ComingSoon';

export default function Page() {
  return (
    <>
      <RoleSync role="admin" />
      <ComingSoon
        title="User Management"
        description="Manage user accounts and permissions"
        backHref="/account/admin"
        backLabel="Back to Dashboard"
      />
    </>
  );
}
