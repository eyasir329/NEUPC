import RoleSync from '../../_components/RoleSync';
import ComingSoon from '../../_components/ComingSoon';

export default function Page() {
  return (
    <>
      <RoleSync role="member" />
      <ComingSoon
        title="Gallery"
        description="Browse event photos and memories"
        backHref="/account/member"
        backLabel="Back to Dashboard"
      />
    </>
  );
}
