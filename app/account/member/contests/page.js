import RoleSync from '../../_components/RoleSync';
import ComingSoon from '../../_components/ComingSoon';

export default function ContestsPage() {
  return (
    <>
      <RoleSync role="member" />
      <ComingSoon
        title="Contests"
        description="Participate in programming contests and challenges."
        backHref="/account/member"
        backLabel="Back to Dashboard"
      />
    </>
  );
}
