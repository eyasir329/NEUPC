import RoleSync from '../../_components/RoleSync';
import ComingSoon from '../../_components/ComingSoon';

export default function Page() {
  return (
    <>
      <RoleSync role="advisor" />
      <ComingSoon
        title="Analytics"
        description="Deep insights into club performance"
        backHref="/account/advisor"
        backLabel="Back to Dashboard"
      />
    </>
  );
}
