import RoleSync from '../../_components/RoleSync';
import ComingSoon from '../../_components/ComingSoon';

export default function Page() {
  return (
    <>
      <RoleSync role="admin" />
      <ComingSoon
        title="Gallery Management"
        description="Manage photo galleries"
        backHref="/account/admin"
        backLabel="Back to Dashboard"
      />
    </>
  );
}
