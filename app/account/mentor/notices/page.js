import RoleSync from '../../_components/RoleSync';
import ComingSoon from '../../_components/ComingSoon';

export default function Page() {
  return (
    <>
      <RoleSync role="mentor" />
      <ComingSoon
        title="Notices"
        description="View and create mentorship notices"
        backHref="/account/mentor"
        backLabel="Back to Dashboard"
      />
    </>
  );
}
