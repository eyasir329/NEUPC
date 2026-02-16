'use client';

import Link from 'next/link';
import {
  Calendar,
  Trophy,
  Bell,
  User,
  Sparkles,
  ChevronRight,
  Lock,
  Award,
  TrendingUp,
  CheckCircle,
  Clock,
  ArrowRight,
  BookOpen,
  Users,
  Target,
  Zap,
  Gift,
  Star,
  Rocket,
} from 'lucide-react';

export default function GuestDashboardClient({ session }) {
  // Mock data - replace with actual API calls later
  const stats = {
    registeredEvents: 3,
    upcomingEvents: 5,
    participationCount: 7,
    notifications: 2,
  };

  const notifications = [
    {
      id: 1,
      title: 'Event Registration Confirmed',
      message: 'You are registered for Web Development Workshop',
      time: '2 hours ago',
      type: 'success',
      unread: true,
    },
    {
      id: 2,
      title: 'New Event Available',
      message: 'CP Contest #12 is now open for registration',
      time: '5 hours ago',
      type: 'info',
      unread: true,
    },
  ];

  const upcomingEvents = [
    {
      id: 1,
      title: 'Web Development Workshop',
      date: 'Feb 20, 2026',
      time: '2:00 PM',
      status: 'registered',
      isPublic: true,
    },
    {
      id: 2,
      title: 'CP Contest #12',
      date: 'Feb 22, 2026',
      time: '4:00 PM',
      status: 'available',
      isPublic: true,
    },
    {
      id: 3,
      title: 'Advanced Algorithms',
      date: 'Feb 25, 2026',
      time: '3:00 PM',
      status: 'members-only',
      isPublic: false,
    },
  ];

  const recentParticipation = [
    {
      id: 1,
      event: 'JavaScript Fundamentals',
      date: 'Feb 10, 2026',
      status: 'attended',
      certificate: true,
    },
    {
      id: 2,
      event: 'Git & GitHub Workshop',
      date: 'Feb 5, 2026',
      status: 'attended',
      certificate: true,
    },
  ];

  // Member benefits
  const memberBenefits = [
    { icon: Trophy, text: 'Access to exclusive contests', color: 'amber' },
    { icon: BookOpen, text: 'Premium learning resources', color: 'blue' },
    { icon: Users, text: 'Mentorship opportunities', color: 'purple' },
    { icon: Award, text: 'Certificates & badges', color: 'green' },
    { icon: Target, text: 'Personalized roadmaps', color: 'pink' },
    { icon: Rocket, text: 'Networking events', color: 'cyan' },
  ];

  // Available public features
  const publicFeatures = [
    {
      id: 1,
      title: 'Public Events',
      description: 'Attend free workshops and seminars',
      icon: Calendar,
      color: 'blue',
      link: '/events',
    },
    {
      id: 2,
      title: 'Blog Posts',
      description: 'Read tech articles and tutorials',
      icon: BookOpen,
      color: 'purple',
      link: '/blogs',
    },
    {
      id: 3,
      title: 'Roadmaps',
      description: 'Preview learning paths',
      icon: Target,
      color: 'green',
      link: '/roadmaps',
    },
  ];

  return (
    <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-linear-to-br from-purple-500/10 via-pink-500/10 to-blue-500/10 p-6 backdrop-blur-xl sm:p-8">
        <div className="absolute top-0 right-0 h-40 w-40 bg-purple-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-40 w-40 bg-pink-500/20 blur-3xl" />
        <div className="relative">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white md:text-4xl">
                👋 Welcome, {session.user.name?.split(' ')[0]}!
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-2 rounded-full bg-blue-500/20 px-3 py-1 text-sm font-semibold text-blue-300">
                  <User className="h-4 w-4" />
                  Guest Account
                </span>
                <span className="rounded-full bg-amber-500/20 px-3 py-1 text-sm font-semibold text-amber-300">
                  Limited Access
                </span>
              </div>
              <p className="mt-3 text-sm text-gray-400">
                Unlock full access by becoming a member
              </p>
            </div>
            <Link
              href="/join"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-linear-to-r from-purple-600 to-pink-600 px-6 py-3 font-bold text-white shadow-xl shadow-purple-500/30 transition-all duration-300 hover:scale-105 hover:shadow-purple-500/50"
            >
              <Sparkles className="h-5 w-5" />
              <span className="whitespace-nowrap">Apply for Membership</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        <div className="group rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/20 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400">Registered</p>
              <p className="mt-2 text-3xl font-bold text-white">
                {stats.registeredEvents}
              </p>
              <p className="mt-1 text-xs text-blue-400">Active events</p>
            </div>
            <Calendar className="h-8 w-8 text-blue-400 opacity-70 transition-transform duration-300 group-hover:scale-110" />
          </div>
        </div>

        <div className="group rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-amber-500/20 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400">Upcoming</p>
              <p className="mt-2 text-3xl font-bold text-white">
                {stats.upcomingEvents}
              </p>
              <p className="mt-1 text-xs text-amber-400">Available</p>
            </div>
            <TrendingUp className="h-8 w-8 text-amber-400 opacity-70 transition-transform duration-300 group-hover:scale-110" />
          </div>
        </div>

        <div className="group rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-green-500/20 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400">Attended</p>
              <p className="mt-2 text-3xl font-bold text-white">
                {stats.participationCount}
              </p>
              <p className="mt-1 text-xs text-green-400">Events</p>
            </div>
            <Trophy className="h-8 w-8 text-green-400 opacity-70 transition-transform duration-300 group-hover:scale-110" />
          </div>
        </div>

        <div className="group rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-500/20 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400">Alerts</p>
              <p className="mt-2 text-3xl font-bold text-white">
                {stats.notifications}
              </p>
              <p className="mt-1 text-xs text-purple-400">Unread</p>
            </div>
            <Bell className="h-8 w-8 text-purple-400 opacity-70 transition-transform duration-300 group-hover:scale-110" />
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Upcoming Events - Takes 2 columns */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">
                  📅 Upcoming Events
                </h2>
                <p className="text-sm text-gray-400">
                  Public events you can join
                </p>
              </div>
              <Link
                href="/events"
                className="rounded-lg bg-blue-500/20 px-3 py-1.5 text-sm font-semibold text-blue-300 transition-colors hover:bg-blue-500/30"
              >
                View All
              </Link>
            </div>
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="group rounded-lg border border-white/10 bg-white/5 p-4 transition-all duration-200 hover:border-blue-500/30 hover:bg-white/10"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-white group-hover:text-blue-300">
                          {event.title}
                        </h3>
                        {!event.isPublic && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-300">
                            <Lock className="h-3 w-3" />
                            Members Only
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {event.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {event.time}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {event.isPublic ? (
                        event.status === 'registered' ? (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-green-500/20 px-3 py-1.5 text-xs font-semibold text-green-300">
                            <CheckCircle className="h-3 w-3" />
                            Registered
                          </span>
                        ) : (
                          <button className="inline-flex items-center gap-1 rounded-lg bg-blue-500/20 px-3 py-1.5 text-xs font-semibold text-blue-300 transition-colors hover:bg-blue-500/30">
                            Register
                            <ChevronRight className="h-3 w-3" />
                          </button>
                        )
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-gray-500/20 px-3 py-1.5 text-xs font-semibold text-gray-400">
                          <Lock className="h-3 w-3" />
                          Locked
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar - Notifications */}
        <div className="space-y-4 sm:space-y-6">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-purple-400" />
                <h3 className="font-bold text-white">Notifications</h3>
              </div>
              {stats.notifications > 0 && (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                  {stats.notifications}
                </span>
              )}
            </div>
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`rounded-lg border p-3 transition-all duration-200 ${
                    notification.unread
                      ? 'border-blue-500/30 bg-blue-500/10'
                      : 'border-white/10 bg-white/5'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {notification.unread && (
                      <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-400" />
                    )}
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-white">
                        {notification.title}
                      </h4>
                      <p className="mt-1 text-xs text-gray-400">
                        {notification.message}
                      </p>
                      <span className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        {notification.time}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Participation & Public Features */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Recent Participation */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-white">
              🏆 Recent Participation
            </h2>
            <p className="text-sm text-gray-400">Your event history</p>
          </div>
          <div className="space-y-3">
            {recentParticipation.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4 transition-all duration-200 hover:border-white/20 hover:bg-white/10"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-white">{item.event}</h3>
                  <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                    <Calendar className="h-3 w-3" />
                    {item.date}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-lg bg-green-500/20 px-2 py-1 text-xs font-semibold text-green-300">
                    <CheckCircle className="h-3 w-3" />
                    Attended
                  </span>
                  {item.certificate && (
                    <button className="inline-flex items-center gap-1 rounded-lg bg-blue-500/20 px-2 py-1 text-xs font-semibold text-blue-300 transition-colors hover:bg-blue-500/30">
                      <Award className="h-3 w-3" />
                      Certificate
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Available Public Features */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-white">🌟 Explore</h2>
            <p className="text-sm text-gray-400">Available for guest users</p>
          </div>
          <div className="space-y-3">
            {publicFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <Link
                  key={feature.id}
                  href={feature.link}
                  className="group flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4 transition-all duration-200 hover:border-white/20 hover:bg-white/10"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`rounded-lg bg-${feature.color}-500/20 p-2`}
                    >
                      <Icon className={`h-5 w-5 text-${feature.color}-400`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white group-hover:text-blue-300">
                        {feature.title}
                      </h3>
                      <p className="text-xs text-gray-400">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-white" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Membership Benefits Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-purple-500/30 bg-linear-to-br from-purple-500/20 via-pink-500/15 to-purple-600/20 p-6 backdrop-blur-xl sm:p-8">
        <div className="absolute top-0 right-0 h-32 w-32 bg-purple-500/30 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-32 w-32 bg-pink-500/30 blur-3xl" />
        <div className="relative">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-full bg-purple-500/30 p-3">
              <Gift className="h-6 w-6 text-purple-300" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                Unlock Full Access
              </h2>
              <p className="text-sm text-gray-300">
                Join as a member and get exclusive benefits
              </p>
            </div>
          </div>

          <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {memberBenefits.map((benefit, idx) => {
              const Icon = benefit.icon;
              return (
                <div key={idx} className="flex items-center gap-2">
                  <Icon
                    className={`h-4 w-4 shrink-0 text-${benefit.color}-400`}
                  />
                  <span className="text-sm text-white">{benefit.text}</span>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Link
              href="/join"
              className="group inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-purple-600 to-pink-600 px-6 py-3 font-bold text-white shadow-xl shadow-purple-500/30 transition-all duration-300 hover:scale-105 hover:shadow-purple-500/50"
            >
              <Sparkles className="h-5 w-5" />
              <span>Apply for Membership</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3 font-semibold text-white transition-all hover:bg-white/10"
            >
              Learn More
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        <Link
          href="/account/settings"
          className="group flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-200 hover:border-white/20 hover:bg-white/10"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/20 p-2">
              <User className="h-5 w-5 text-blue-400" />
            </div>
            <span className="font-semibold text-white">Profile Settings</span>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-white" />
        </Link>

        <Link
          href="/account/guest/certificates"
          className="group flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-200 hover:border-white/20 hover:bg-white/10"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-500/20 p-2">
              <Award className="h-5 w-5 text-green-400" />
            </div>
            <span className="font-semibold text-white">My Certificates</span>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-white" />
        </Link>

        <Link
          href="/events"
          className="group flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-200 hover:border-white/20 hover:bg-white/10"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-500/20 p-2">
              <Calendar className="h-5 w-5 text-purple-400" />
            </div>
            <span className="font-semibold text-white">Browse Events</span>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-white" />
        </Link>
      </div>
    </div>
  );
}
