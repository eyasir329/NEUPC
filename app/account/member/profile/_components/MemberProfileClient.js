/**
 * @file Member profile client component
 * @module MemberProfileClient
 */

'use client';

import { useState, useTransition, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  X,
  Loader2,
  ExternalLink,
  ChevronRight,
  Trophy,
  Award,
  Users,
  Settings,
  ChevronDown,
  Search,
  Pencil,
  Code2,
  Globe,
  User,
  Activity,
  Sparkles,
  GraduationCap,
  IdCard,
  BookOpen,
  Hash,
} from 'lucide-react';
import { updateMemberProfileAction } from '@/app/_lib/actions/member-profile-actions';
import Link from 'next/link';
import {
  ActionButton,
  GlassCard,
  SectionHeader,
  Pill,
  Avatar,
  StaggerList,
  GradientBar,
  EmptyState,
  StatCard,
  PageShell,
  TabBar,
  PageHeader,
} from '@/app/account/_components/ui';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

// ... PLATFORMS ...
const HANDLE_PLATFORMS = [
  {
    id: 'codeforces',
    name: 'Codeforces',
    short: 'CF',
    color: '#ef4444',
    profileUrl: (h) => `https://codeforces.com/profile/${h}`,
    logo: 'https://codeforces.org/s/0/favicon-96x96.png',
    category: 'cp',
  },
  {
    id: 'atcoder',
    name: 'AtCoder',
    short: 'AC',
    color: '#38bdf8',
    profileUrl: (h) => `https://atcoder.jp/users/${h}`,
    logo: 'https://img.atcoder.jp/assets/atcoder.png',
    category: 'cp',
  },
  {
    id: 'leetcode',
    name: 'LeetCode',
    short: 'LC',
    color: '#fbbf24',
    profileUrl: (h) => `https://leetcode.com/${h}`,
    logo: 'https://assets.leetcode.com/static_assets/public/icons/favicon-96x96.png',
    category: 'cp',
  },
  {
    id: 'codechef',
    name: 'CodeChef',
    short: 'CC',
    color: '#fb923c',
    profileUrl: (h) => `https://www.codechef.com/users/${h}`,
    logo: 'https://www.codechef.com/misc/favicon.ico',
    category: 'cp',
  },
  {
    id: 'hackerrank',
    name: 'HackerRank',
    short: 'HR',
    color: '#4ade80',
    profileUrl: (h) => `https://www.hackerrank.com/profile/${h}`,
    logo: 'https://www.hackerrank.com/wp-content/uploads/2020/05/hackerrank_cursor_favicon_480px-150x150.png',
    category: 'cp',
  },
  {
    id: 'spoj',
    name: 'SPOJ',
    short: 'SP',
    color: '#a3e635',
    profileUrl: (h) => `https://www.spoj.com/users/${h}`,
    logo: 'https://www.spoj.com/favicon.ico',
    category: 'cp',
  },
  {
    id: 'cses',
    name: 'CSES',
    short: 'CS',
    color: '#818cf8',
    profileUrl: (h) => `https://cses.fi/user/${h}`,
    logo: 'https://cses.fi/favicon.ico',
    category: 'cp',
  },
  {
    id: 'vjudge',
    name: 'VJudge',
    short: 'VJ',
    color: '#2dd4bf',
    profileUrl: (h) => `https://vjudge.net/user/${h}`,
    logo: 'https://vjudge.net/favicon.ico',
    category: 'cp',
  },
  {
    id: 'toph',
    name: 'Toph',
    short: 'TP',
    color: '#34d399',
    profileUrl: (h) => `https://toph.co/u/${h}`,
    logo: 'https://toph.co/images/favicon.png',
    category: 'cp',
  },
  {
    id: 'lightoj',
    name: 'LightOJ',
    short: 'LJ',
    color: '#22d3ee',
    profileUrl: (h) => `https://lightoj.com/user/${h}`,
    logo: 'https://static.lightoj.com/assets/loj-logo-inverted.png',
    category: 'cp',
  },
  {
    id: 'uva',
    name: 'UVA',
    short: 'UV',
    color: '#a78bfa',
    profileUrl: (h) => `https://uhunt.onlinejudge.org/id/${h}`,
    logo: 'https://onlinejudge.org/favicon.ico',
    category: 'cp',
  },
  {
    id: 'beecrowd',
    name: 'Beecrowd',
    short: 'BC',
    color: '#fde68a',
    profileUrl: (h) => `https://judge.beecrowd.com/en/profile/${h}`,
    logo: 'https://www.beecrowd.com.br/favicon.ico',
    category: 'cp',
  },
  {
    id: 'facebookhackercup',
    name: 'Meta Hacker Cup',
    short: 'MH',
    color: '#60a5fa',
    profileUrl: (h) =>
      `https://www.facebook.com/codingcompetitions/hacker-cup/`,
    logo: 'https://www.facebook.com/favicon.ico',
    category: 'cp',
  },
  {
    id: 'github',
    name: 'GitHub',
    short: 'GH',
    color: '#e2e8f0',
    profileUrl: (h) => `https://github.com/${h}`,
    logo: 'https://github.com/favicon.ico',
    category: 'social',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    short: 'LI',
    color: '#3b82f6',
    profileUrl: (h) => `https://linkedin.com/in/${h}`,
    logo: 'https://www.linkedin.com/favicon.ico',
    category: 'social',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    short: 'FB',
    color: '#60a5fa',
    profileUrl: (h) => `https://facebook.com/${h}`,
    logo: 'https://www.facebook.com/favicon.ico',
    category: 'social',
  },
  {
    id: 'x_handle',
    name: 'X (Twitter)',
    short: 'X',
    color: '#e2e8f0',
    profileUrl: (h) => `https://x.com/${h}`,
    logo: 'https://abs.twimg.com/favicons/twitter.3.ico',
    category: 'social',
  },
];

