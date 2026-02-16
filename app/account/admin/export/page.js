import RoleSync from '../../_components/RoleSync';
import ComingSoon from '../../_components/ComingSoon';

export default function Page() {
  return (
    <>
      <RoleSync role="admin" />
      <ComingSoon
        title="Export Data"
        description="Export club data and reports"
        backHref="/account/admin"
        backLabel="Back to Dashboard"
      />
    </>
  );
}
