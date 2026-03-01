/**
 * @file Advisor events client — event oversight interface with
 *   filtering, attendance summaries, and approval controls.
 * @module AdvisorEventsClient
 */

'use client';

import { useState, useMemo } from 'react';
import {
  Calendar,
  MapPin,
  Users,
  Search,
  TrendingUp,
  Clock,
  CheckCircle,
} from 'lucide-react';

export default function AdvisorEventsClient({ events = [], advisorId }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Calculate event stats and categorize
  const { upcoming, ongoing, completed, stats } = useMemo(() => {
    const now = new Date();
    const upcomingEvents = events.filter((e) => new Date(e.start_date) > now);
    const ongoingEvents = events.filter(
      (e) => new Date(e.start_date) <= now && new Date(e.end_date) >= now
    );
    const completedEvents = events.filter((e) => new Date(e.end_date) < now);

    const totalRegistrations = events.reduce(
      (sum, e) => sum + (e.registrationCount || 0),
      0
    );
    const totalAttendance = events.reduce(
      (sum, e) => sum + (e.attendedCount || 0),
      0
    );

    return {
      upcoming: upcomingEvents,
      ongoing: ongoingEvents,
      completed: completedEvents,
      stats: {
        upcoming: upcomingEvents.length,
        ongoing: ongoingEvents.length,
        completed: completedEvents.length,
        totalRegistrations,
        totalAttendance,
      },
    };
  }, [events]);

  // Filter events
  const filteredEvents = useMemo(() => {
    let filtered = events;

    if (statusFilter === 'upcoming') filtered = upcoming;
    else if (statusFilter === 'ongoing') filtered = ongoing;
    else if (statusFilter === 'completed') filtered = completed;

    if (searchQuery) {
      filtered = filtered.filter(
        (event) =>
          event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.venue?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered.sort(
      (a, b) => new Date(b.start_date) - new Date(a.start_date)
    );
  }, [events, upcoming, ongoing, completed, statusFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Events</h1>
        <p className="mt-1 text-gray-400">Advisor oversight of club events</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Clock}
          label="Upcoming"
          value={stats.upcoming}
          color="blue"
        />
        <StatCard
          icon={TrendingUp}
          label="Ongoing"
          value={stats.ongoing}
          color="green"
        />
        <StatCard
          icon={CheckCircle}
          label="Completed"
          value={stats.completed}
          color="purple"
        />
        <StatCard
          icon={Users}
          label="Total Registrations"
          value={stats.totalRegistrations}
          color="amber"
        />
      </div>

      {/* Filters */}
      <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
        {/* Search */}
        <div className="relative">
          <Search className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pr-4 pl-12 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
          />
        </div>

        {/* Status Tabs */}
        <div className="flex flex-wrap gap-2">
          {['all', 'upcoming', 'ongoing', 'completed'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                statusFilter === status
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Events Grid */}
      {filteredEvents && filteredEvents.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center backdrop-blur-xl">
          <Calendar className="mx-auto mb-4 h-16 w-16 text-gray-500" />
          <p className="text-lg text-gray-400">No events found</p>
          <p className="mt-2 text-sm text-gray-500">
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Events will appear here'}
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  const colorClasses = {
    blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30 text-blue-400',
    green:
      'from-green-500/20 to-green-600/20 border-green-500/30 text-green-400',
    purple:
      'from-purple-500/20 to-purple-600/20 border-purple-500/30 text-purple-400',
    amber:
      'from-amber-500/20 to-amber-600/20 border-amber-500/30 text-amber-400',
  };

  return (
    <div
      className={`bg-linear-to-br backdrop-blur-xl ${colorClasses[color]} rounded-2xl border p-6`}
    >
      <Icon className="mb-4 h-8 w-8" />
      <p className="text-sm text-gray-400">{label}</p>
      <p className="mt-2 text-3xl font-bold text-white">{value}</p>
    </div>
  );
}

function EventCard({ event }) {
  const now = new Date();
  const startDate = new Date(event.start_date);
  const endDate = new Date(event.end_date);

  let status = 'upcoming';
  let statusColor = 'blue';
  if (startDate <= now && endDate >= now) {
    status = 'ongoing';
    statusColor = 'green';
  } else if (endDate < now) {
    status = 'completed';
    statusColor = 'purple';
  }

  const statusClasses = {
    blue: 'bg-blue-500/20 text-blue-400',
    green: 'bg-green-500/20 text-green-400',
    purple: 'bg-purple-500/20 text-purple-400',
  };

  const attendanceRate =
    event.registrationCount > 0
      ? Math.round((event.attendedCount / event.registrationCount) * 100)
      : 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition-colors hover:bg-white/10">
      {/* Status Badge */}
      <span
        className={`rounded-full px-3 py-1 text-xs font-medium ${statusClasses[statusColor]}`}
      >
        {status}
      </span>

      {/* Title */}
      <h3 className="mt-3 mb-2 line-clamp-2 text-lg font-semibold text-white">
        {event.title}
      </h3>

      {/* Meta Info */}
      <div className="mb-4 space-y-2 text-sm text-gray-400">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 shrink-0" />
          <span>{startDate.toLocaleDateString()}</span>
        </div>
        {event.venue && (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="line-clamp-1">{event.venue}</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 border-t border-white/10 pt-3">
        <div className="rounded-lg bg-white/5 p-2 text-center">
          <p className="text-lg font-bold text-white">
            {event.registrationCount || 0}
          </p>
          <p className="text-xs text-gray-400">Registered</p>
        </div>
        <div className="rounded-lg bg-white/5 p-2 text-center">
          <p className="text-lg font-bold text-white">
            {status === 'completed'
              ? `${attendanceRate}%`
              : event.attendedCount || 0}
          </p>
          <p className="text-xs text-gray-400">
            {status === 'completed' ? 'Attendance' : 'Attended'}
          </p>
        </div>
      </div>
    </div>
  );
}
