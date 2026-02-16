import RoleSync from '../../_components/RoleSync';
import ComingSoon from '../../_components/ComingSoon';

export default function Page() {
  return (
    <>
      <RoleSync role="advisor" />
      <ComingSoon
        title="Reports"
        description="Access detailed club reports"
        backHref="/account/advisor"
        backLabel="Back to Dashboard"
      />
    </>
  );
}
