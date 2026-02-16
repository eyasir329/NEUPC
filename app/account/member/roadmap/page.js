import RoleSync from '../../_components/RoleSync';
import ComingSoon from '../../_components/ComingSoon';

export default function Page() {
  return (
    <>
      <RoleSync role="member" />
      <ComingSoon
        title="Roadmap"
        description="Track your learning path and progress"
        backHref="/account/member"
        backLabel="Back to Dashboard"
      />
    </>
  );
}
