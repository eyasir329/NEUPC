/**
 * @file Advisor achievements client — comprehensive view of club
 *   achievements with filtering, categorisation, and detail modals.
 * @module AdvisorAchievementsClient
 */

'use client';

import { useState } from 'react';
import {
  Calendar,
  Trophy,
  Users,
  TrendingUp,
  Search,
  Filter,
  Plus,
  X,
  Edit2,
  Trash2,
} from 'lucide-react';

export default function AdvisorAchievementsClient({
  achievements,
  stats,
  topAchievements,
  advisorId,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Extract unique years and categories
  const uniqueYears = stats?.years || [];
  const uniqueCategories = [
    ...new Set(achievements?.map((a) => a.category).filter(Boolean)),
  ];

  // Filter achievements
  const filteredAchievements = achievements?.filter((achievement) => {
    const matchesSearch =
      !searchQuery ||
      achievement.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      achievement.description
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());
    const matchesYear =
      selectedYear === 'all' || achievement.year?.toString() === selectedYear;
    const matchesCategory =
      selectedCategory === 'all' || achievement.category === selectedCategory;
    const matchesType =
      selectedType === 'all' ||
      (selectedType === 'team' && achievement.is_team) ||
      (selectedType === 'individual' && !achievement.is_team);
    return matchesSearch && matchesYear && matchesCategory && matchesType;
  });

  const handleViewDetails = (achievement) => {
    setSelectedAchievement(achievement);
    setShowDetailModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Achievements</h1>
          <p className="mt-1 text-gray-400">
            Club achievements and recognitions
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Trophy}
          label="Total Achievements"
          value={stats?.total || 0}
          color="blue"
        />
        <StatCard
          icon={Calendar}
          label="This Year"
          value={stats?.thisYear || 0}
          color="green"
        />
        <StatCard
          icon={Users}
          label="Team Achievements"
          value={stats?.team || 0}
          color="purple"
        />
        <StatCard
          icon={TrendingUp}
          label="Individual"
          value={stats?.individual || 0}
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
            placeholder="Search achievements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pr-4 pl-12 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap gap-3">
          {/* Year Filter */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
          >
            <option value="all">All Years</option>
            {uniqueYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
          >
            <option value="all">All Categories</option>
            {uniqueCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Type Filter */}
          <div className="flex gap-2">
            {['all', 'team', 'individual'].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  selectedType === type
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Achievements Grid */}
      {filteredAchievements && filteredAchievements.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAchievements.map((achievement) => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center backdrop-blur-xl">
          <Trophy className="mx-auto mb-4 h-16 w-16 text-gray-500" />
          <p className="text-lg text-gray-400">No achievements found</p>
          <p className="mt-2 text-sm text-gray-500">
            {searchQuery || selectedYear !== 'all' || selectedCategory !== 'all'
              ? 'Try adjusting your filters'
              : 'Achievements will appear here'}
          </p>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedAchievement && (
        <DetailModal
          achievement={selectedAchievement}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedAchievement(null);
          }}
        />
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

function AchievementCard({ achievement, onViewDetails }) {
  const memberCount = achievement.member_achievements?.length || 0;

  return (
    <div
      onClick={() => onViewDetails(achievement)}
      className="group cursor-pointer rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition-all hover:bg-white/10"
    >
      {/* Badges Row */}
      <div className="mb-4 flex flex-wrap gap-2">
        <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-medium text-blue-400">
          {achievement.year}
        </span>
        {achievement.category && (
          <span className="rounded-full bg-purple-500/20 px-3 py-1 text-xs font-medium text-purple-400">
            {achievement.category}
          </span>
        )}
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            achievement.is_team
              ? 'bg-green-500/20 text-green-400'
              : 'bg-amber-500/20 text-amber-400'
          }`}
        >
          {achievement.is_team ? 'Team' : 'Individual'}
        </span>
      </div>

      {/* Title */}
      <h3 className="mb-2 line-clamp-2 text-lg font-semibold text-white transition-colors group-hover:text-blue-400">
        {achievement.title}
      </h3>

      {/* Description */}
      {achievement.description && (
        <p className="mb-4 line-clamp-2 text-sm text-gray-400">
          {achievement.description}
        </p>
      )}

      {/* Meta */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-gray-500">
          <Users className="h-4 w-4" />
          <span>
            {memberCount} {memberCount === 1 ? 'member' : 'members'}
          </span>
        </div>
        {achievement.achievement_date && (
          <span className="text-gray-500">
            {new Date(achievement.achievement_date).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
}

function DetailModal({ achievement, onClose }) {
  const memberCount = achievement.member_achievements?.length || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-gray-900/95 backdrop-blur-xl">
        {/* Header */}
        <div className="sticky top-0 flex items-start justify-between border-b border-white/10 bg-gray-900/95 p-6 backdrop-blur-xl">
          <div className="flex-1">
            <h2 className="mb-2 text-2xl font-bold text-white">
              {achievement.title}
            </h2>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-medium text-blue-400">
                {achievement.year}
              </span>
              {achievement.category && (
                <span className="rounded-full bg-purple-500/20 px-3 py-1 text-xs font-medium text-purple-400">
                  {achievement.category}
                </span>
              )}
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  achievement.is_team
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-amber-500/20 text-amber-400'
                }`}
              >
                {achievement.is_team ? 'Team' : 'Individual'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="ml-4 rounded-lg p-2 transition-colors hover:bg-white/10"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6 p-6">
          {/* Description */}
          {achievement.description && (
            <div>
              <h3 className="mb-2 text-sm font-medium text-gray-400">
                Description
              </h3>
              <p className="text-white">{achievement.description}</p>
            </div>
          )}

          {/* Achievement Date */}
          {achievement.achievement_date && (
            <div>
              <h3 className="mb-2 text-sm font-medium text-gray-400">
                Achievement Date
              </h3>
              <p className="text-white">
                {new Date(achievement.achievement_date).toLocaleDateString(
                  'en-US',
                  {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  }
                )}
              </p>
            </div>
          )}

          {/* Members */}
          {memberCount > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-medium text-gray-400">
                Members ({memberCount})
              </h3>
              <div className="space-y-2">
                {achievement.member_achievements.map((ma) => (
                  <div
                    key={ma.id}
                    className="flex items-center gap-3 rounded-lg bg-white/5 p-3"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-purple-600 font-semibold text-white">
                      {ma.users?.full_name?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-white">
                        {ma.users?.full_name || 'Unknown'}
                      </p>
                      {ma.position && (
                        <p className="text-sm text-gray-400">{ma.position}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Audit Info */}
          <div className="space-y-2 border-t border-white/10 pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Created by:</span>
              <span className="text-white">
                {achievement.users?.full_name || 'Unknown'}
              </span>
            </div>
            {achievement.created_at && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Created at:</span>
                <span className="text-white">
                  {new Date(achievement.created_at).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
