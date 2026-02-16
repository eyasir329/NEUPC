import RoleSync from '../../_components/RoleSync';
import ComingSoon from '../../_components/ComingSoon';

export default function Page() {
  return (
    <>
      <RoleSync role="member" />
      <ComingSoon
        title="Settings"
        description="Configure your account settings"
        backHref="/account/member"
        backLabel="Back to Dashboard"
      />
    </>
  );
}
