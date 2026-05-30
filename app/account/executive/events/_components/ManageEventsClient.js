/**
 * @file Manage events client component
 * @module ManageEventsClient
 */

'use client';

import { useState, useTransition, useMemo } from 'react';
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  Zap,
  Plus,
  FileEdit,
  XCircle,
} from 'lucide-react';
import {
  execCreateEventAction,
  execUpdateEventAction,
  execDeleteEventAction,
  execUpdateRegistrationAction,
  uploadExecEventImageAction,
  deleteExecEventImageAction,
} from '@/app/_lib/actions/executive-actions';
import EventListLayout from '@/app/account/_components/events/EventListLayout';
import ManageEventDetail from '@/app/account/_components/events/ManageEventDetail';
import { enrichEvent } from '@/app/account/_components/events/eventUtils';
import { computeStats } from '@/app/account/_components/events/eventConstants';
import SharedRegistrationsModal from '@/app/account/_components/events/RegistrationsModal';
import CreateEventForm from '@/app/account/_components/events/CreateEventForm';

// ─── Registrations modal ───────────────────────────────────────────────────────

function RegistrationsModal({ event, onClose }) {
  async function handleUpdateStatus(
    id,
    status,
    registrations,
    setRegistrations
  ) {
    const fd = new FormData();
    fd.set('id', id);
    fd.set('status', status);
    const res = await execUpdateRegistrationAction(fd);
    if (res?.error) throw new Error(res.error);
    setRegistrations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r))
    );
  }

  return (
    <SharedRegistrationsModal
      event={event}
      onClose={onClose}
      fetchUrl={`/api/account/events/${event.id}/registrations`}
      onUpdateStatus={handleUpdateStatus}
      dataKey="registrations"
      userKey="user"
    />
  );
}

// ─── Status tabs ───────────────────────────────────────────────────────────────

const STATUS_TABS = [
  { value: 'all', label: 'All', icon: CalendarDays },
  { value: 'upcoming', label: 'Upcoming', icon: Clock },
  { value: 'ongoing', label: 'Ongoing', icon: Zap },
  { value: 'completed', label: 'Completed', icon: CheckCircle2 },
  { value: 'draft', label: 'Draft', icon: FileEdit },
  { value: 'cancelled', label: 'Cancelled', icon: XCircle },
];

function filterFn(event, tab) {
  if (tab === 'all') return true;
  return event.status === tab;
}

// ─── Main ──────────────────────────────────────────────────────────────────────

export default function ManageEventsClient({ initialEvents }) {
  const [events, setEvents] = useState(initialEvents);
  const [createModal, setCreateModal] = useState(false);
  const [viewRegEvent, setViewRegEvent] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const enriched = useMemo(() => events.map(enrichEvent), [events]);
  const sidebarStats = useMemo(
    () => computeStats('manage', enriched),
    [enriched]
  );
  const allCategories = useMemo(
    () => [...new Set(enriched.map((e) => e.category).filter(Boolean))],
    [enriched]
  );

  const tabs = STATUS_TABS.map((t) => ({
    ...t,
    count:
      t.value === 'all'
        ? events.length
        : events.filter((e) => e.status === t.value).length,
  }));

  return (
    <>
      <EventListLayout
        pageHeader={{
          icon: CalendarDays,
          title: 'Event Management',
          subtitle: 'Create, edit, and manage events',
          accent: 'blue',
        }}
        tabs={tabs}
        events={enriched}
        filterFn={filterFn}
        stats={sidebarStats}
        sidebarCta={null}
        rowProps={{ showStatus: true, showRegs: true }}
        renderDetail={(event, onBack) => (
          <ManageEventDetail
            event={event}
            onBack={onBack}
            allCategories={allCategories}
            saveAction={execUpdateEventAction}
            uploadImageAction={uploadExecEventImageAction}
            deleteImageAction={deleteExecEventImageAction}
            deleteAction={(fd) =>
              execDeleteEventAction(fd).then((res) => {
                if (!res?.error)
                  setEvents((prev) =>
                    prev.filter((e) => e.id !== fd.get('id'))
                  );
                return res;
              })
            }
            onSaved={() => {
              showToast('Event saved!');
              window.location.reload();
            }}
            onDeleted={() => {
              showToast('Event deleted.');
              window.location.reload();
            }}
            onViewRegs={() => setViewRegEvent(event)}
          />
        )}
        listHeader={
          <div className="flex justify-end">
            <button
              onClick={() => setCreateModal(true)}
              className="flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2.5 text-sm font-medium text-blue-300 transition-colors hover:bg-blue-500/20"
            >
              <Plus className="h-4 w-4" /> Create Event
            </button>
          </div>
        }
      />

      {createModal && (
        <CreateEventForm
          onClose={() => setCreateModal(false)}
          onSuccess={() => {
            setCreateModal(false);
            showToast('Event created!');
            window.location.reload();
          }}
          createAction={execCreateEventAction}
          uploadImageAction={uploadExecEventImageAction}
          allCategories={allCategories}
        />
      )}

      {viewRegEvent && (
        <RegistrationsModal
          event={viewRegEvent}
          onClose={() => setViewRegEvent(null)}
        />
      )}

      {toast && (
        <div
          className={`fixed right-6 bottom-6 z-50 rounded-xl border px-4 py-3 text-sm font-medium shadow-xl ${toast.type === 'error' ? 'border-red-500/30 bg-red-500/20 text-red-300' : 'border-green-500/30 bg-green-500/20 text-green-300'}`}
        >
          {toast.msg}
        </div>
      )}
    </>
  );
}
