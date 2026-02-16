import RoleSync from '../../_components/RoleSync';
import ComingSoon from '../../_components/ComingSoon';

export default function Page() {
  return (
    <>
      <RoleSync role="member" />
      <ComingSoon
        title="Discussions"
        description="Participate in community discussions"
        backHref="/account/member"
        backLabel="Back to Dashboard"
      />
    </>
  );
}
