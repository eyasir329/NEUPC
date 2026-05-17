import { requireRole } from '@/app/_lib/auth-guard';
import NoticesClient from './_components/NoticesClient';

export const metadata = { title: 'Notices | Executive | NEUPC' };

const TEMP_NOTICES = [
  {
    id: '1',
    title: 'Registration Open for Spring Programming Contest 2026',
    content: 'We are excited to announce that registrations for the Spring Programming Contest 2026 are now open. All NEUPC members are encouraged to participate. Deadline: March 10, 2026.',
    notice_type: 'announcement',
    priority: 'high',
    target_audience: 'all',
    is_pinned: true,
    expires_at: '2026-03-10T23:59:00',
    views: 342,
    created_at: '2026-02-14T09:00:00',
    updated_at: '2026-02-14T09:00:00',
  },
  {
    id: '2',
    title: 'Workshop Schedule Updated — Web Dev Series',
    content: 'The schedule for the Web Development Workshop series has been updated. Please check the events page for the latest timings and venue details.',
    notice_type: 'update',
    priority: 'medium',
    target_audience: 'members',
    is_pinned: false,
    expires_at: '2026-03-25T23:59:00',
    views: 189,
    created_at: '2026-02-12T11:00:00',
    updated_at: '2026-02-13T08:00:00',
  },
  {
    id: '3',
    title: 'New Membership Guidelines for Session 2026',
    content: 'Please review the updated membership guidelines before submitting your application. The new guidelines include updated academic requirements and activity commitments.',
    notice_type: 'info',
    priority: 'medium',
    target_audience: 'all',
    is_pinned: false,
    expires_at: null,
    views: 410,
    created_at: '2026-02-10T10:00:00',
    updated_at: '2026-02-10T10:00:00',
  },
  {
    id: '4',
    title: 'Urgent: Lab Booking Conflict — March 15',
    content: 'Due to a scheduling conflict, the lab session planned for March 15 has been moved to Room 401. Please inform your team members.',
    notice_type: 'alert',
    priority: 'urgent',
    target_audience: 'executive',
    is_pinned: true,
    expires_at: '2026-03-15T18:00:00',
    views: 28,
    created_at: '2026-02-18T16:00:00',
    updated_at: '2026-02-18T16:00:00',
  },
  {
    id: '5',
    title: 'Congratulations to NEUPC IUPC Team 2026!',
    content: 'Heartfelt congratulations to our team for securing 3rd place in the Regional IUPC 2026. We are proud of your achievement!',
    notice_type: 'announcement',
    priority: 'low',
    target_audience: 'all',
    is_pinned: false,
    expires_at: null,
    views: 621,
    created_at: '2026-02-01T12:00:00',
    updated_at: '2026-02-01T12:00:00',
  },
];

export default async function CreateNoticePage() {
  const { user } = await requireRole(['executive', 'admin']);
  return <NoticesClient initialNotices={TEMP_NOTICES} userId={user.id} />;
}
