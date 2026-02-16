import RoleSync from '../../_components/RoleSync';
import ComingSoon from '../../_components/ComingSoon';

export default function Page() {
  return (
    <>
      <RoleSync role="mentor" />
      <ComingSoon
        title="Resources"
        description="Share resources with your mentees"
        backHref="/account/mentor"
        backLabel="Back to Dashboard"
      />
    </>
  );
}
