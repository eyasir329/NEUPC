import RoleSync from '../../_components/RoleSync';
import ComingSoon from '../../_components/ComingSoon';

export default function ReportsPage() {
  return (
    <>
      <RoleSync role="executive" />
      <ComingSoon
        title="Reports"
        description="Generate and view club activity reports."
        backHref="/account/executive"
        backLabel="Back to Dashboard"
      />
    </>
  );
}
