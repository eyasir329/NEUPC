/**
 * @file App page
 * @module AppPage
 */

import Image from 'next/image';

import bg_img from '@/public/bg.webp';
import Hero from './_components/sections/Hero';
import About from './_components/sections/About';
import Events from './_components/sections/Events';
import Achievements from './_components/sections/Achievements';
import Blogs from './_components/sections/Blogs';
import Join from './_components/sections/Join';
import Wave from './_components/ui/Wave';
import ScrollToTop from './_components/ui/ScrollToTop';
import SectionHeader from './_components/ui/SectionHeader';
import SectionBackground from './_components/ui/SectionBackground';
import ScrollReveal from './_components/ui/ScrollReveal';
import { OrganizationJsonLd, WebsiteJsonLd } from './_components/ui/JsonLd';
import { getHomePageData } from './_lib/public-actions';
import { buildMetadata } from './_lib/seo';

export const metadata = buildMetadata({
  title: 'Home',
  description:
    'NEUPC — Netrokona University Programming Club. Join our community for competitive programming, workshops, mentorship, and ICPC preparation at Netrokona University, Bangladesh.',
  pathname: '/',
  keywords: [
    'programming community',
    'workshops',
    'mentorship',
    'ICPC preparation',
    'Netrokona University Programming Club',
  ],
});

// ─── Background Overlay Stack ───────────────────────────────────────────────
// Multiple fixed layers for depth, texture, and readability on the hero image.
function BackgroundOverlays() {
  return (
    <>
      {/* Base gradient for text contrast */}
      <div className="fixed inset-0 -z-10 bg-linear-to-b from-black/50 via-black/30 to-black/60" />

      {/* Radial vignette — draws focus to center */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          background:
            'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.7) 100%)',
        }}
      />

      {/* Diagonal color accent */}
      <div className="fixed inset-0 -z-10 bg-linear-to-br from-blue-900/20 via-transparent to-purple-900/20" />

      {/* Inset shadow vignette */}
      <div className="fixed inset-0 -z-10 shadow-[inset_0_0_100px_rgba(0,0,0,0.5)]" />

      {/* Dot grid pattern */}
      <div
        className="fixed inset-0 -z-10 opacity-30"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      />

      {/* Color wash accent */}
      <div className="fixed inset-0 -z-10 bg-linear-to-tr from-blue-600/10 via-transparent to-purple-600/10 opacity-50" />

      {/* Noise texture */}
      <div
        className="fixed inset-0 -z-10 opacity-20"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
        }}
      />
    </>
  );
}

// ─── Homepage ───────────────────────────────────────────────────────────────
export default async function HomePage() {
  const { hero, about, events, achievements, blogs, stats, joinBenefits } =
    await getHomePageData();

  return (
    <main className="relative min-h-screen">
      {/* Structured Data */}
      <OrganizationJsonLd />
      <WebsiteJsonLd />

      {/* Full-screen background image */}
      <Image
        src={bg_img}
        placeholder="blur"
        quality={80}
        sizes="100vw"
        className="fixed inset-0 -z-10 h-full w-full object-cover object-top"
        alt="NEUPC Background"
      />
      <BackgroundOverlays />

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <Hero data={hero} />
      <Wave />

      {/* ── About ───────────────────────────────────────────────────── */}
      <div className="relative overflow-x-clip pt-16 pb-4 sm:pt-20 md:pt-24 md:pb-6">
        <SectionBackground />
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badgeIcon="🎓"
            badge="Who We Are"
            title="About NEUPC"
            subtitle="Building a Strong Programming Community at Netrokona University"
          />
        </div>
        <About data={about} />
      </div>
      <Wave />

      {/* ── Events ──────────────────────────────────────────────────── */}
      <ScrollReveal animation="fade-up" duration={800}>
        <Events events={events} />
      </ScrollReveal>
      <Wave />

      {/* ── Achievements ────────────────────────────────────────────── */}
      <ScrollReveal animation="fade-up" duration={800}>
        <Achievements achievements={achievements} stats={stats} />
      </ScrollReveal>
      <Wave />

      {/* ── Blogs ───────────────────────────────────────────────────── */}
      <ScrollReveal animation="fade-up" duration={800}>
        <Blogs blogs={blogs} />
      </ScrollReveal>
      <Wave />

      {/* ── Join ────────────────────────────────────────────────────── */}
      <ScrollReveal animation="scale-up" duration={800}>
        <Join benefits={joinBenefits} />
      </ScrollReveal>
      <Wave />

      <ScrollToTop />
    </main>
  );
}
