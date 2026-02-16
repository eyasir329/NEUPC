import RoleSync from '../../_components/RoleSync';
import ComingSoon from '../../_components/ComingSoon';

export default function Page() {
  return (
    <>
      <RoleSync role="member" />
      <ComingSoon
        title="Resources"
        description="Access learning resources and materials"
        backHref="/account/member"
        backLabel="Back to Dashboard"
      />
    </>
  );
}
