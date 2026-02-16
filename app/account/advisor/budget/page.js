import RoleSync from '../../_components/RoleSync';
import ComingSoon from '../../_components/ComingSoon';

export default function Page() {
  return (
    <>
      <RoleSync role="advisor" />
      <ComingSoon
        title="Budget Management"
        description="Manage club finances and budget"
        backHref="/account/advisor"
        backLabel="Back to Dashboard"
      />
    </>
  );
}
