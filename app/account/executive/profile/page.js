import RoleSync from '../../_components/RoleSync';
import ComingSoon from '../../_components/ComingSoon';

export default function ProfilePage() {
  return (
    <>
      <RoleSync role="executive" />
      <ComingSoon
        title="Executive Profile"
        description="Manage your executive profile information."
        backHref="/account/executive"
        backLabel="Back to Dashboard"
      />
    </>
  );
}
