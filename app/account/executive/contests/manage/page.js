import RoleSync from '../../../_components/RoleSync';
import ComingSoon from '../../../_components/ComingSoon';

export default function ContestManagementPage() {
  return (
    <>
      <RoleSync role="executive" />
      <ComingSoon
        title="Contest Management"
        description="Organize and manage programming contests."
        backHref="/account/executive"
        backLabel="Back to Dashboard"
      />
    </>
  );
}
