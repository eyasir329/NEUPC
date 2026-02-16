import RoleSync from '../../../_components/RoleSync';
import ComingSoon from '../../../_components/ComingSoon';

export default function GenerateCertificatesPage() {
  return (
    <>
      <RoleSync role="executive" />
      <ComingSoon
        title="Generate Certificates"
        description="Create and issue certificates for participants."
        backHref="/account/executive"
        backLabel="Back to Dashboard"
      />
    </>
  );
}
