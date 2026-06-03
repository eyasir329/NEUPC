/**
 * @file Members table component
 * @module MembersTable
 */

import { Edit3, Trash2 } from 'lucide-react';
import { Avatar } from '@/app/account/_components/ui/dashboard';

function formatDate(iso) {
  if (!iso) return '—';
  const date = new Date(iso);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function StatusBadge({ isCurrent }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase ${
        isCurrent
          ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
          : 'border-white/8 bg-white/5 text-gray-400'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${isCurrent ? 'bg-emerald-400' : 'bg-gray-500'}`}
      />
      {isCurrent ? 'Active' : 'Past'}
    </span>
  );
}

export default function MembersTable({ members, positions, onEdit, onDelete }) {
  if (members.length === 0) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/8 bg-white/2 backdrop-blur-md">
      {/* Desktop Table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[700px] border-collapse text-left">
          <thead>
            <tr className="border-b border-white/8 bg-white/3">
              <th className="w-12 px-5 py-4 text-center text-[10px] font-bold tracking-wider text-gray-500 uppercase select-none">
                #
              </th>
              <th className="px-5 py-4 text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
                Member
              </th>
              <th className="px-5 py-4 text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
                Position
              </th>
              <th className="px-5 py-4 text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
                Status
              </th>
              <th className="hidden px-5 py-4 text-[11px] font-semibold tracking-wider text-gray-400 uppercase lg:table-cell">
                Term Period
              </th>
              <th className="px-5 py-4 text-right text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/6">
            {members.map((member, index) => {
              const position = positions.find(
                (p) => p.id === member.position_id
              );
              const fullName = member.users?.full_name || 'Unknown';
              return (
                <tr
                  key={member.id}
                  className="group transition-colors hover:bg-white/4"
                >
                  <td className="px-5 py-4 text-center font-mono text-[10px] text-gray-500 select-none">
                    {String(index + 1).padStart(2, '0')}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={fullName}
                        size="sm"
                        src={member.custom_avatar_url || member.users?.avatar_url}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white transition-colors group-hover:text-violet-400">
                          {fullName}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-gray-500">
                          {member.users?.email}
                        </p>
                        {(() => {
                          const profile = member.users?.member_profiles;
                          const memberProfile = Array.isArray(profile)
                            ? profile[0]
                            : profile;
                          if (
                            !memberProfile?.department &&
                            !memberProfile?.academic_session
                          )
                            return null;
                          return (
                            <p className="mt-0.5 truncate font-mono text-[10px] text-gray-500">
                              {[
                                memberProfile.department,
                                memberProfile.academic_session,
                              ]
                                .filter(Boolean)
                                .join(' · ')}
                            </p>
                          );
                        })()}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-200">
                        {position?.title || '—'}
                      </p>
                      {position && (
                        <p className="mt-0.5 text-[10px] font-bold tracking-wider text-gray-500 uppercase">
                          {position.category}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge isCurrent={member.is_current} />
                  </td>
                  <td className="hidden px-5 py-4 lg:table-cell">
                    <span className="text-xs font-medium text-gray-400">
                      {formatDate(member.term_start)}
                      {member.term_end && (
                        <>
                          <span className="mx-1.5 text-gray-600">→</span>
                          {formatDate(member.term_end)}
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onEdit(member)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/6 bg-white/2 text-gray-400 transition-all hover:border-violet-500/20 hover:bg-violet-500/10 hover:text-violet-400 active:scale-95"
                        title="Edit Member Assignment"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(member.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/6 bg-white/2 text-gray-400 transition-all hover:border-rose-500/20 hover:bg-rose-500/10 hover:text-rose-400 active:scale-95"
                        title="Remove Member"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="divide-y divide-white/6 md:hidden">
        {members.map((member, index) => {
          const position = positions.find((p) => p.id === member.position_id);
          const fullName = member.users?.full_name || 'Unknown';
          return (
            <div
              key={member.id}
              className="flex flex-col gap-3 p-5 transition-colors hover:bg-white/4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="font-mono text-[10px] text-gray-500 select-none">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <Avatar
                    name={fullName}
                    size="sm"
                    src={member.custom_avatar_url || member.users?.avatar_url}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                      {fullName}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-gray-500">
                      {member.users?.email}
                    </p>
                    {(() => {
                      const profile = member.users?.member_profiles;
                      const memberProfile = Array.isArray(profile)
                        ? profile[0]
                        : profile;
                      if (
                        !memberProfile?.department &&
                        !memberProfile?.academic_session
                      )
                        return null;
                      return (
                        <p className="mt-0.5 truncate font-mono text-[10px] text-gray-500">
                          {[
                            memberProfile.department,
                            memberProfile.academic_session,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      );
                    })()}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    onClick={() => onEdit(member)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/6 bg-white/2 text-gray-400 transition-all hover:border-violet-500/20 hover:bg-violet-500/10 hover:text-violet-400 active:scale-95"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => onDelete(member.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/6 bg-white/2 text-gray-400 transition-all hover:border-rose-500/20 hover:bg-rose-500/10 hover:text-rose-400 active:scale-95"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/6 bg-white/2 p-3 text-xs">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">
                    Position
                  </span>
                  <span className="font-semibold text-gray-200">
                    {position?.title || '—'}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">
                    Status
                  </span>
                  <StatusBadge isCurrent={member.is_current} />
                </div>
              </div>

              <div className="flex flex-col gap-1 rounded-xl border border-white/6 bg-white/2 p-3 text-xs">
                <span className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">
                  Term Period
                </span>
                <span className="font-medium text-gray-300">
                  {formatDate(member.term_start)}
                  {member.term_end && (
                    <>
                      <span className="mx-1.5 text-gray-600">→</span>
                      {formatDate(member.term_end)}
                    </>
                  )}
                </span>
              </div>

              {member.bio && (
                <div className="flex flex-col gap-1 rounded-xl border border-white/6 bg-white/2 p-3 text-xs">
                  <span className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">
                    Biography
                  </span>
                  <p className="leading-relaxed font-normal text-gray-400">
                    {member.bio}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
