import { requireRole } from '@/app/_lib/auth-guard';
import { getEventsWithStats } from '@/app/_lib/data-service';
import MentorEventsClient from './_components/MentorEventsClient';

export const metadata = { title: 'Events | Mentor | NEUPC' };

export default async function MentorEventsPage() {
  const [, eventsData] = await Promise.all([
    requireRole('mentor'),
    getEventsWithStats().catch(() => ({ events: [], stats: {} })),
  ]);

  const events = eventsData?.events || [];

  return <MentorEventsClient events={events} />;
}
