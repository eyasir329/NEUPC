import RoleSync from '../../_components/RoleSync';
import ComingSoon from '../../_components/ComingSoon';

export default function Page() {
  return (
    <>
      <RoleSync role="member" />
      <ComingSoon
        title="Participation"
        description="Track your event participation"
        backHref="/account/member"
        backLabel="Back to Dashboard"
      />
    </>
  );
}
