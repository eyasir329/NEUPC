import RoleSync from '../../_components/RoleSync';
import ComingSoon from '../../_components/ComingSoon';

export default function Page() {
  return (
    <>
      <RoleSync role="advisor" />
      <ComingSoon
        title="Advisor Profile"
        description="Manage your advisor profile"
        backHref="/account/advisor"
        backLabel="Back to Dashboard"
      />
    </>
  );
}
