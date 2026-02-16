import RoleSync from '../../_components/RoleSync';
import ComingSoon from '../../_components/ComingSoon';

export default function Page() {
  return (
    <>
      <RoleSync role="admin" />
      <ComingSoon
        title="Notice Management"
        description="Post and manage notices"
        backHref="/account/admin"
        backLabel="Back to Dashboard"
      />
    </>
  );
}
