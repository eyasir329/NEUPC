import RoleSync from '../../_components/RoleSync';
import ComingSoon from '../../_components/ComingSoon';

export default function Page() {
  return (
    <>
      <RoleSync role="admin" />
      <ComingSoon
        title="Role Management"
        description="Assign and manage user roles"
        backHref="/account/admin"
        backLabel="Back to Dashboard"
      />
    </>
  );
}
