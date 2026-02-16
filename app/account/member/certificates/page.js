import RoleSync from '../../_components/RoleSync';
import ComingSoon from '../../_components/ComingSoon';

export default function Page() {
  return (
    <>
      <RoleSync role="member" />
      <ComingSoon
        title="Certificates"
        description="Download your earned certificates"
        backHref="/account/member"
        backLabel="Back to Dashboard"
      />
    </>
  );
}
