import RoleSync from '../../_components/RoleSync';
import ComingSoon from '../../_components/ComingSoon';

export default function Page() {
  return (
    <>
      <RoleSync role="admin" />
      <ComingSoon
        title="Achievement Management"
        description="Create and assign achievements"
        backHref="/account/admin"
        backLabel="Back to Dashboard"
      />
    </>
  );
}
