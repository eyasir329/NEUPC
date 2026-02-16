import RoleSync from '../../_components/RoleSync';
import ComingSoon from '../../_components/ComingSoon';

export default function Page() {
  return (
    <>
      <RoleSync role="advisor" />
      <ComingSoon
        title="Club Overview"
        description="View comprehensive club statistics"
        backHref="/account/advisor"
        backLabel="Back to Dashboard"
      />
    </>
  );
}
