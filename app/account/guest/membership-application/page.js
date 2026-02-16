import RoleSync from '../../_components/RoleSync';
import ComingSoon from '../../_components/ComingSoon';

export default function Page() {
  return (
    <>
      <RoleSync role="guest" />
      <ComingSoon
        title="Apply for Membership"
        description="Submit your membership application"
        backHref="/account/guest"
        backLabel="Back to Dashboard"
      />
    </>
  );
}
