import RoleSync from '../../_components/RoleSync';
import ComingSoon from '../../_components/ComingSoon';

export default function ProblemSetPage() {
  return (
    <>
      <RoleSync role="member" />
      <ComingSoon
        title="Problem Set"
        description="Access programming problems and practice questions."
        backHref="/account/member"
        backLabel="Back to Dashboard"
      />
    </>
  );
}
