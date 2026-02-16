import RoleSync from '../../../_components/RoleSync';
import ComingSoon from '../../../_components/ComingSoon';

export default function GalleryManagementPage() {
  return (
    <>
      <RoleSync role="executive" />
      <ComingSoon
        title="Gallery Management"
        description="Upload and organize event photos."
        backHref="/account/executive"
        backLabel="Back to Dashboard"
      />
    </>
  );
}
