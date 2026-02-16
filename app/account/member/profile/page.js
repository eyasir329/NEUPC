import RoleSync from '../../_components/RoleSync';
import ComingSoon from '../../_components/ComingSoon';

export default function Page() {
  return (
    <>
      <RoleSync role="member" />
      <ComingSoon
        title="Profile"
        description="Manage your profile information"
        backHref="/account/member"
        backLabel="Back to Dashboard"
      />
    </>
  );
}
