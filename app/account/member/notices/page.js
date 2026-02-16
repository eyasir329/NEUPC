import RoleSync from '../../_components/RoleSync';
import ComingSoon from '../../_components/ComingSoon';

export default function Page() {
  return (
    <>
      <RoleSync role="member" />
      <ComingSoon
        title="Notices"
        description="View important club notices"
        backHref="/account/member"
        backLabel="Back to Dashboard"
      />
    </>
  );
}
