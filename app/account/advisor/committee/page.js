import RoleSync from '../../_components/RoleSync';
import ComingSoon from '../../_components/ComingSoon';

export default function Page() {
  return (
    <>
      <RoleSync role="advisor" />
      <ComingSoon
        title="Committee Management"
        description="Manage committee members and roles"
        backHref="/account/advisor"
        backLabel="Back to Dashboard"
      />
    </>
  );
}
