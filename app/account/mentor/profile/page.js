import RoleSync from '../../_components/RoleSync';
import ComingSoon from '../../_components/ComingSoon';

export default function Page() {
  return (
    <>
      <RoleSync role="mentor" />
      <ComingSoon
        title="Profile"
        description="Manage your mentor profile"
        backHref="/account/mentor"
        backLabel="Back to Dashboard"
      />
    </>
  );
}
