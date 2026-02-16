import RoleSync from '../../_components/RoleSync';
import ComingSoon from '../../_components/ComingSoon';

export default function RegistrationsPage() {
  return (
    <>
      <RoleSync role="executive" />
      <ComingSoon
        title="Event Registrations"
        description="View and manage event registrations."
        backHref="/account/executive"
        backLabel="Back to Dashboard"
      />
    </>
  );
}
