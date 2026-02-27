'use client';

import { useState, useTransition } from 'react';
import {
  User,
  Phone,
  BookOpen,
  Linkedin,
  Github,
  Code2,
  Edit2,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Briefcase,
} from 'lucide-react';
import { execUpdateProfileAction } from '@/app/_lib/executive-actions';

function Avatar({ name, size = 'lg' }) {
  const initials =
    name
      ?.split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?';
  const colors = [
    'from-blue-600',
    'from-violet-600',
    'from-emerald-600',
    'from-rose-600',
    'from-amber-600',
  ];
  const idx = name ? name.charCodeAt(0) % colors.length : 0;
  const cls = size === 'lg' ? 'h-24 w-24 text-3xl' : 'h-14 w-14 text-xl';
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${colors[idx]} to-transparent font-bold text-white ${cls}`}
    >
      {initials}
    </div>
  );
}

function Field({ icon: Icon, label, children }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/3 p-4">
      <div className="mb-1 flex items-center gap-2 text-xs font-medium tracking-wide text-gray-500 uppercase">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="text-gray-200">{children}</div>
    </div>
  );
}

export default function ExecutiveProfileClient({
  user,
  memberProfile,
  committeeInfo,
}) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState(null);
  const [formError, setFormError] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setFormError(null);
    const fd = new FormData(e.target);
    startTransition(async () => {
      const res = await execUpdateProfileAction(fd);
      if (res?.error) {
        setFormError(res.error);
        return;
      }
      showToast('Profile updated!');
      setEditing(false);
      window.location.reload();
    });
  };

  const profile = memberProfile;
  const committee = committeeInfo;

  return (
    <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">My Profile</h1>
          <p className="mt-1 text-gray-400">
            Manage your information and links
          </p>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-gray-300 transition-colors hover:bg-white/10"
          >
            <Edit2 className="h-4 w-4" /> Edit Profile
          </button>
        )}
      </div>

      {/* Profile Card */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <Avatar name={user?.full_name} />
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold text-white">
              {user?.full_name || '—'}
            </h2>
            <p className="text-gray-400">{user?.email}</p>
            {committee && (
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-sm text-blue-400">
                  <Briefcase className="h-3.5 w-3.5" />{' '}
                  {committee.position || 'Executive'}
                </span>
                {committee.department && (
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-gray-400">
                    {committee.department}
                  </span>
                )}
                {committee.tenure_year && (
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-gray-400">
                    {committee.tenure_year}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* View / Edit */}
      {editing ? (
        <form onSubmit={handleSave} className="space-y-6">
          {formError && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" /> {formError}
            </div>
          )}
          <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <h3 className="font-semibold text-white">Personal Information</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm text-gray-400">
                  Full Name
                </label>
                <input
                  name="full_name"
                  defaultValue={user?.full_name || ''}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-gray-400">
                  Phone
                </label>
                <input
                  name="phone"
                  defaultValue={profile?.phone || ''}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none"
                  placeholder="+880..."
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-gray-400">Bio</label>
              <textarea
                name="bio"
                rows={3}
                defaultValue={profile?.bio || ''}
                className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none"
                placeholder="Tell us about yourself..."
              />
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <h3 className="font-semibold text-white">
              Social & Competitive Profiles
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-sm text-gray-400">
                  <Linkedin className="h-3.5 w-3.5 text-blue-400" /> LinkedIn
                  URL
                </label>
                <input
                  name="linkedin_url"
                  defaultValue={profile?.linkedin_url || ''}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none"
                  placeholder="https://linkedin.com/in/..."
                />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-sm text-gray-400">
                  <Github className="h-3.5 w-3.5 text-gray-300" /> GitHub URL
                </label>
                <input
                  name="github_url"
                  defaultValue={profile?.github_url || ''}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none"
                  placeholder="https://github.com/..."
                />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-sm text-gray-400">
                  <Code2 className="h-3.5 w-3.5 text-cyan-400" /> Codeforces
                  Handle
                </label>
                <input
                  name="codeforces_handle"
                  defaultValue={profile?.codeforces_handle || ''}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none"
                  placeholder="cf_handle"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setFormError(null);
              }}
              className="flex items-center gap-2 rounded-xl border border-white/10 px-5 py-2.5 text-sm text-gray-400 transition-colors hover:bg-white/5"
            >
              <X className="h-4 w-4" /> Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-60"
            >
              {isPending ? (
                'Saving…'
              ) : (
                <>
                  <Save className="h-4 w-4" /> Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field icon={User} label="Full Name">
            {user?.full_name || <span className="text-gray-600">Not set</span>}
          </Field>
          <Field icon={Phone} label="Phone">
            {profile?.phone || <span className="text-gray-600">Not set</span>}
          </Field>
          <div className="sm:col-span-2">
            <Field icon={BookOpen} label="Bio">
              {profile?.bio ? (
                <p className="leading-relaxed">{profile.bio}</p>
              ) : (
                <span className="text-gray-600">No bio yet</span>
              )}
            </Field>
          </div>
          <Field icon={Linkedin} label="LinkedIn">
            {profile?.linkedin_url ? (
              <a
                href={profile.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block truncate text-blue-400 hover:underline"
              >
                {profile.linkedin_url}
              </a>
            ) : (
              <span className="text-gray-600">Not set</span>
            )}
          </Field>
          <Field icon={Github} label="GitHub">
            {profile?.github_url ? (
              <a
                href={profile.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block truncate text-blue-400 hover:underline"
              >
                {profile.github_url}
              </a>
            ) : (
              <span className="text-gray-600">Not set</span>
            )}
          </Field>
          <Field icon={Code2} label="Codeforces">
            {profile?.codeforces_handle ? (
              <a
                href={`https://codeforces.com/profile/${profile.codeforces_handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                {profile.codeforces_handle}
              </a>
            ) : (
              <span className="text-gray-600">Not set</span>
            )}
          </Field>
        </div>
      )}

      {toast && (
        <div
          className={`fixed right-6 bottom-6 z-50 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium shadow-xl ${toast.type === 'error' ? 'border-red-500/30 bg-red-500/20 text-red-300' : 'border-green-500/30 bg-green-500/20 text-green-300'}`}
        >
          {toast.type !== 'error' && <CheckCircle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
