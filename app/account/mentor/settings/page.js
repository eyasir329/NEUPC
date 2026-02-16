import RoleSync from '../../_components/RoleSync';
import ComingSoon from '../../_components/ComingSoon';

export default function Page() {
  return (
    <>
      <RoleSync role="mentor" />
      <ComingSoon
        title="Settings"
        description="Configure your mentorship settings"
        backHref="/account/mentor"
        backLabel="Back to Dashboard"
      />
    </>
  );
}
