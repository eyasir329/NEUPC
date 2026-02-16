import RoleSync from '../../_components/RoleSync';
import ComingSoon from '../../_components/ComingSoon';

export default function Page() {
  return (
    <>
      <RoleSync role="guest" />
      <ComingSoon
        title="Notifications"
        description="Stay updated with club notifications"
        backHref="/account/guest"
        backLabel="Back to Dashboard"
      />
    </>
  );
}
