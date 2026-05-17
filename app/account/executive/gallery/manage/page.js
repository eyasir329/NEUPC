import { requireRole } from '@/app/_lib/auth-guard';
import ManageGalleryClient from './_components/ManageGalleryClient';

export const metadata = { title: 'Gallery Management | Executive | NEUPC' };

const TEMP_EVENTS = [
  { id: 'e1', title: 'IUPC 2026' },
  { id: 'e2', title: 'Web Dev Workshop — React & Next.js' },
  { id: 'e3', title: 'Hackathon 24H — Build & Innovate' },
  { id: 'e4', title: 'Freshman Orientation 2026' },
  { id: 'e5', title: 'Algorithm Masterclass' },
];

const TEMP_ITEMS = [
  {
    id: 'g1',
    url: 'https://placehold.co/800x600/1a1a2e/white?text=IUPC+2026+Opening',
    type: 'image',
    caption: 'Opening ceremony of IUPC 2026',
    category: 'contest',
    tags: ['iupc', 'contest', '2026'],
    event_id: 'e1',
    is_featured: true,
    display_order: 1,
    created_at: '2026-03-15T18:00:00',
    event: { id: 'e1', title: 'IUPC 2026' },
  },
  {
    id: 'g2',
    url: 'https://placehold.co/800x600/0f3460/white?text=IUPC+Team+Photo',
    type: 'image',
    caption: 'NEUPC team group photo at IUPC 2026',
    category: 'contest',
    tags: ['iupc', 'team', 'group'],
    event_id: 'e1',
    is_featured: false,
    display_order: 2,
    created_at: '2026-03-15T20:00:00',
    event: { id: 'e1', title: 'IUPC 2026' },
  },
  {
    id: 'g3',
    url: 'https://placehold.co/800x600/16213e/white?text=React+Workshop',
    type: 'image',
    caption: 'Participants during the React hands-on session',
    category: 'workshop',
    tags: ['workshop', 'react', 'webdev'],
    event_id: 'e2',
    is_featured: true,
    display_order: 1,
    created_at: '2026-03-22T15:00:00',
    event: { id: 'e2', title: 'Web Dev Workshop — React & Next.js' },
  },
  {
    id: 'g4',
    url: 'https://placehold.co/800x600/1b1b2f/white?text=Hackathon+Teams',
    type: 'image',
    caption: 'Teams brainstorming during the 24H Hackathon',
    category: 'hackathon',
    tags: ['hackathon', 'teams', '2026'],
    event_id: 'e3',
    is_featured: false,
    display_order: 1,
    created_at: '2026-02-28T12:00:00',
    event: { id: 'e3', title: 'Hackathon 24H — Build & Innovate' },
  },
  {
    id: 'g5',
    url: 'https://placehold.co/800x600/162447/white?text=Hackathon+Finale',
    type: 'image',
    caption: 'Prize giving ceremony of the Hackathon',
    category: 'hackathon',
    tags: ['hackathon', 'awards', 'prize'],
    event_id: 'e3',
    is_featured: true,
    display_order: 2,
    created_at: '2026-03-01T09:00:00',
    event: { id: 'e3', title: 'Hackathon 24H — Build & Innovate' },
  },
  {
    id: 'g6',
    url: 'https://placehold.co/800x600/1f4068/white?text=Orientation+Day',
    type: 'image',
    caption: 'NEUPC Welcome Day for freshmen',
    category: 'orientation',
    tags: ['orientation', 'freshman', 'welcome'],
    event_id: 'e4',
    is_featured: false,
    display_order: 1,
    created_at: '2026-01-15T13:00:00',
    event: { id: 'e4', title: 'Freshman Orientation 2026' },
  },
  {
    id: 'g7',
    url: 'https://placehold.co/800x600/1b262c/white?text=Club+Banner',
    type: 'image',
    caption: 'NEUPC official club banner 2026',
    category: 'general',
    tags: ['banner', 'neupc', 'official'],
    event_id: null,
    is_featured: false,
    display_order: 1,
    created_at: '2026-01-01T10:00:00',
    event: null,
  },
];

export default async function ManageGalleryPage() {
  const { user } = await requireRole(['executive', 'admin']);
  return (
    <ManageGalleryClient
      initialItems={TEMP_ITEMS}
      events={TEMP_EVENTS}
      userId={user.id}
    />
  );
}
