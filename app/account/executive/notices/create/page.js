import RoleSync from '../../../_components/RoleSync';
import ComingSoon from '../../../_components/ComingSoon';

export default function CreateNoticePage() {
  return (
    <>
      <RoleSync role="executive" />
      <ComingSoon
        title="Create Notices"
        description="Post important announcements and notices."
        backHref="/account/executive"
        backLabel="Back to Dashboard"
      />
    </>
  );
}
