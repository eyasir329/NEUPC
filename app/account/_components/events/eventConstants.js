import {
  Calendar,
  CalendarCheck,
  CalendarX,
  CheckCircle,
  Ticket,
  Users,
  TrendingUp,
} from 'lucide-react';

export const CATEGORIES = [
  'Workshop', 'Contest', 'Seminar', 'Bootcamp', 'Hackathon', 'Meetup', 'Other',
];

export const VENUE_TYPES = ['offline', 'online', 'hybrid'];

// Status config for DB-status-based roles (executive, admin)
export const EVENT_STATUS_CONFIG = {
  draft:     { label: 'Draft',     color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',   dot: 'bg-gray-400',   badge: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
  upcoming:  { label: 'Upcoming',  color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',   dot: 'bg-blue-400',   badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  ongoing:   { label: 'Ongoing',   color: 'bg-green-500/20 text-green-400 border-green-500/30', dot: 'bg-green-400',  badge: 'bg-green-500/20 text-green-400 border-green-500/30' },
  completed: { label: 'Completed', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', dot: 'bg-purple-400', badge: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  cancelled: { label: 'Cancelled', color: 'bg-red-500/20 text-red-400 border-red-500/30',      dot: 'bg-red-400',    badge: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

export const REG_STATUS_CONFIG = {
  registered: { label: 'Registered', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  confirmed:  { label: 'Confirmed',  color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  attended:   { label: 'Attended',   color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  cancelled:  { label: 'Cancelled',  color: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

// Stats sidebar configs per role-type
export const STATS_CONFIG = {
  // guest: upcoming / open / past
  guest: [
    { id: 'upcoming', title: 'Upcoming',   icon: Calendar,      color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { id: 'open',     title: 'Open Slots', icon: CalendarCheck, color: 'text-violet-400',  bg: 'bg-violet-500/10' },
    { id: 'past',     title: 'Past Events',icon: CalendarX,     color: 'text-amber-400',   bg: 'bg-amber-500/10' },
  ],
  // member: upcoming / registered / open / attended
  member: [
    { id: 'upcoming',   title: 'Upcoming',   icon: Calendar,      color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { id: 'registered', title: 'Registered', icon: CheckCircle,   color: 'text-blue-400',    bg: 'bg-blue-500/10' },
    { id: 'open',       title: 'Open Slots', icon: Ticket,        color: 'text-violet-400',  bg: 'bg-violet-500/10' },
    { id: 'attended',   title: 'Attended',   icon: CalendarCheck, color: 'text-amber-400',   bg: 'bg-amber-500/10' },
  ],
  // executive / admin: total / upcoming / ongoing / registrations
  manage: [
    { id: 'total',         title: 'Total Events',   icon: Calendar,      color: 'text-blue-400',    bg: 'bg-blue-500/10' },
    { id: 'upcoming',      title: 'Upcoming',       icon: CalendarCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { id: 'ongoing',       title: 'Ongoing',        icon: TrendingUp,    color: 'text-cyan-400',    bg: 'bg-cyan-500/10' },
    { id: 'registrations', title: 'Registrations',  icon: Users,         color: 'text-amber-400',   bg: 'bg-amber-500/10' },
  ],
  // mentor / advisor: upcoming / ongoing / completed / registrations
  observer: [
    { id: 'upcoming',      title: 'Upcoming',      icon: Calendar,      color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { id: 'ongoing',       title: 'Ongoing',        icon: TrendingUp,    color: 'text-blue-400',    bg: 'bg-blue-500/10' },
    { id: 'completed',     title: 'Completed',      icon: CalendarCheck, color: 'text-violet-400',  bg: 'bg-violet-500/10' },
    { id: 'registrations', title: 'Registrations',  icon: Users,         color: 'text-amber-400',   bg: 'bg-amber-500/10' },
  ],
};

/**
 * Computes stat counts from an enriched event array.
 * @param {'guest'|'member'|'observer'} variant
 * @param {Array} events  — enriched with _bucket, _isUpcoming, category
 */
export function computeStats(variant, events) {
  return STATS_CONFIG[variant].map((s) => {
    let count = 0;
    switch (s.id) {
      case 'total':         count = events.length; break;
      case 'upcoming':      count = events.filter((e) => e._bucket === 'upcoming' || e.status === 'upcoming').length; break;
      case 'ongoing':       count = events.filter((e) => e._bucket === 'ongoing').length; break;
      case 'completed':     count = events.filter((e) => e._bucket === 'completed').length; break;
      case 'open':          count = events.filter((e) => e._isUpcoming).length; break;
      case 'registered':    count = events.filter((e) => e._userStatus === 'Registered').length; break;
      case 'attended':      count = events.filter((e) => e._bucket === 'completed').length; break;
      case 'past':          count = events.filter((e) => e._bucket === 'completed').length; break;
      case 'registrations': count = events.reduce((sum, e) => sum + (e.registrationCount || 0), 0); break;
      default: break;
    }
    return { ...s, count };
  });
}
