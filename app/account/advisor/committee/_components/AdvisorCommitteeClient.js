'use client';

import { useState } from 'react';
import { Users, Award, Search, Calendar } from 'lucide-react';

export default function AdvisorCommitteeClient({
  positions,
  currentCommittee,
  advisorId,
}) {
  const [activeTab, setActiveTab] = useState('current');
  const [searchQuery, setSearchQuery] = useState('');

  // Group current committee by category
  const committeeByCategory = currentCommittee?.reduce((acc, member) => {
    const category = member.committee_positions?.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(member);
    return acc;
  }, {});

  const tabs = [
    { id: 'current', label: 'Current Committee' },
    { id: 'positions', label: 'All Positions' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Committee</h1>
        <p className="mt-1 text-gray-400">
          View and manage committee structure
        </p>
      </div>

      {/* Tabs */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
        {/* Tab Headers */}
        <div className="flex border-b border-white/10">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'border-b-2 border-blue-500 bg-blue-500/20 text-blue-400'
                  : 'text-gray-400 hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pr-4 pl-12 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
            />
          </div>

          {/* Current Committee Tab */}
          {activeTab === 'current' && (
            <div className="space-y-6">
              {Object.keys(committeeByCategory || {}).length > 0 ? (
                Object.entries(committeeByCategory).map(
                  ([category, members]) => (
                    <div key={category} className="space-y-3">
                      <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                        <Award className="h-5 w-5 text-blue-400" />
                        {category}
                      </h3>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {members.map((member) => (
                          <CommitteeMemberCard
                            key={member.id}
                            member={member}
                          />
                        ))}
                      </div>
                    </div>
                  )
                )
              ) : (
                <div className="py-12 text-center">
                  <Users className="mx-auto mb-4 h-16 w-16 text-gray-500" />
                  <p className="text-gray-400">No current committee members</p>
                </div>
              )}
            </div>
          )}

          {/* Positions Tab */}
          {activeTab === 'positions' && (
            <div className="space-y-3">
              {positions && positions.length > 0 ? (
                positions
                  .filter(
                    (pos) =>
                      !searchQuery ||
                      pos.title
                        ?.toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                      pos.category
                        ?.toLowerCase()
                        .includes(searchQuery.toLowerCase())
                  )
                  .map((position) => (
                    <PositionCard key={position.id} position={position} />
                  ))
              ) : (
                <div className="py-12 text-center">
                  <Award className="mx-auto mb-4 h-16 w-16 text-gray-500" />
                  <p className="text-gray-400">No positions defined</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CommitteeMemberCard({ member }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-colors hover:bg-white/10">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-purple-600 font-semibold text-white">
          {member.users?.full_name?.charAt(0) || '?'}
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-white">
            {member.users?.full_name || 'Unknown'}
          </h3>
          <p className="text-sm text-blue-400">
            {member.committee_positions?.title}
          </p>
        </div>
      </div>
      {member.term_start && (
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Calendar className="h-3 w-3" />
          <span>
            {new Date(member.term_start).getFullYear()}
            {member.term_end && ` - ${new Date(member.term_end).getFullYear()}`}
          </span>
        </div>
      )}
    </div>
  );
}

function PositionCard({ position }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-colors hover:bg-white/10">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="font-medium text-white">{position.title}</h3>
          <p className="mt-1 text-sm text-gray-400">{position.category}</p>
        </div>
        <span className="text-sm text-gray-500">
          Order: {position.display_order || 0}
        </span>
      </div>
    </div>
  );
}
