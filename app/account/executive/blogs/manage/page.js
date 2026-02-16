import RoleSync from '../../../_components/RoleSync';
import ComingSoon from '../../../_components/ComingSoon';

export default function BlogManagementPage() {
  return (
    <>
      <RoleSync role="executive" />
      <ComingSoon
        title="Blog Management"
        description="Create and manage blog posts."
        backHref="/account/executive"
        backLabel="Back to Dashboard"
      />
    </>
  );
}