const CP_PLATFORMS = HANDLE_PLATFORMS.filter((p) => p.category === 'cp');
const SOC_PLATFORMS = HANDLE_PLATFORMS.filter((p) => p.category === 'social');

const TABS = [
  { id: 'overview', label: 'Overview', icon: User },
  { id: 'handles', label: 'Handles', icon: Code2 },
  { id: 'activity', label: 'Activity', icon: Activity },
];

function getHandleValue(profile, platform) {
  if (!profile) return null;
  if (platform.id === 'github') return profile.github ?? null;
  if (platform.id === 'linkedin') return profile.linkedin ?? null;
  if (platform.id === 'facebook') return profile.facebook ?? null;
  if (platform.id === 'x_handle') return profile.x_handle ?? null;
  return profile[`${platform.id}_handle`] ?? null;
}

function getDisplayHandle(platform, handle) {
  if (!handle) return null;
  return platform.isUrl
    ? (handle.split('/').filter(Boolean).pop() ?? handle)
    : handle;
}

function PlatformLogo({ platform, size = 16 }) {
  const [failed, setFailed] = useState(false);
  if (!platform.logo || failed) {
    return (
      <span
        className="text-[9px] leading-none font-bold"
        style={{ color: platform.color }}
      >
        {platform.short}
      </span>
    );
  }
  return (
    <img
      src={platform.logo}
      alt={platform.name}
      style={{ width: size, height: size }}
      className="rounded-sm object-contain"
      onError={() => setFailed(true)}
    />
  );
}

function HandleRow({ platform, handle }) {
  const url = handle ? platform.profileUrl(handle) : null;
  const display = getDisplayHandle(platform, handle);

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors',
        handle
          ? 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1] hover:bg-white/[0.04]'
          : 'border-white/[0.04] bg-transparent opacity-40'
      )}
    >
      <div
        className="flex size-7 shrink-0 items-center justify-center rounded-lg shadow-inner"
        style={{
          background: handle ? `${platform.color}15` : 'rgba(255,255,255,0.04)',
          border: `1px solid ${handle ? platform.color + '30' : 'rgba(255,255,255,0.06)'}`,
        }}
      >
        <PlatformLogo platform={platform} />
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'mb-0.5 text-[11.5px] leading-none font-medium',
            handle ? 'text-gray-200' : 'text-gray-500'
          )}
        >
          {platform.name}
        </p>
        {handle ? (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-mono text-[11px] leading-none underline-offset-2 hover:underline"
            style={{ color: platform.color + 'bb' }}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="max-w-[140px] truncate">{display}</span>
            <ExternalLink className="h-2.5 w-2.5 shrink-0 opacity-60" />
          </a>
        ) : (
          <p className="text-[10.5px] leading-none text-gray-600">Not linked</p>
        )}
      </div>

      {handle && (
        <div
          className="flex size-5 shrink-0 items-center justify-center rounded-full"
          style={{
            background: platform.color + '18',
            border: `1px solid ${platform.color}35`,
          }}
        >
          <Check className="h-2.5 w-2.5" style={{ color: platform.color }} />
        </div>
      )}
    </div>
  );
}

