import RoleSync from '../../_components/RoleSync';
import ComingSoon from '../../_components/ComingSoon';

export default function Page() {
  return (
    <>
      <RoleSync role="guest" />
      <ComingSoon
        title="Settings"
        description="Configure your account settings"
        backHref="/account/guest"
        backLabel="Back to Dashboard"
      />
    </>
  );
}
