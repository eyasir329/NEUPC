/**
 * @file Mentor profile client component
 * @module MentorProfileClient
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Phone, Github, Code, Edit2, Save, X } from 'lucide-react';
import { updateMentorProfileAction } from '@/app/_lib/actions/mentor-actions';
import {
  PageShell,
  PageHeader,
  GlassCard,
  SectionHeader,
  Avatar,
  Pill,
  ActionButton,
} from '@/app/account/_components/ui';

export default function MentorProfileClient({
  user,
  memberProfile,
  codeforcesHandle,
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [skills, setSkills] = useState(memberProfile?.skills || []);
  const [skillInput, setSkillInput] = useState('');

  const addSkill = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = skillInput.trim();
      if (val && !skills.includes(val)) setSkills([...skills, val]);
      setSkillInput('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const fd = new FormData(e.target);
      fd.set('skills', skills.join(','));
      const res = await updateMentorProfileAction(fd);
      if (res?.error) throw new Error(res.error);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setEditing(false);
      router.refresh();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
    setLoading(false);
  };

  const infoRows = [
    { icon: Mail, label: 'Email', value: user?.email },
    { icon: Phone, label: 'Phone', value: user?.phone || '—' },
    {
      icon: User,
      label: 'Student ID',
      value: memberProfile?.student_id || '—',
    },
    {
      icon: User,
      label: 'Session',
      value: memberProfile?.academic_session || '—',
    },
    {
      icon: User,
      label: 'Department',
      value: memberProfile?.department || '—',
    },
    { icon: User, label: 'Semester', value: memberProfile?.semester || '—' },
  ];

  return (
    <PageShell>
      <PageHeader
        icon={User}
        title="Profile"
        subtitle="Manage your mentor profile information"
        accent="emerald"
        actions={
          !editing && (
            <ActionButton
              tone="primary"
              icon={Edit2}
              onClick={() => setEditing(true)}
            >
              Edit Profile
            </ActionButton>
          )
        }
      />

      {message && (
        <div
          className={`rounded-xl p-3 text-sm ${message.type === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}
        >
          {message.text}
        </div>
      )}

      {/* Avatar card */}
      <GlassCard padding="p-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          {user?.avatar_url ? (
            <Avatar src={user.avatar_url} name={user.full_name} size="xl" />
          ) : (
            <Avatar name={user?.full_name || 'M'} size="xl" />
          )}
          <div>
            <h2 className="text-2xl font-bold text-white">{user?.full_name}</h2>
            <p className="text-sm text-gray-400">{user?.email}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Pill tone="blue">Mentor</Pill>
              <Pill
                tone={user?.account_status === 'active' ? 'emerald' : 'gray'}
              >
                {user?.account_status}
              </Pill>
            </div>
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal Info */}
        <GlassCard padding="p-6">
          <SectionHeader
            icon={User}
            title="Personal Information"
            accent="gray"
          />
          <div className="space-y-3">
            {infoRows.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/6 bg-white/2">
                  <Icon className="h-4 w-4 text-gray-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="text-sm text-gray-300">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Editable card */}
        <GlassCard padding="p-6">
          <SectionHeader icon={Edit2} title="Mentor Profile" accent="blue" />

          {editing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-400">
                  Bio
                </label>
                <textarea
                  name="bio"
                  rows={3}
                  defaultValue={memberProfile?.bio || ''}
                  placeholder="Tell your mentees about yourself…"
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-400">
                  GitHub
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  <Github className="h-4 w-4 shrink-0 text-gray-400" />
                  <input
                    name="github"
                    defaultValue={memberProfile?.github || ''}
                    placeholder="https://github.com/username"
                    className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-400">
                  Codeforces Handle
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  <Code className="h-4 w-4 shrink-0 text-gray-400" />
                  <input
                    name="codeforces_handle"
                    defaultValue={codeforcesHandle || ''}
                    placeholder="your_handle"
                    className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-400">
                  Skills
                </label>
                <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {skills.map((s) => (
                      <span
                        key={s}
                        className="flex items-center gap-1 rounded-full bg-blue-500/20 px-2 py-0.5 text-xs text-blue-400"
                      >
                        {s}
                        <button
                          type="button"
                          onClick={() =>
                            setSkills(skills.filter((sk) => sk !== s))
                          }
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={addSkill}
                    placeholder="Type skill and press Enter…"
                    className="w-full bg-transparent text-xs text-white placeholder-gray-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2 text-sm text-gray-300 hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? (
                    'Saving…'
                  ) : (
                    <>
                      <Save className="h-4 w-4" /> Save
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="mb-1 text-xs text-gray-500">Bio</p>
                <p className="text-sm text-gray-300">
                  {memberProfile?.bio || (
                    <span className="text-gray-500 italic">
                      No bio added yet.
                    </span>
                  )}
                </p>
              </div>
              {memberProfile?.github && (
                <div className="flex items-center gap-2 text-sm text-blue-400">
                  <Github className="h-4 w-4" />
                  <a
                    href={memberProfile.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate hover:underline"
                  >
                    {memberProfile.github}
                  </a>
                </div>
              )}
              {codeforcesHandle && (
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Code className="h-4 w-4 text-gray-400" />
                  <span>{codeforcesHandle}</span>
                </div>
              )}
              {skills.length > 0 && (
                <div>
                  <p className="mb-2 text-xs text-gray-500">Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((s) => (
                      <span
                        key={s}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </GlassCard>
      </div>
    </PageShell>
  );
}
