import RoleSync from '../../_components/RoleSync';
import ComingSoon from '../../_components/ComingSoon';

export default function GuestEventsPage() {
  return (
    <>
      <RoleSync role="guest" />
      <ComingSoon
        title="Browse Events"
        description="Explore upcoming programming club events."
        backHref="/account/guest"
        backLabel="Back to Dashboard"
      />
    </>
  );
}
