import RoleSync from '../../_components/RoleSync';
import ComingSoon from '../../_components/ComingSoon';

export default function Page() {
  return (
    <>
      <RoleSync role="guest" />
      <ComingSoon
        title="My Participations"
        description="View your event participation history"
        backHref="/account/guest"
        backLabel="Back to Dashboard"
      />
    </>
  );
}
