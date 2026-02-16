import RoleSync from '../../_components/RoleSync';
import ComingSoon from '../../_components/ComingSoon';

export default function Page() {
  return (
    <>
      <RoleSync role="advisor" />
      <ComingSoon
        title="Event Overview"
        description="Monitor and review club events"
        backHref="/account/advisor"
        backLabel="Back to Dashboard"
      />
    </>
  );
}
