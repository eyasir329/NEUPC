import RoleSync from '../../_components/RoleSync';
import ComingSoon from '../../_components/ComingSoon';

export default function Page() {
  return (
    <>
      <RoleSync role="advisor" />
      <ComingSoon
        title="Approvals"
        description="Review and approve important decisions"
        backHref="/account/advisor"
        backLabel="Back to Dashboard"
      />
    </>
  );
}
