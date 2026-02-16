import RoleSync from '../../_components/RoleSync';
import ComingSoon from '../../_components/ComingSoon';

export default function MembersPage() {
  return (
    <>
      <RoleSync role="executive" />
      <ComingSoon
        title="Member Approval"
        description="Review and approve membership applications."
        backHref="/account/executive"
        backLabel="Back to Dashboard"
      />
    </>
  );
}