function HandleEditRow({ platform, handle }) {
  const fieldName =
    platform.id === 'github'
      ? 'github'
      : platform.id === 'linkedin'
        ? 'linkedin'
        : platform.id === 'facebook'
          ? 'facebook'
          : platform.id === 'x_handle'
            ? 'x_handle'
            : `${platform.id}_handle`;

  const placeholder = `${platform.short.toLowerCase()}_username`;

  return (
    <div className="flex items-center gap-2.5">
      <div
        className="flex size-7 shrink-0 items-center justify-center rounded-lg shadow-inner"
        style={{
          background: `${platform.color}15`,
          border: `1px solid ${platform.color}30`,
        }}
      >
        <PlatformLogo platform={platform} />
      </div>
      <div className="min-w-0 flex-1">
        <label className="mb-1 block text-[10px] font-medium text-gray-400">
          {platform.name}
        </label>
        <input
          name={fieldName}
          defaultValue={handle ?? ''}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 font-mono text-[12px] text-white placeholder-white/15 transition outline-none focus:border-violet-500/50 focus:bg-white/[0.04] focus:ring-1 focus:ring-violet-500/50"
        />
      </div>
    </div>
  );
}

function FormField({ label, name, defaultValue, placeholder, hint, textarea }) {
  const cls =
    'w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-3.5 py-2.5 text-[13px] text-white placeholder-white/20 outline-none focus:border-violet-500/50 focus:bg-white/[0.04] focus:ring-1 focus:ring-violet-500/50 transition';
  return (
    <div>
      <label className="mb-1.5 block text-[10.5px] font-semibold tracking-[0.1em] text-gray-400 uppercase">
        {label}
        {hint && (
          <span className="ml-1.5 font-normal tracking-normal text-gray-500 normal-case">
            {hint}
          </span>
        )}
      </label>
      {textarea ? (
        <textarea
          name={name}
          defaultValue={defaultValue}
          placeholder={placeholder}
          rows={3}
          className={`${cls} resize-none`}
        />
      ) : (
        <input
          name={name}
          defaultValue={defaultValue}
          placeholder={placeholder}
          className={cls}
        />
      )}
    </div>
  );
}

function FormAlert({ error, success }) {
  if (error)
    return (
      <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-[12.5px] text-red-400 shadow-inner">
        {error}
      </p>
    );
  if (success)
    return (
      <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-[12.5px] text-emerald-400 shadow-inner">
        Profile saved.
      </p>
    );
  return null;
}

