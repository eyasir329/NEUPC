import ComingSoon from '@/app/account/_components/ComingSoon';
import RoleSync from '@/app/account/_components/RoleSync';

export default function EventManagementPage() {
  return (
    <>
      <RoleSync role="executive" />
      <ComingSoon
        title="Event Management"
        description="Create, edit, and manage club events."
        backHref="/account/executive"
        backLabel="Back to Dashboard"
      />
    </>
  );
}
