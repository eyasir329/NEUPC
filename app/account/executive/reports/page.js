import { requireRole } from '@/app/_lib/auth-guard';
import ReportsClient from './_components/ReportsClient';

export const metadata = { title: 'Reports | Executive | NEUPC' };

const TEMP_STATS = {
  totalUsers: 156,
  activeUsers: 138,
  totalEvents: 24,
  publishedEvents: 20,
  completedEvents: 14,
  totalContests: 18,
  totalRegistrations: 342,
  attendedRegistrations: 267,
  totalBlogs: 32,
  publishedBlogs: 26,
  totalGallery: 48,
};

const TEMP_RECENT_EVENTS = [
  { id: 'e1', status: 'upcoming',  category: 'contest',     created_at: '2026-02-01T10:00:00' },
  { id: 'e2', status: 'upcoming',  category: 'workshop',    created_at: '2026-01-20T11:00:00' },
  { id: 'e3', status: 'ongoing',   category: 'hackathon',   created_at: '2026-01-25T12:00:00' },
  { id: 'e4', status: 'completed', category: 'orientation', created_at: '2025-12-20T08:00:00' },
  { id: 'e5', status: 'completed', category: 'workshop',    created_at: '2025-12-10T09:00:00' },
  { id: 'e6', status: 'completed', category: 'contest',     created_at: '2025-11-15T10:00:00' },
  { id: 'e7', status: 'completed', category: 'seminar',     created_at: '2025-11-01T11:00:00' },
  { id: 'e8', status: 'draft',     category: 'workshop',    created_at: '2026-02-15T14:00:00' },
];

export default async function ReportsPage() {
  await requireRole(['executive', 'admin']);
  return <ReportsClient stats={TEMP_STATS} recentEvents={TEMP_RECENT_EVENTS} />;
}