function EditProfileForm({ profile, onDone }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = query.trim()
    ? CP_PLATFORMS.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase())
      )
    : CP_PLATFORMS;

  function handleSubmit(formData) {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await updateMemberProfileAction(formData);
      if (result?.error) setError(result.error);
      else {
        setSuccess(true);
        setTimeout(onDone, 1200);
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-8">
      <FormField
        label="Bio"
        name="bio"
        defaultValue={profile?.bio ?? ''}
        placeholder="Tell the club about yourself…"
        textarea
      />

      <div>
        <p className="mb-3 text-[10.5px] font-semibold tracking-[0.12em] text-gray-400 uppercase">
          Social &amp; Dev
        </p>
        <div className="space-y-3">
          {SOC_PLATFORMS.map((p) => (
            <HandleEditRow
              key={p.id}
              platform={p}
              handle={getHandleValue(profile, p)}
            />
          ))}
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[10.5px] font-semibold tracking-[0.12em] text-gray-400 uppercase">
            Competitive Programming
          </p>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3 w-3 -translate-y-1/2 text-gray-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter…"
              className="w-28 rounded-lg border border-white/[0.08] bg-white/[0.02] py-1.5 pr-2.5 pl-7 text-[11.5px] text-white placeholder-gray-500 transition outline-none focus:border-violet-500/50 focus:bg-white/[0.04]"
            />
          </div>
        </div>
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {filtered.map((p) => (
              <HandleEditRow
                key={p.id}
                platform={p}
                handle={getHandleValue(profile, p)}
              />
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-[12px] text-gray-500">
            No platforms match &ldquo;{query}&rdquo;
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="Skills"
          name="skills"
          defaultValue={(profile?.skills ?? []).join(', ')}
          placeholder="C++, Python, Algorithms…"
          hint="(comma-separated)"
        />
        <FormField
          label="Interests"
          name="interests"
          defaultValue={(profile?.interests ?? []).join(', ')}
          placeholder="CP, ML, Open Source…"
          hint="(comma-separated)"
        />
      </div>

      <FormAlert error={error} success={success} />

      <div className="flex items-center gap-2 pt-1">
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/20 px-5 py-2.5 text-[12.5px] font-semibold text-violet-300 transition hover:bg-violet-500/30 disabled:opacity-40"
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Check className="size-4" />
          )}
          Save changes
        </button>
        <button
          type="button"
          onClick={onDone}
          disabled={isPending}
          className="flex items-center gap-2 rounded-xl border border-white/[0.08] px-5 py-2.5 text-[12.5px] font-semibold text-gray-300 transition hover:bg-white/[0.04] hover:text-white disabled:opacity-40"
        >
          <X className="size-4" /> Cancel
        </button>
      </div>
    </form>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="group flex items-start justify-between gap-3 border-b border-white/[0.06] py-3.5 last:border-0">
      <div className="flex items-center gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.02]">
          <Icon className="size-4 text-gray-400 transition-colors group-hover:text-gray-300" />
        </div>
        <p className="text-[13px] font-medium text-gray-400 transition-colors group-hover:text-gray-300">
          {label}
        </p>
      </div>
      <div className="max-w-[200px] truncate text-[13px] font-medium text-white">
        {value ?? (
          <span className="font-normal text-gray-600 italic">Not set</span>
        )}
      </div>
    </div>
  );
}

function HandlesTab({ cpHandles, socialHandles, onEdit }) {
  const [showAll, setShowAll] = useState(false);
  const [query, setQuery] = useState('');

  const connected = cpHandles.filter((h) => h.handle);
  const filteredCp = query.trim()
    ? cpHandles.filter((h) =>
        h.platform.name.toLowerCase().includes(query.toLowerCase())
      )
    : cpHandles;
  const visible = showAll || query.trim() ? filteredCp : filteredCp.slice(0, 8);
  const hiddenCount = filteredCp.length - visible.length;

  return (
    <StaggerList>
      <div className="space-y-6">
        <GlassCard padding="p-0">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
            <SectionHeader
              icon={Globe}
              title="Social & Dev"
              subtitle="Your social media and development profiles"
              accent="blue"
            />
            <ActionButton icon={Pencil} onClick={onEdit} tone="ghost">
              Edit
            </ActionButton>
          </div>
          <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">
            {socialHandles.map(({ platform, handle }) => (
              <HandleRow
                key={platform.id}
                platform={platform}
                handle={handle}
              />
            ))}
          </div>
        </GlassCard>

        <GlassCard padding="p-0">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] px-5 py-4">
            <SectionHeader
              icon={Code2}
              title="Competitive Handles"
              subtitle="Your programming platform identities"
              accent="emerald"
            />
            <div className="flex items-center gap-4">
              <div className="w-32">
                <div className="mb-1.5 flex justify-between text-[10px] font-medium text-gray-400">
                  <span>Linked</span>
                  <span className="text-white">
                    {connected.length}/{cpHandles.length}
                  </span>
                </div>
                <GradientBar
                  value={connected.length}
                  max={cpHandles.length}
                  tone="emerald"
                />
              </div>
              <div className="relative hidden shrink-0 sm:block">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Filter…"
                  className="w-36 rounded-lg border border-white/[0.08] bg-white/[0.02] py-1.5 pr-3 pl-8 text-[12px] text-white placeholder-gray-500 transition outline-none focus:border-violet-500/50 focus:bg-white/[0.04]"
                />
              </div>
              <ActionButton icon={Pencil} onClick={onEdit} tone="ghost">
                Edit
              </ActionButton>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 xl:grid-cols-3">
            {visible.length > 0 ? (
              visible.map(({ platform, handle }) => (
                <HandleRow
                  key={platform.id}
                  platform={platform}
                  handle={handle}
                />
              ))
            ) : (
              <EmptyState
                icon={Search}
                title="No handles found"
                description={`Could not find any handles matching "${query}".`}
              />
            )}
          </div>
          {!query.trim() && (hiddenCount > 0 || showAll) && (
            <div className="border-t border-white/[0.06] bg-white/[0.01] px-5 py-3.5">
              <button
                onClick={() => setShowAll((v) => !v)}
                className="flex w-full items-center justify-center gap-1.5 text-[12px] font-medium text-gray-400 transition-colors hover:text-gray-200"
              >
                {showAll ? 'Show less' : `Show ${hiddenCount} more handles`}
                <ChevronDown
                  className={cn(
                    'h-4 w-4 transition-transform duration-200',
                    showAll ? 'rotate-180' : ''
                  )}
                />
              </button>
            </div>
          )}
        </GlassCard>
      </div>
    </StaggerList>
  );
}

