import { requireRole } from '@/app/_lib/auth-guard';
import { getEventsWithStats } from '@/app/_lib/data-service';
import ManageEventsClient from './_components/ManageEventsClient';

export const metadata = { title: 'Event Management | Executive | NEUPC' };

export default async function ExecutiveEventsPage() {
  const [{ user }, eventsData] = await Promise.all([
    requireRole(['executive', 'admin']),
    getEventsWithStats().catch(() => ({ events: [], stats: {} })),
  ]);

  const events = eventsData?.events || [];

  return <ManageEventsClient initialEvents={events} userId={user.id} />;
}
