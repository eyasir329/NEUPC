/**
 * @file Public user profile page.
 * Fetches the approved member profile by username and maps it to the
 * view model consumed by {@link PublicProfileClient}.
 * @module PublicProfilePage
 * @access public
 */

import { notFound } from 'next/navigation';
import { getMemberByUsername } from '@/app/_lib/services/data/users';
import PublicProfileClient from './_components/PublicProfileClient';

export const revalidate = 300;

/** Platform code → profile URL + brand color for the standings cards. */
const PLATFORM_META = {
  codeforces: { url: (h) => `https://codeforces.com/profile/${h}`, color: '#ef4444' },
  leetcode: { url: (h) => `https://leetcode.com/${h}`, color: '#f59e0b' },
  codechef: { url: (h) => `https://www.codechef.com/users/${h}`, color: '#d97706' },
  atcoder: { url: (h) => `https://atcoder.jp/users/${h}`, color: '#10b981' },
  vjudge: { url: (h) => `https://vjudge.net/user/${h}`, color: '#7c5cff' },
};

function buildProfile(member) {
  const statsByPlatform = new Map(
    (member.platformStats ?? []).map((s) => [s.platform?.code, s])
  );

  const codingProfiles = (member.handles ?? []).map((h) => {
    const code = h.platform?.code?.toLowerCase() ?? '';
    const meta = PLATFORM_META[code];
    const stats = statsByPlatform.get(h.platform?.code);
    const rating = h.current_rating
      ? `${h.current_rating}${h.rank_title ? ` ${h.rank_title}` : ''}`
      : (h.rank_title ?? '—');
    return {
      platform: h.platform?.name ?? code,
      handle: h.handle,
      url: meta ? meta.url(h.handle) : '#',
      rating,
      solved: stats?.problems_solved ?? 0,
      color: meta?.color ?? '#B6F36B',
    };
  });

  const totalContests = (member.platformStats ?? []).reduce(
    (sum, s) => sum + (s.contest_count ?? 0),
    0
  );

  return {
    name: member.user.full_name,
    username: member.username,
    avatarUrl: member.user.avatar_url || null,
    email: null,
    location: null,
    university: member.department
      ? `${member.department}${member.academic_session ? ` · ${member.academic_session}` : ''}`
      : null,
    bio: member.bio || '',
    careerObjective: member.bio || '',
    socials: {
      github: member.github || null,
      linkedin: member.linkedin || null,
      facebook: member.facebook || null,
      twitter: member.x_handle || null,
    },
    skills: member.skills ?? [],
    areasOfInterest: member.interests ?? [],
    codingProfiles,
    quickStats: {
      totalSolved: member.userStats?.total_solved ?? 0,
      currentStreak: member.userStats?.current_streak ?? 0,
      longestStreak: member.userStats?.longest_streak ?? 0,
      totalContests,
    },
    activity: {},
    education: [],
    references: [],
    extracurriculars: [],
    hobbies: [],
    projects: [],
    workExperience: [],
    research: [],
    publications: [],
    contests: [],
    offlineParticipation: [],
    achievements: [],
    certificates: [],
  };
}

export async function generateMetadata({ params }) {
  const { username } = await params;
  const member = await getMemberByUsername(username);
  if (!member) return { title: 'Profile Not Found | NEUPC' };
  return {
    title: `${member.user.full_name} | NEUPC`,
    description:
      member.bio ||
      `${member.user.full_name}'s public member profile at NEUPC.`,
  };
}

export default async function PublicProfilePage({ params }) {
  const { username } = await params;
  const member = await getMemberByUsername(username);
  if (!member) notFound();

  return <PublicProfileClient profile={buildProfile(member)} />;
}