function OverviewTab({ memberProfile, connectedCount, totalHandles, onEdit }) {
  const skills = memberProfile?.skills ?? [];
  const interests = memberProfile?.interests ?? [];
  const approved = memberProfile?.approved === true;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={IdCard}
          label="Student ID"
          value={memberProfile?.student_id ?? '—'}
          accent="violet"
          delay={0.05}
        />
        <StatCard
          icon={GraduationCap}
          label="CGPA"
          value={memberProfile?.cgpa ?? '—'}
          accent="emerald"
          delay={0.1}
        />
        <StatCard
          icon={Hash}
          label="Linked Handles"
          value={`${connectedCount}/${totalHandles}`}
          accent="cyan"
          delay={0.15}
        />
        <StatCard
          icon={BookOpen}
          label="Current Semester"
          value={memberProfile?.semester ?? '—'}
          accent="amber"
          delay={0.2}
        />
      </div>

      <GlassCard padding="p-0">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <SectionHeader
            icon={User}
            title="Professional Bio"
            subtitle="A brief introduction about your background and goals"
            accent="fuchsia"
          />
          <ActionButton icon={Pencil} onClick={onEdit} tone="ghost">
            Edit
          </ActionButton>
        </div>
        <div className="p-5">
          {memberProfile?.bio ? (
            <p className="text-[13px] leading-relaxed whitespace-pre-line text-gray-300">
              {memberProfile.bio}
            </p>
          ) : (
            <p className="text-[13px] text-gray-500 italic">
              No bio yet. Add one to introduce yourself to the community.
            </p>
          )}
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GlassCard padding="p-0">
          <div className="border-b border-white/[0.06] px-5 py-4">
            <SectionHeader
              icon={GraduationCap}
              title="Membership Details"
              subtitle="Your academic and club affiliation info"
              accent="indigo"
            />
          </div>
          <div className="px-5 py-2">
            <InfoRow
              icon={Check}
              label="Status"
              value={
                <Pill
                  tone={approved ? 'emerald' : 'amber'}
                  icon={approved ? Check : null}
                >
                  {approved ? 'Active Member' : 'Pending Approval'}
                </Pill>
              }
            />
            <InfoRow
              icon={IdCard}
              label="Student ID"
              value={memberProfile?.student_id}
            />
            <InfoRow
              icon={BookOpen}
              label="Department"
              value={memberProfile?.department}
            />
            <InfoRow
              icon={Hash}
              label="Session"
              value={memberProfile?.session}
            />
            <InfoRow
              icon={GraduationCap}
              label="Semester"
              value={memberProfile?.semester}
            />
            {memberProfile?.cgpa != null && (
              <InfoRow
                icon={Sparkles}
                label="CGPA"
                value={String(memberProfile.cgpa)}
              />
            )}
          </div>
        </GlassCard>

        <GlassCard padding="p-0">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
            <SectionHeader
              icon={Sparkles}
              title="Skills & Interests"
              subtitle="Technical expertise and areas of interest"
              accent="sky"
            />
            <ActionButton icon={Pencil} onClick={onEdit} tone="ghost">
              Edit
            </ActionButton>
          </div>
          <div className="p-5">
            {skills.length === 0 && interests.length === 0 ? (
              <EmptyState
                icon={Sparkles}
                title="No skills added"
                description="Showcase your tech stack and interests by updating your profile."
              />
            ) : (
              <div className="space-y-6">
                {skills.length > 0 && (
                  <div>
                    <p className="mb-2.5 text-[10px] font-bold tracking-widest text-gray-500 uppercase">
                      Technical Skills
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {skills.map((s) => (
                        <Pill key={s} tone="blue">
                          {s}
                        </Pill>
                      ))}
                    </div>
                  </div>
                )}
                {interests.length > 0 && (
                  <div>
                    <p className="mb-2.5 text-[10px] font-bold tracking-widest text-gray-500 uppercase">
                      Areas of Interest
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {interests.map((s) => (
                        <Pill key={s} tone="violet">
                          {s}
                        </Pill>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function ActivityTab() {
  const links = [
    {
      icon: Trophy,
      label: 'Achievements',
      desc: 'Awards, contest wins, milestones',
      href: '/account/member/achievements',
      tone: 'amber',
    },
    {
      icon: Award,
      label: 'Certificates',
      desc: 'Earned certificates and credentials',
      href: '/account/member/certificates',
      tone: 'blue',
    },
    {
      icon: Users,
      label: 'Participation',
      desc: 'Events, contests, bootcamps joined',
      href: '/account/member/participation',
      tone: 'emerald',
    },
    {
      icon: Settings,
      label: 'Account Settings',
      desc: 'Personal info, security, appearance',
      href: '/account/member/settings',
      tone: 'gray',
    },
  ];

  return (
    <StaggerList>
      <GlassCard padding="p-0">
        <div className="border-b border-white/[0.06] px-5 py-4">
          <SectionHeader
            icon={Activity}
            title="Activity & Quick Links"
            subtitle="Navigate to other parts of your profile"
            accent="violet"
          />
        </div>
        <div className="divide-y divide-white/[0.04] p-2">
          {links.map(({ icon: Icon, label, desc, href, tone }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-center gap-4 rounded-xl px-4 py-3.5 transition-colors hover:bg-white/[0.04]"
            >
              <div
                className={`flex size-10 shrink-0 items-center justify-center rounded-xl bg-${tone}-500/10 border border-${tone}-500/20 shadow-inner transition-transform group-hover:scale-105`}
              >
                <Icon className={`size-5 text-${tone}-400`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-medium text-gray-200 transition-colors group-hover:text-white">
                  {label}
                </p>
                <p className="truncate text-[12px] text-gray-500">{desc}</p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-gray-600 transition-colors group-hover:text-gray-400" />
            </Link>
          ))}
        </div>
      </GlassCard>
    </StaggerList>
  );
}

export default function MemberProfileClient({ user, memberProfile }) {
  const [editing, setEditing] = useState(false);

  const [tab, setTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('tab');
      if (p && TABS.some((t) => t.id === p)) return p;
    }
    return 'overview';
  });

  const handleTabChange = useCallback((tabId) => {
    setTab(tabId);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tabId);
      window.history.replaceState(null, '', url.toString());
    }
  }, []);

  const approved = memberProfile?.approved === true;

  const allHandles = HANDLE_PLATFORMS.map((p) => ({
    platform: p,
    handle: getHandleValue(memberProfile, p),
  }));
  const cpHandles = allHandles.filter((h) => h.platform.category === 'cp');
  const socialHandles = allHandles.filter(
    (h) => h.platform.category === 'social'
  );
  const connectedCount = allHandles.filter((h) => h.handle).length;

  const uiTabs = TABS.map((t) => ({
    value: t.id,
    label: t.label,
    icon: t.icon,
  }));

  return (
    <PageShell className="text-gray-300 selection:bg-violet-500/30">
      {/* ── Identity card ── */}
      <GlassCard padding="p-0" className="overflow-hidden">
        {/* top accent bar */}
        <div className="h-1 w-full bg-linear-to-r from-violet-500 via-purple-500 to-sky-500" />
        {/* banner */}
        <div
          className="relative h-32"
          style={{
            background:
              'radial-gradient(ellipse at 75% 50%, rgba(124,58,237,0.18) 0%, transparent 65%), radial-gradient(ellipse at 20% 60%, rgba(56,189,248,0.1) 0%, transparent 65%), linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
          }}
        >
          {!editing && (
            <div className="absolute top-4 right-4">
              <ActionButton
                icon={Pencil}
                onClick={() => setEditing(true)}
                tone="ghost"
              >
                Edit profile
              </ActionButton>
            </div>
          )}
        </div>
        {/* identity row */}
        <div className="px-6 pb-6">
          <div
            className="flex flex-wrap items-end gap-4"
            style={{ marginTop: '-44px' }}
          >
            <div className="shrink-0 rounded-full shadow-xl ring-[6px] ring-gray-900">
              <Avatar
                user={user}
                size="xl"
                src={
                  user.avatar_url &&
                  (user.avatar_url.startsWith('http') ||
                    user.avatar_url.startsWith('/api/image/'))
                    ? user.avatar_url
                    : null
                }
                name={user.full_name}
              />
            </div>
            <div className="min-w-0 flex-1 pb-1">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <h2 className="text-xl leading-tight font-bold tracking-tight text-white">
                  {user.full_name}
                </h2>
                {approved ? (
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold tracking-widest text-emerald-400 uppercase">
                    Active
                  </span>
                ) : (
                  <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold tracking-widest text-amber-400 uppercase">
                    Pending
                  </span>
                )}
              </div>
              <p className="mb-2.5 truncate text-[12px] text-gray-500">
                {user.email}
                {memberProfile?.session && (
                  <> · Session {memberProfile.session}</>
                )}
              </p>
              <div className="flex flex-wrap gap-1.5">
                <Pill tone="violet" icon={User}>
                  Member
                  {memberProfile?.semester
                    ? ` · ${memberProfile.semester}`
                    : ''}
                </Pill>
                {memberProfile?.department && (
                  <Pill tone="gray">{memberProfile.department}</Pill>
                )}
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* ── Edit form (replaces tab content) ── */}
      <AnimatePresence mode="wait" initial={false}>
        {editing ? (
          <motion.div
            key="edit"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <GlassCard>
              <div className="mb-5 flex items-center justify-between border-b border-white/[0.06] pb-5">
                <SectionHeader
                  icon={Pencil}
                  title="Edit Profile"
                  subtitle="Bio, handles, skills & interests"
                  accent="violet"
                />
                <button
                  onClick={() => setEditing(false)}
                  className="flex size-8 items-center justify-center rounded-lg border border-white/[0.06] text-gray-400 transition hover:bg-white/[0.04] hover:text-white"
                >
                  <X className="size-4" />
                </button>
              </div>
              <EditProfileForm
                profile={memberProfile}
                onDone={() => setEditing(false)}
              />
            </GlassCard>
          </motion.div>
        ) : (
          <motion.div
            key="tabs"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-6"
          >
            <TabBar tabs={uiTabs} value={tab} onChange={handleTabChange} />
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              >
                {tab === 'overview' && (
                  <OverviewTab
                    memberProfile={memberProfile}
                    connectedCount={connectedCount}
                    totalHandles={allHandles.length}
                    onEdit={() => setEditing(true)}
                  />
                )}
                {tab === 'handles' && (
                  <HandlesTab
                    cpHandles={cpHandles}
                    socialHandles={socialHandles}
                    onEdit={() => setEditing(true)}
                  />
                )}
                {tab === 'activity' && <ActivityTab />}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </PageShell>
  );
}
