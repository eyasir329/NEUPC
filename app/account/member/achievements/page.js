import RoleSync from '../../_components/RoleSync';
import ComingSoon from '../../_components/ComingSoon';

export default function Page() {
  return (
    <>
      <RoleSync role="member" />
      <ComingSoon
        title="Achievements"
        description="View your earned achievements and badges"
        backHref="/account/member"
        backLabel="Back to Dashboard"
      />
    </>
  );
}
