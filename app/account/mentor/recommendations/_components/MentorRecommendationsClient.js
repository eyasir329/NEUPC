'use client';

import { useState } from 'react';
import { Star, Search, TrendingUp, Award, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { saveMentorNotesAction } from '@/app/_lib/mentor-actions';
import {
  PageShell, PageHeader, GlassCard, StatCard, Avatar, Pill, ActionButton, EmptyState,
} from '@/app/account/mentor/_components/_ui';

const MOCK_MENTORSHIPS = [
  {
    id: 'mp1', status: 'active', focus_area: 'Frontend Development — React, TypeScript, CSS Architecture',
    notes: 'Aisha is one of the strongest mentees I have worked with. She has an exceptional eye for UI detail and writes clean, well-typed React components. I recommend her for any frontend internship or junior role — she is more than ready. She should focus on state management at scale (Zustand or Redux Toolkit) and testing (React Testing Library) before her next interview cycle.',
    'users!mentorships_mentee_id_fkey': { full_name: 'Aisha Rahman', member_profiles: { session: '2021-22', department: 'CSE', skills: ['React', 'TypeScript', 'CSS', 'Figma', 'Next.js'] } },
    member_progress: [
      { id: 'p1', period: 'May 2026',   problems_solved: 24, contests_participated: 2, mentor_notes: 'Completed TypeScript generics module. Great progress.' },
      { id: 'p2', period: 'Apr 2026',   problems_solved: 31, contests_participated: 3, mentor_notes: 'Won 2nd place in internal UI contest.' },
      { id: 'p3', period: 'Mar 2026',   problems_solved: 18, contests_participated: 1, mentor_notes: 'Focused on building portfolio project.' },
    ],
  },
  {
    id: 'mp2', status: 'active', focus_area: 'Backend Development — Node.js, PostgreSQL, REST APIs',
    notes: 'Rahul has shown significant improvement over the last month after we resolved his mental model around async/await and the Node.js event loop. He is a diligent worker who asks good questions. I recommend more practice on database query optimisation and system design fundamentals before targeting backend roles.',
    'users!mentorships_mentee_id_fkey': { full_name: 'Rahul Sharma', member_profiles: { session: '2022-23', department: 'CSE', skills: ['Node.js', 'Express', 'PostgreSQL', 'REST API', 'Docker'] } },
    member_progress: [
      { id: 'p4', period: 'May 2026', problems_solved: 15, contests_participated: 1, mentor_notes: 'Fixed async bug independently — great milestone.' },
      { id: 'p5', period: 'Apr 2026', problems_solved: 9,  contests_participated: 0, mentor_notes: 'Struggled with middleware; extra session scheduled.' },
    ],
  },
  {
    id: 'mp3', status: 'active', focus_area: 'Competitive Programming — DSA, Graph Algorithms, DP',
    notes: 'Sara is exceptional — Codeforces rating 1720 and rising. She solved a Div 2 D problem in our last session without hints. I strongly recommend her for ICPC training and any competitive programming leadership role. Next step: advance to Candidate Master (1900+) by the end of the year.',
    'users!mentorships_mentee_id_fkey': { full_name: 'Sara Ahmed', member_profiles: { session: '2022-23', department: 'CSE', skills: ['C++', 'Competitive Programming', 'Graph Theory', 'Dynamic Programming', 'Segment Trees'] } },
    member_progress: [
      { id: 'p6', period: 'May 2026', problems_solved: 47, contests_participated: 4, mentor_notes: 'Achieved personal best rating — 1720.' },
      { id: 'p7', period: 'Apr 2026', problems_solved: 52, contests_participated: 5, mentor_notes: 'Solved first Div 2 D problem independently.' },
      { id: 'p8', period: 'Mar 2026', problems_solved: 38, contests_participated: 3, mentor_notes: 'Covered lazy propagation — implemented flawlessly.' },
    ],
  },
  {
    id: 'mp4', status: 'active', focus_area: 'Full Stack — MERN, Docker, CI/CD',
    notes: null,
    'users!mentorships_mentee_id_fkey': { full_name: 'John Doe', member_profiles: { session: '2023-24', department: 'CSE', skills: ['React', 'Node.js', 'MongoDB', 'Docker', 'GitHub Actions'] } },
    member_progress: [
      { id: 'p9', period: 'May 2026', problems_solved: 12, contests_participated: 1, mentor_notes: 'Containerised his side project — solid effort.' },
    ],
  },
];

export default function MentorRecommendationsClient({ mentorships: rawMentorships = [], mentorId }) {
  const mentorships = rawMentorships.length === 0 ? MOCK_MENTORSHIPS : rawMentorships;
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [editNotes, setEditNotes] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const activeMentorships = mentorships.filter((m) => m.status === 'active');
  const filtered = activeMentorships.filter((m) => {
    const mentee = m['users!mentorships_mentee_id_fkey'] || m.users;
    const name = mentee?.full_name?.toLowerCase() || '';
    return !search || name.includes(search.toLowerCase());
  });

  const handleSaveNotes = async (mentorshipId) => {
    setSaving(true);
    const fd = new FormData();
    fd.set('mentorshipId', mentorshipId);
    fd.set('notes', editNotes?.notes || '');
    const result = await saveMentorNotesAction(fd);
    if (result.error) setMessage({ type: 'error', text: result.error });
    else { setMessage({ type: 'success', text: 'Notes saved!' }); setEditNotes(null); }
    setSaving(false);
  };

  return (
    <PageShell>
      <PageHeader
        icon={Star}
        title="Recommendations"
        subtitle="Track mentee progress and write recommendations"
        accent="amber"
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        {[
          { label: 'Active Mentees', value: activeMentorships.length, accent: 'blue', icon: Star },
          { label: 'With Notes', value: mentorships.filter((m) => m.notes).length, accent: 'emerald', icon: MessageSquare },
          { label: 'Completed', value: mentorships.filter((m) => m.status === 'completed').length, accent: 'violet', icon: Award },
        ].map((s, i) => (
          <StatCard key={s.label} label={s.label} value={s.value} accent={s.accent} icon={s.icon} delay={i * 0.06} />
        ))}
      </div>

      <div className="relative">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Search mentees…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pr-3 pl-9 text-sm text-white placeholder-gray-500 focus:outline-none" />
      </div>

      {message && (
        <div className={`rounded-xl p-3 text-sm ${message.type === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>{message.text}</div>
      )}

      {filtered.length === 0 ? (
        <GlassCard padding="py-16">
          <EmptyState icon={Star} title="No active mentees" accent="amber" />
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {filtered.map((m) => {
            const mentee = m['users!mentorships_mentee_id_fkey'] || m.users;
            const profile = mentee?.member_profiles;
            const progress = m.member_progress || [];
            const isExpanded = expanded === m.id;

            return (
              <GlassCard key={m.id} padding="p-0" className="overflow-hidden">
                <div className="flex cursor-pointer items-center justify-between p-5" onClick={() => setExpanded(isExpanded ? null : m.id)}>
                  <div className="flex items-center gap-3">
                    <Avatar name={mentee?.full_name || '?'} size="md" />
                    <div>
                      <h3 className="font-semibold text-white text-sm">{mentee?.full_name}</h3>
                      <p className="text-xs text-gray-400">
                        {profile?.session ? `Session ${profile.session}` : ''}
                        {profile?.department ? ` · ${profile.department}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {m.notes && (
                      <Pill tone="emerald" icon={MessageSquare}>Has notes</Pill>
                    )}
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="space-y-5 border-t border-white/6 p-5 pt-4">
                    {m.focus_area && (
                      <div>
                        <p className="mb-1 text-xs font-medium tracking-wider text-gray-500 uppercase">Focus Area</p>
                        <p className="text-sm text-gray-300">{m.focus_area}</p>
                      </div>
                    )}

                    {profile?.skills?.length > 0 && (
                      <div>
                        <p className="mb-2 text-xs font-medium tracking-wider text-gray-500 uppercase">Skills</p>
                        <div className="flex flex-wrap gap-2">
                          {profile.skills.map((skill) => (
                            <span key={skill} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300">{skill}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {progress.length > 0 && (
                      <div>
                        <p className="mb-3 flex items-center gap-1.5 text-xs font-medium tracking-wider text-gray-500 uppercase">
                          <TrendingUp className="h-3.5 w-3.5" /> Progress History
                        </p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {progress.slice(0, 4).map((p) => (
                            <div key={p.id} className="rounded-xl border border-white/6 bg-white/2 p-3">
                              <p className="mb-2 text-xs font-medium text-gray-300">{p.period}</p>
                              <div className="flex gap-4 text-sm">
                                <div className="text-center">
                                  <p className="font-semibold text-blue-400">{p.problems_solved ?? 0}</p>
                                  <p className="text-xs text-gray-500">Problems</p>
                                </div>
                                <div className="text-center">
                                  <p className="font-semibold text-emerald-400">{p.contests_participated ?? 0}</p>
                                  <p className="text-xs text-gray-500">Contests</p>
                                </div>
                              </div>
                              {p.mentor_notes && <p className="mt-2 text-xs text-gray-500">{p.mentor_notes}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <p className="mb-2 text-xs font-medium tracking-wider text-gray-500 uppercase">Mentor Notes / Recommendation</p>
                      {editNotes?.mentorshipId === m.id ? (
                        <div className="space-y-2">
                          <textarea
                            rows={4}
                            value={editNotes.notes}
                            onChange={(e) => setEditNotes({ ...editNotes, notes: e.target.value })}
                            placeholder="Write your recommendation or notes about this mentee…"
                            className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-blue-500/50 focus:outline-none"
                          />
                          <div className="flex gap-2">
                            <ActionButton tone="ghost" onClick={() => setEditNotes(null)}>Cancel</ActionButton>
                            <ActionButton tone="primary" onClick={() => handleSaveNotes(m.id)}>{saving ? 'Saving…' : 'Save Notes'}</ActionButton>
                          </div>
                        </div>
                      ) : (
                        <div>
                          {m.notes ? (
                            <p className="mb-3 rounded-xl border border-white/6 bg-white/2 p-3 text-sm text-gray-300">{m.notes}</p>
                          ) : (
                            <p className="mb-3 text-sm italic text-gray-500">No notes written yet.</p>
                          )}
                          <ActionButton tone="primary" icon={MessageSquare} onClick={() => setEditNotes({ mentorshipId: m.id, notes: m.notes || '' })}>
                            {m.notes ? 'Edit Notes' : 'Write Notes'}
                          </ActionButton>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </GlassCard>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
