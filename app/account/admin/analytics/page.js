import RoleSync from '../../_components/RoleSync';
import ComingSoon from '../../_components/ComingSoon';

export default function Page() {
  return (
    <>
      <RoleSync role="admin" />
      <ComingSoon
        title="Analytics Dashboard"
        description="View club statistics and analytics"
        backHref="/account/admin"
        backLabel="Back to Dashboard"
      />
    </>
  );
}
