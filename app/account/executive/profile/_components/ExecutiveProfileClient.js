/**
 * @file Executive profile client — editable premium profile view showing
 *   personal info, member profile data, and current committee position details.
 * @module ExecutiveProfileClient
 */

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
  Calendar,
  Layers,
  Link as LinkIcon,
} from 'lucide-react';
import { execUpdateProfileAction } from '@/app/_lib/actions/executive-actions';
import {
  PageShell,
  PageHeader,
  GlassCard,
  Pill,
  ActionButton,
  Avatar,
  SectionHeader,
} from '@/app/account/_components/ui';

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
      showToast('Profile updated successfully!');
      setEditing(false);
      // Wait for revalidation then reload window
      setTimeout(() => {
        window.location.reload();
      }, 500);
    });
  };

  const profile = memberProfile || {};
  const committee = committeeInfo;

  return (
    <PageShell>
      {/* Profile Header */}
      <PageHeader
        icon={User}
        title="Executive Profile"
        subtitle="Manage your administrative credentials, personal details, and competitive programming handles"
        accent="violet"
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* ========================================================================= */}
        {/* LEFT COLUMN: IDENTITY & COMMITTEE CREDENTIALS */}
        {/* ========================================================================= */}
        <div className="space-y-6 lg:col-span-4">
          <GlassCard
            padding="p-6"
            className="flex flex-col items-center border-white/[0.08] bg-white/[0.01] text-center"
          >
            <Avatar
              name={user?.full_name ?? '?'}
              src={user?.avatar_url}
              size="lg"
              className="h-24 w-24 border-2 border-violet-500/20 text-3xl font-extrabold shadow-xl"
            />
            <h2 className="mt-4 text-xl font-bold tracking-wide text-white">
              {user?.full_name || 'Anonymous User'}
            </h2>
            <p className="mt-0.5 max-w-full truncate font-mono text-sm text-gray-500">
              {user?.email}
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              <Pill
                tone="emerald"
                className="font-mono text-[9px] font-semibold tracking-wider uppercase"
              >
                Active Executive
              </Pill>
              {user?.role === 'admin' && (
                <Pill
                  tone="rose"
                  className="font-mono text-[9px] font-semibold tracking-wider uppercase"
                >
                  Global Admin
                </Pill>
              )}
            </div>

            {/* Committee Position Summary */}
            {committee ? (
              <div className="mt-6 w-full space-y-3.5 border-t border-white/[0.05] pt-5 text-left">
                <p className="font-mono text-[10px] font-bold tracking-widest text-gray-500 uppercase">
                  Committee Credentials
                </p>

                <div className="flex items-start gap-2.5">
                  <div className="rounded-lg border border-violet-500/20 bg-violet-500/10 p-1.5 text-violet-400">
                    <Briefcase className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Designated Role</p>
                    <p className="text-sm font-semibold text-white">
                      {committee.position?.title || 'Executive Officer'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-1.5 text-blue-400">
                    <Layers className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Department</p>
                    <p className="text-sm font-semibold text-white">
                      {committee.position?.category ? (
                        <span className="capitalize">
                          {committee.position.category}
                        </span>
                      ) : (
                        'Operations / Board'
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-1.5 text-emerald-400">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Tenure Term</p>
                    <p className="font-mono text-sm text-[11px] font-semibold text-white">
                      {committee.term_start
                        ? new Date(committee.term_start).toLocaleDateString()
                        : 'N/A'}{' '}
                      —{' '}
                      {committee.term_end
                        ? new Date(committee.term_end).toLocaleDateString()
                        : 'Present'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-5 w-full border-t border-white/[0.05] pt-4 text-xs text-gray-500 italic">
                No active committee term registered in ledger.
              </div>
            )}
          </GlassCard>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: INFORMATION VIEW & EDIT FORM WORKSPACE */}
        {/* ========================================================================= */}
        <div className="space-y-6 lg:col-span-8">
          {editing ? (
            <form onSubmit={handleSave} className="space-y-6">
              {formError && (
                <div className="flex items-center gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Personal Section */}
              <GlassCard
                padding="p-6"
                className="space-y-4 border-white/[0.08] bg-white/[0.01]"
              >
                <SectionHeader
                  icon={User}
                  title="Personal Information"
                  accent="violet"
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold tracking-wider text-gray-400 uppercase">
                      Full Name
                    </label>
                    <input
                      required
                      name="full_name"
                      defaultValue={user?.full_name || ''}
                      placeholder="Your complete name"
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm text-white placeholder-gray-500 transition-colors focus:border-violet-500/40 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold tracking-wider text-gray-400 uppercase">
                      Phone Number
                    </label>
                    <input
                      name="phone"
                      defaultValue={user?.phone || ''}
                      placeholder="+8801XXXXXXXXX"
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 font-mono text-sm text-white placeholder-gray-500 transition-colors focus:border-violet-500/40 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="block text-xs font-semibold tracking-wider text-gray-400 uppercase">
                    Executive Biography
                  </label>
                  <textarea
                    name="bio"
                    rows={4}
                    defaultValue={profile.bio || ''}
                    placeholder="Provide a brief description of your professional experience, roles at club, and interests..."
                    className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm leading-relaxed text-white placeholder-gray-500 transition-colors focus:border-violet-500/40 focus:outline-none"
                  />
                </div>
              </GlassCard>

              {/* Social URLs & CP Profiles */}
              <GlassCard
                padding="p-6"
                className="space-y-4 border-white/[0.08] bg-white/[0.01]"
              >
                <SectionHeader
                  icon={LinkIcon}
                  title="Social & Platform Handles"
                  accent="blue"
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-gray-400 uppercase">
                      <Linkedin className="h-3.5 w-3.5 text-blue-400" />{' '}
                      LinkedIn URL
                    </label>
                    <input
                      name="linkedin"
                      defaultValue={profile.linkedin || ''}
                      placeholder="https://linkedin.com/in/..."
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 font-mono text-sm text-white placeholder-gray-500 transition-colors focus:border-blue-500/40 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-gray-400 uppercase">
                      <Github className="h-3.5 w-3.5 text-gray-300" /> GitHub
                      URL
                    </label>
                    <input
                      name="github"
                      defaultValue={profile.github || ''}
                      placeholder="https://github.com/..."
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 font-mono text-sm text-white placeholder-gray-500 transition-colors focus:border-gray-500/40 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-gray-400 uppercase">
                      <Code2 className="h-3.5 w-3.5 text-rose-400" /> Codeforces
                      Username
                    </label>
                    <input
                      name="codeforces_handle"
                      defaultValue={profile.codeforces_handle || ''}
                      placeholder="cf_username"
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 font-mono text-sm text-white placeholder-gray-500 transition-colors focus:border-rose-500/40 focus:outline-none"
                    />
                  </div>
                </div>
              </GlassCard>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <ActionButton
                  tone="ghost"
                  icon={X}
                  onClick={() => {
                    setEditing(false);
                    setFormError(null);
                  }}
                  type="button"
                >
                  Cancel
                </ActionButton>
                <ActionButton
                  type="submit"
                  tone="primary"
                  icon={Save}
                  disabled={isPending}
                >
                  {isPending ? 'Saving changes...' : 'Save Profile'}
                </ActionButton>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Profile Details Showcase */}
              <GlassCard
                padding="p-6"
                className="space-y-5 border-white/[0.08] bg-white/[0.01]"
              >
                <SectionHeader
                  icon={User}
                  title="Biographical Information"
                  accent="violet"
                />

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4 transition-all hover:bg-white/[0.03]">
                    <div className="mb-1.5 flex items-center gap-2 text-[10px] font-bold tracking-wider text-gray-500 uppercase">
                      <User className="h-3.5 w-3.5 text-violet-400" /> Full
                      Identity Name
                    </div>
                    <p className="text-sm font-semibold text-white">
                      {user?.full_name || 'Not set'}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4 transition-all hover:bg-white/[0.03]">
                    <div className="mb-1.5 flex items-center gap-2 text-[10px] font-bold tracking-wider text-gray-500 uppercase">
                      <Phone className="h-3.5 w-3.5 text-blue-400" /> Contact
                      Phone
                    </div>
                    <p className="font-mono text-sm font-semibold text-white">
                      {user?.phone ? (
                        user.phone
                      ) : (
                        <span className="text-gray-600 italic">
                          Not registered
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4 transition-all hover:bg-white/[0.03] sm:col-span-2">
                    <div className="mb-2 flex items-center gap-2 text-[10px] font-bold tracking-wider text-gray-500 uppercase">
                      <BookOpen className="h-3.5 w-3.5 text-emerald-400" />{' '}
                      Executive Bio / Summary
                    </div>
                    {profile.bio ? (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-300">
                        {profile.bio}
                      </p>
                    ) : (
                      <span className="text-xs text-gray-600 italic">
                        No summary description registered yet. Click 'Edit
                        Profile' to add.
                      </span>
                    )}
                  </div>
                </div>
              </GlassCard>

              {/* Linked Accounts */}
              <GlassCard
                padding="p-6"
                className="space-y-4 border-white/[0.08] bg-white/[0.01]"
              >
                <SectionHeader
                  icon={LinkIcon}
                  title="Associated Operational Links"
                  accent="blue"
                />

                <div className="grid gap-3.5 sm:grid-cols-3">
                  {/* LinkedIn */}
                  <div className="flex flex-col justify-between rounded-xl border border-white/[0.05] bg-white/[0.02] p-4 transition-all hover:bg-white/[0.03]">
                    <div>
                      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-blue-400">
                        <Linkedin className="h-4 w-4" /> LinkedIn
                      </div>
                      <p className="text-[10px] text-gray-500">
                        Professional network url
                      </p>
                    </div>
                    <div className="mt-4 truncate border-t border-white/[0.03] pt-2">
                      {profile.linkedin ? (
                        <a
                          href={profile.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block truncate font-mono text-xs font-medium text-blue-400 hover:underline"
                          title={profile.linkedin}
                        >
                          View Link
                        </a>
                      ) : (
                        <span className="text-xs text-gray-600 italic">
                          Not set
                        </span>
                      )}
                    </div>
                  </div>

                  {/* GitHub */}
                  <div className="flex flex-col justify-between rounded-xl border border-white/[0.05] bg-white/[0.02] p-4 transition-all hover:bg-white/[0.03]">
                    <div>
                      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-gray-300">
                        <Github className="h-4 w-4" /> GitHub
                      </div>
                      <p className="text-[10px] text-gray-500">
                        Source code portfolio url
                      </p>
                    </div>
                    <div className="mt-4 truncate border-t border-white/[0.03] pt-2">
                      {profile.github ? (
                        <a
                          href={profile.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block truncate font-mono text-xs font-medium text-gray-400 hover:underline"
                          title={profile.github}
                        >
                          View Profile
                        </a>
                      ) : (
                        <span className="text-xs text-gray-600 italic">
                          Not set
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Codeforces */}
                  <div className="flex flex-col justify-between rounded-xl border border-white/[0.05] bg-white/[0.02] p-4 transition-all hover:bg-white/[0.03]">
                    <div>
                      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-rose-400">
                        <Code2 className="h-4 w-4" /> Codeforces
                      </div>
                      <p className="text-[10px] text-gray-500">
                        Competitive handle link
                      </p>
                    </div>
                    <div className="mt-4 truncate border-t border-white/[0.03] pt-2">
                      {profile.codeforces_handle ? (
                        <a
                          href={`https://codeforces.com/profile/${profile.codeforces_handle}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block truncate font-mono text-xs font-medium text-rose-400 hover:underline"
                          title={profile.codeforces_handle}
                        >
                          @{profile.codeforces_handle}
                        </a>
                      ) : (
                        <span className="text-xs text-gray-600 italic">
                          Not set
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>
          )}
        </div>
      </div>

      {/* Floating Status Toasts */}
      {toast && (
        <div
          className={`animate-fade-in fixed right-6 bottom-6 z-50 flex items-center gap-2.5 rounded-xl border px-4 py-3.5 text-sm font-semibold shadow-2xl backdrop-blur-xl transition-all ${
            toast.type === 'error'
              ? 'border-red-500/30 bg-red-950/40 text-red-300'
              : 'border-green-500/30 bg-green-950/40 text-green-300'
          }`}
        >
          {toast.type !== 'error' ? (
            <CheckCircle className="h-4 w-4 text-green-400" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-400" />
          )}
          <span>{toast.msg}</span>
        </div>
      )}
    </PageShell>
  );
}
