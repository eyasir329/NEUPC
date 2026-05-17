export function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function fmtTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function isPast(iso) {
  return iso ? new Date(iso) < new Date() : false;
}

/**
 * Computes { _bucket: 'upcoming' | 'ongoing' | 'completed' } for an event.
 * Uses end_date when available, falls back to start_date.
 */
export function bucketEvent(event) {
  const now = new Date();
  const start = new Date(event.start_date);
  const end = event.end_date ? new Date(event.end_date) : start;
  if (start <= now && end >= now) return 'ongoing';
  if (end < now) return 'completed';
  return 'upcoming';
}

/**
 * Enriches a raw DB event with display fields used by all role views.
 */
export function enrichEvent(event) {
  return {
    ...event,
    _date: fmtDate(event.start_date),
    _time: fmtTime(event.start_date),
    _bucket: bucketEvent(event),
    _isUpcoming: !isPast(event.start_date),
    _type: event.category || event.kind || 'Event',
    _location: event.location || event.venue || 'Virtual',
  };
}
