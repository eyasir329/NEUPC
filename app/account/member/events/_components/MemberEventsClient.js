'use client';

import React, { useState, useMemo, useTransition, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  CheckCircle,
  Ticket,
  CalendarCheck,
  CalendarX,
  ChevronRight,
  ChevronLeft,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  Loader2,
  X,
  Sparkles,
  FileText,
} from 'lucide-react';
import { registerForEventAction } from '@/app/_lib/member-events-actions';
import { PageShell, TabBar, PageHeader } from '../../_components/_ui';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
const fmtTime = (iso) =>
  iso
    ? new Date(iso).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';
const isPast = (iso) => (iso ? new Date(iso) < new Date() : false);

const STATS_CONFIG = [
  {
    id: 'upcoming',
    title: 'Upcoming',
    subtext: 'Next scheduled',
    icon: Calendar,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  {
    id: 'registered',
    title: 'Registered',
    subtext: 'Your seat saved',
    icon: CheckCircle,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  {
    id: 'open',
    title: 'Open Slots',
    subtext: 'Available now',
    icon: Ticket,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
  },
  {
    id: 'attended',
    title: 'Attended',
    subtext: 'Past timeline',
    icon: CalendarCheck,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
];

function Flash({ msg, onClose }) {
  const isErr = msg.type === 'error';
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className={`fixed top-6 right-6 z-50 flex items-center gap-3 rounded-2xl border px-5 py-4 text-sm shadow-2xl backdrop-blur-xl ${
        isErr
          ? 'border-rose-500/30 bg-rose-950/80 text-rose-200'
          : 'border-emerald-500/30 bg-emerald-950/80 text-emerald-200'
      }`}
    >
      {isErr ? (
        <XCircle className="h-5 w-5 shrink-0 text-rose-400" />
      ) : (
        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
      )}
      <span className="flex-1 font-semibold tracking-wide">{msg.text}</span>
      <button onClick={onClose} type="button" className="ml-2 hover:scale-110 transition-transform">
        <X className="h-4 w-4 opacity-70 hover:opacity-100" />
      </button>
    </motion.div>
  );
}

const MainContent = ({ activeTab, events, stats, onEventClick }) => {
  const filteredEvents =
    activeTab === 'Upcoming'
      ? events.filter((e) => e.isUpcoming)
      : events.filter((e) => e.category === activeTab);

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Center content (Event List) */}
          <div className="lg:col-span-2 flex flex-col gap-3 min-w-0">
            {/* Results count */}
            <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-3 pb-3 border-b border-white/[0.06]">
              <p className="text-xs text-gray-500 font-medium">
                {filteredEvents.length === 0
                  ? `No events found in ${activeTab}`
                  : `Showing ${filteredEvents.length} event${filteredEvents.length !== 1 ? 's' : ''}`
                }
              </p>
            </div>

            <AnimatePresence mode="popLayout">
              {filteredEvents.length > 0 ? (
                <motion.div
                  key="list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col gap-3"
                >
                  {filteredEvents.map((event, index) => {
                    const dateObj = new Date(event.start_date || new Date());
                    const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
                    const day = dateObj.toLocaleDateString('en-US', { day: 'numeric' });
                    
                    return (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05, ease: 'easeOut' }}
                        onClick={() => onEventClick(event.id)}
                        className="group bg-white/[0.03] hover:bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.14] rounded-2xl p-5 flex flex-col sm:flex-row gap-5 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md relative overflow-hidden"
                      >
                        {event.status === 'Registration Open' && (
                           <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/50"></div>
                        )}
                        
                        {/* Left Date Block */}
                        <div className="hidden sm:flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-gray-900/50 border border-white/5 shadow-inner shrink-0 group-hover:border-violet-500/40 transition-all z-10">
                          <span className="text-[9px] uppercase font-bold text-violet-400 tracking-widest leading-none mb-1">{month}</span>
                          <span className="text-xl font-bold text-white leading-none">{day}</span>
                        </div>
                        
                        <div className="flex-1 min-w-0 z-10 flex flex-col justify-center">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded-md bg-violet-500/10 border border-violet-500/20 text-violet-300 font-bold text-[10px] tracking-wider uppercase">
                              {event.type}
                            </span>
                            {event.status === 'Registration Open' && (
                              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-[10px] tracking-wider uppercase">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                Open
                              </span>
                            )}
                          </div>
                          <h3 className="text-base font-semibold text-gray-200 group-hover:text-violet-400 transition-colors line-clamp-2 mb-1 leading-snug">
                            {event.title}
                          </h3>
                          <div className="text-xs text-gray-500 flex items-center gap-4 font-medium mt-2">
                            <div className="flex items-center gap-1.5">
                              <Clock size={13} className="text-gray-600" /> {event.time}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <MapPin size={13} className="text-gray-600" /> <span className="truncate max-w-[150px]">{event.location}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex sm:flex-col sm:items-end justify-between items-center sm:justify-center gap-4 text-xs font-medium text-gray-500 sm:ml-4 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-white/[0.06] w-full sm:w-auto">
                          <span className="px-2.5 py-1 rounded-md border border-white/[0.08] bg-white/[0.03] text-gray-400 font-semibold tracking-wide">
                            {event.status}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center p-12 bg-white/[0.02] border border-white/[0.08] border-dashed rounded-2xl text-center"
                >
                  <CalendarX size={48} className="text-gray-700 mb-4" />
                  <h3 className="text-lg font-medium text-gray-300 mb-1">No {activeTab} events</h3>
                  <p className="text-sm text-gray-500 max-w-sm">
                    There are currently no events registered for this category. Check back later!
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Sidebar - Fixed */}
          <div className="hidden lg:flex flex-col gap-6 sticky top-6">
            {/* Overview Stats */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 hover:border-white/[0.1] transition-all">
              <h3 className="text-sm font-semibold text-gray-200 mb-4">Overview</h3>
              <div className="flex flex-col gap-4 text-sm">
                {stats.map((stat) => (
                  <div key={stat.id} className="flex justify-between items-center group">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center ${stat.bg}`}>
                        <stat.icon size={12} className={stat.color} />
                      </div>
                      <span className="text-gray-400 font-medium group-hover:text-gray-300 transition-colors">{stat.title}</span>
                    </div>
                    <span className="text-white font-semibold tabular-nums">{stat.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Next Event */}
            <div className="rounded-xl border border-white/[0.06] bg-gradient-to-br from-violet-500/10 to-fuchsia-500/5 p-5 relative overflow-hidden hover:border-white/[0.1] transition-all group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none group-hover:bg-violet-500/20 transition-colors"></div>
              <h3 className="text-sm font-semibold text-gray-200 mb-2 relative z-10 flex items-center gap-2">
                <Sparkles size={14} className="text-violet-400" /> What&apos;s next?
              </h3>
              <p className="text-xs text-gray-400 mb-4 relative z-10 leading-relaxed">
                Stay updated with the latest events and member networking opportunities.
              </p>
              <div className="px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-center relative z-10 group-hover:bg-white/[0.05] transition-colors">
                 <span className="text-xs font-semibold text-violet-300 block">
                   {stats.find((s) => s.id === 'upcoming')?.count || 0} events
                 </span>
                 <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Scheduled</span>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
};

const EventDetail = ({ event, onBack, onFlash }) => {
  const [pending, startTransition] = useTransition();

  const handleAction = () => {
    if (event.category === 'Past events') return;
    if (event.status === 'Registered') return;

    startTransition(async () => {
      const res = await registerForEventAction(event.id);
      if (res.error) {
        onFlash({ type: 'error', text: res.error });
      } else {
        onFlash({ type: 'success', text: `Registered for "${event.title}"!` });
      }
    });
  };

  return (
    <div className="flex flex-col gap-6 lg:gap-8 pb-12">
        <button
          onClick={onBack}
          className="w-max flex items-center gap-2 px-4 py-2 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] rounded-lg text-xs font-semibold text-gray-300 hover:text-white transition-all shadow-sm active:scale-95"
        >
          <ChevronLeft size={16} /> Back to Events
        </button>

        {/* Hero Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400 shadow-inner shrink-0 mt-1">
              <Calendar size={32} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="px-2.5 py-1 rounded-md bg-white/[0.06] border border-white/[0.08] text-gray-300 text-[10px] uppercase font-bold tracking-wider">
                  {event.type}
                </span>
                {event.status === 'Registration Open' && (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] uppercase font-bold tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Registration Open
                  </span>
                )}
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight mb-4 leading-snug">
                {event.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-400 font-medium">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-gray-500" />
                  {event.date}
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-gray-500" />
                  {event.time}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-gray-500" />
                  {event.location}
                </div>
              </div>
            </div>
          </div>
          
          <div className="shrink-0 flex flex-col gap-2 w-full md:w-auto">
            <button
              onClick={handleAction}
              disabled={pending}
              className="w-full md:w-48 py-3 px-6 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-violet-600/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {pending ? (
                <Loader2 className="h-5 w-5 animate-spin mx-auto" />
              ) : event.category === 'Past events' ? (
                'View Past Event'
              ) : event.status === 'Registered' ? (
                'Registered ✓'
              ) : (
                'Register Now'
              )}
            </button>
            <div className="text-center text-xs text-gray-500 font-medium mt-1">
              {event.status === 'Registered' ? 'You have a confirmed ticket' : 'Secure your spot today'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* About Card */}
            <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/50 p-6 shadow-lg backdrop-blur-xl">
              <h3 className="text-sm font-bold text-gray-200 mb-4 flex items-center gap-2">
                <FileText size={16} className="text-violet-400" /> About Event
              </h3>
              <p className="text-gray-300 text-[15px] leading-relaxed whitespace-pre-wrap">
                {event.description}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {/* Details Info */}
            <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/50 p-6 shadow-lg backdrop-blur-xl">
              <h3 className="text-sm font-bold text-gray-200 mb-4">Event Details</h3>
              <div className="flex flex-col gap-4 text-sm">
                <div className="flex justify-between items-center py-2 border-b border-white/[0.06]">
                  <span className="text-gray-500 font-medium">Status</span>
                  <span className="text-gray-200 font-semibold">{event.status}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/[0.06]">
                  <span className="text-gray-500 font-medium">Category</span>
                  <span className="text-gray-200 font-semibold">{event.type}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-500 font-medium">Access</span>
                  <span className="text-emerald-400 font-semibold">Members Only</span>
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
};

export default function MemberEventsClient({ events: serverEvents, myRegistrations }) {
  const [activeTab, setActiveTab] = useState('Upcoming');
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [flash, setFlash] = useState(null);

  useEffect(() => {
    if (!flash) return;
    const id = setTimeout(() => setFlash(null), 5000);
    return () => clearTimeout(id);
  }, [flash]);

  const allEvents = useMemo(() => {
    const regMap = {};
    for (const r of myRegistrations || []) {
      if (r.event_id) regMap[r.event_id] = r.status !== 'cancelled';
    }

    return (serverEvents || []).map((e) => {
      const isEventPast = isPast(e.start_date);
      const isReg = !!regMap[e.id];

      let category = '';
      let status = '';

      if (isEventPast) {
        category = 'Past events';
        status = isReg ? 'Attended' : 'Missed';
      } else if (isReg) {
        category = 'Registered';
        status = 'Registered';
      } else {
        category = 'Open events';
        status = 'Registration Open';
      }

      return {
        ...e,
        type: e.category || e.kind || 'Event',
        status,
        category,
        date: fmtDate(e.start_date),
        time: fmtTime(e.start_date),
        location: e.location || 'Virtual',
        isUpcoming: !isEventPast,
      };
    });
  }, [serverEvents, myRegistrations]);

  const stats = STATS_CONFIG.map((stat) => {
    let count = 0;
    if (stat.id === 'upcoming') count = allEvents.filter((e) => e.isUpcoming).length;
    else if (stat.id === 'registered') count = allEvents.filter((e) => e.category === 'Registered').length;
    else if (stat.id === 'open') count = allEvents.filter((e) => e.category === 'Open events').length;
    else if (stat.id === 'attended') count = allEvents.filter((e) => e.category === 'Past events').length;
    return { ...stat, count };
  });

  const tabs = [
    { id: 'Upcoming', label: 'All Events', icon: Calendar, count: stats.find((s) => s.id === 'upcoming')?.count || 0 },
    { id: 'Registered', label: 'Registered', icon: CheckCircle, count: stats.find((s) => s.id === 'registered')?.count || 0 },
    { id: 'Open events', label: 'Open Slots', icon: Ticket, count: stats.find((s) => s.id === 'open')?.count || 0 },
    { id: 'Past events', label: 'Past Events', icon: CalendarCheck, count: stats.find((s) => s.id === 'attended')?.count || 0 },
  ];

  const selectedEvent = selectedEventId ? allEvents.find((e) => e.id === selectedEventId) : null;

  const uiTabs = tabs.map((t) => ({ value: t.id, label: t.label, icon: t.icon, count: t.count }));

  return (
    <PageShell className="text-gray-300 selection:bg-violet-500/30">
      <AnimatePresence>
        {flash && <Flash msg={flash} onClose={() => setFlash(null)} />}
      </AnimatePresence>

      <AnimatePresence mode="popLayout">
        {selectedEvent ? (
          <motion.div
            key="detail"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          >
            <EventDetail
              event={selectedEvent}
              onBack={() => setSelectedEventId(null)}
              onFlash={setFlash}
            />
          </motion.div>
        ) : (
          <motion.div
            key="main"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          >
            <PageHeader icon={Calendar} title="Events" subtitle="Discover and register for upcoming contests, workshops and bootcamps" accent="blue" />
            <TabBar
              tabs={uiTabs}
              value={activeTab}
              onChange={(id) => { setActiveTab(id); setSelectedEventId(null); }}
            />
            <MainContent
              activeTab={activeTab}
              events={allEvents}
              stats={stats}
              onEventClick={setSelectedEventId}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </PageShell>
  );
}
