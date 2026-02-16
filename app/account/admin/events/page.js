import RoleSync from '../../_components/RoleSync';
import ComingSoon from '../../_components/ComingSoon';

export default function Page() {
  return (
    <>
      <RoleSync role="admin" />
      <ComingSoon
        title="Event Management"
        description="Manage all club events"
        backHref="/account/admin"
        backLabel="Back to Dashboard"
      />
    </>
  );
}
