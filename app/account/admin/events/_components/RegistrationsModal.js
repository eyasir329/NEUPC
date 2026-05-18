'use client';

import RegistrationsModal from '@/app/account/_components/events/RegistrationsModal';

async function adminUpdateStatus(id, status, registrations, setRegistrations) {
  // Extract event id from first reg or fall back — caller passes event via closure
  // We use the PATCH API directly
  const reg = registrations.find((r) => r.id === id);
  if (!reg) throw new Error('Registration not found');

  // We need the event id — extract from the fetch URL pattern
  // Admin modal passes fetchUrl which includes event id; extract it
  // Simpler: store eventId in closure via the wrapper below
  throw new Error('Use AdminRegistrationsModal wrapper');
}

export default function AdminRegistrationsModal({ event, onClose }) {
  const fetchUrl = `/api/admin/events/${event.id}/registrations`;

  async function handleUpdateStatus(id, status, registrations, setRegistrations) {
    const res = await fetch(`/api/admin/events/${event.id}/registrations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'Failed to update.');
    setRegistrations((prev) =>
      prev.map((r) => r.id === id ? { ...r, status: data.status, attended: data.attended } : r)
    );
  }

  return (
    <RegistrationsModal
      event={event}
      onClose={onClose}
      fetchUrl={fetchUrl}
      onUpdateStatus={handleUpdateStatus}
      dataKey={null}
      userKey="users"
    />
  );
}
