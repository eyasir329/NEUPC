import RoleSync from '../../_components/RoleSync';
import ComingSoon from '../../_components/ComingSoon';

export default function Page() {
  return (
    <>
      <RoleSync role="member" />
      <ComingSoon
        title="Events"
        description="Browse and register for upcoming events"
        backHref="/account/member"
        backLabel="Back to Dashboard"
      />
    </>
  );
}
