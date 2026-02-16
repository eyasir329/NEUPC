import RoleSync from '../../_components/RoleSync';
import ComingSoon from '../../_components/ComingSoon';

export default function Page() {
  return (
    <>
      <RoleSync role="admin" />
      <ComingSoon
        title="Security Settings"
        description="Manage security and access control"
        backHref="/account/admin"
        backLabel="Back to Dashboard"
      />
    </>
  );
}
