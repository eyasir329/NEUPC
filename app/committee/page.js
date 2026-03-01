/**
 * @file Committee page
 * @module CommitteePage
 */

import { getPublicCommittee } from '@/app/_lib/public-actions';
import CommitteeClient from './CommitteeClient';
import { buildMetadata } from '@/app/_lib/seo';
import { BreadcrumbJsonLd } from '@/app/_components/ui/JsonLd';

export const metadata = buildMetadata({
  title: 'Committee',
  description:
    'Meet the NEUPC executive committee, faculty advisor, and mentors who lead the Netrokona University Programming Club.',
  pathname: '/committee',
  keywords: [
    'executive committee',
    'club leadership',
    'advisor',
    'mentors',
    'team',
    'management',
  ],
});

export default async function Page() {
  const { members, positions } = await getPublicCommittee();

  // Group members by position category
  const advisorPositionIds = positions
    .filter((p) => p.category === 'advisor')
    .map((p) => p.id);

  const executivePositionIds = positions
    .filter((p) => p.category === 'executive')
    .map((p) => p.id);

  const mentorPositionIds = positions
    .filter((p) => p.category === 'mentor')
    .map((p) => p.id);

  // Map members to the expected client shape
  const mapMember = (m) => ({
    id: m.id,
    name: m.users?.full_name || 'Unknown',
    role: m.committee_positions?.title || '',
    department: m.committee_positions?.category || '',
    batch: m.bio || '',
    image: m.users?.avatar_url || '/images/default-avatar.jpg',
    bio: m.bio || '',
    linkedin: '#',
    github: '#',
    email: m.users?.email || '',
    responsibility: m.committee_positions?.responsibilities || '',
  });

  // Find the faculty advisor (first advisor member)
  const advisorMembers = members.filter((m) =>
    advisorPositionIds.includes(m.position_id)
  );
  const facultyAdvisor =
    advisorMembers.length > 0
      ? {
          name: advisorMembers[0].users?.full_name || 'Faculty Advisor',
          designation:
            advisorMembers[0].committee_positions?.title || 'Advisor',
          university: 'Netrokona University',
          image: advisorMembers[0].users?.avatar_url || '/images/advisor.jpg',
          message: advisorMembers[0].bio || '',
          linkedin: '#',
        }
      : null;

  // Core executives (executive category, top 4 by display_order)
  const executiveMembers_ = members
    .filter((m) => executivePositionIds.includes(m.position_id))
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

  const coreExecutives = executiveMembers_.slice(0, 4).map(mapMember);

  // Department leads = mentors
  const departmentLeads = members
    .filter((m) => mentorPositionIds.includes(m.position_id))
    .map(mapMember);

  // Executive members = remaining executives after core 4
  const executiveMembers = executiveMembers_.slice(4).map(mapMember);

  return (
    <>
      <BreadcrumbJsonLd
        items={[{ name: 'Home', url: '/' }, { name: 'Committee' }]}
      />
      <CommitteeClient
        facultyAdvisor={facultyAdvisor}
        coreExecutives={coreExecutives}
        departmentLeads={departmentLeads}
        executiveMembers={executiveMembers}
      />
    </>
  );
}
