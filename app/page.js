/**
 * @file App page
 * @module AppPage
 */

import Hero from './_components/sections/Hero';
import About from './_components/sections/About';
import Events from './_components/sections/Events';
import Achievements from './_components/sections/Achievements';
import Blogs from './_components/sections/Blogs';
import Join from './_components/sections/Join';
import ScrollToTop from './_components/ui/ScrollToTop';
import ScrollProgress from './_components/ui/ScrollProgress';
import { OrganizationJsonLd, WebsiteJsonLd } from './_components/ui/JsonLd';
import { getHomePageData } from './_lib/public-actions';
import { buildMetadata, SITE_DESCRIPTION, SITE_TITLE } from './_lib/seo';

export const metadata = buildMetadata({
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  pathname: '/',
  keywords: [
    'student programming club',
    'competitive programming practice',
    'programming workshops',
    'coding mentorship',
    'ICPC preparation',
    'Bangladesh university coding club',
  ],
});

// ─── Homepage ───────────────────────────────────────────────────────────────
export default async function HomePage() {
  const {
    hero,
    about,
    events,
    featuredEvents,
    recentEvents,
    achievements,
    participations,
    featuredBlogs,
    recentBlogs,
    stats,
    joinBenefits,
    settings,
  } = await getHomePageData();

  return (
    <main className="relative min-h-screen">
      <ScrollProgress />
      {/* Structured Data */}
      <OrganizationJsonLd />
      <WebsiteJsonLd />

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <Hero data={hero} settings={settings} />

      {/* ── About ───────────────────────────────────────────────────── */}
      <About data={about} settings={settings} />

      {/* ── Events ──────────────────────────────────────────────────── */}
      <Events
        events={events}
        featuredEvents={featuredEvents}
        recentEvents={recentEvents}
        settings={settings}
      />

      {/* ── Achievements ────────────────────────────────────────────── */}
      <Achievements
        achievements={achievements}
        participations={participations}
        stats={stats}
        settings={settings}
      />

      {/* ── Blogs ───────────────────────────────────────────────────── */}
      <Blogs
        featuredBlogs={featuredBlogs}
        recentBlogs={recentBlogs}
        settings={settings}
      />

      {/* ── Join ────────────────────────────────────────────────────── */}
      <Join benefits={joinBenefits} settings={settings} />

      <ScrollToTop />
    </main>
  );
}
