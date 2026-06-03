/**
 * @file About client component
 * @module AboutClient
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { cn } from '@/app/_lib/utils/utils';
import CTASection from '@/app/_components/ui/CTASection';
import EmptyState from '@/app/_components/ui/EmptyState';
import HeroAmbient from '@/app/_components/ui/HeroAmbient';
import SectionHeading from '@/app/_components/ui/SectionHeading';
import {
  pageFadeUp as fadeUp,
  pageStagger as stagger,
  pageCardReveal as cardReveal,
  pageViewport as viewport,
} from '@/app/_components/motion/motion';
import {
  Rocket,
  Eye,
  Terminal,
  GraduationCap,
  Trophy,
  Users,
  Network,
  Layers,
  ShieldCheck,
  Globe,
  Award,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Star,
  Target,
  Lightbulb,
  Code,
  Heart,
  Zap,
} from 'lucide-react';

const ScrollToTop = dynamic(() => import('@/app/_components/ui/ScrollToTop'), {
  ssr: false,
});

/* ─── Icon map ─────────────────────────────────────────────────────────── */

const ICON_MAP = {
  hub: Network,
  groups: Users,
  architecture: Layers,
  rocket_launch: Rocket,
  visibility: Eye,
  terminal: Terminal,
  school: GraduationCap,
  emoji_events: Trophy,
  diversity_3: Users,
  verified_user: ShieldCheck,
  public: Globe,
  work: Briefcase,
  star: Star,
  code: Code,
  target: Target,
  heart: Heart,
  zap: Zap,
  award: Award,
  network: Network,
  layers: Layers,
  shieldcheck: ShieldCheck,
  Rocket,
  Eye,
  Terminal,
  GraduationCap,
  Trophy,
  Users,
  Network,
  Layers,
  ShieldCheck,
  Globe,
  Award,
  Briefcase,
  Star,
  Code,
  Target,
  Heart,
  Zap,
};

function resolveIcon(value, size = 20) {
  if (!value) return <Lightbulb size={size} />;
  if (typeof value !== 'string') {
    const C = value;
    return <C size={size} />;
  }
  if (/^\p{Emoji}/u.test(value) && !/^[A-Za-z]/.test(value))
    return (
      <span style={{ fontSize: size * 1.15, lineHeight: 1 }}>{value}</span>
    );
  const C = ICON_MAP[value];
  return C ? <C size={size} /> : <Lightbulb size={size} />;
}

/* ─── Icon box (shared) ─────────────────────────────────────────────────── */

function IconBox({ icon, size = 20, accent = 'lime', className }) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-xl border border-white/8 transition-transform duration-300',
        accent === 'lime'
          ? 'bg-neon-lime/10 text-neon-lime'
          : 'bg-neon-violet/10 text-neon-violet',
        className
      )}
    >
      {resolveIcon(icon, size)}
    </div>
  );
}

/* ─── Gallery slider ────────────────────────────────────────────────────── */

function GallerySlider({ images }) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef(null);
  const total = images.length;
  const next = useCallback(() => setCurrent((p) => (p + 1) % total), [total]);
  const prev = useCallback(
    () => setCurrent((p) => (p - 1 + total) % total),
    [total]
  );

  useEffect(() => {
    if (paused || total <= 1) return;
    timer.current = setInterval(next, 4000);
    return () => clearInterval(timer.current);
  }, [paused, next, total]);

  if (!total) return null;

  return (
    <div
      className="group/slider relative mt-12 overflow-hidden rounded-2xl border border-white/8"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="relative w-full overflow-hidden"
        style={{ aspectRatio: '21/9' }}
      >
        {images.map((img, i) => (
          <div
            key={img.id || i}
            className={cn(
              'absolute inset-0 transition-all duration-700 ease-in-out',
              i === current
                ? 'translate-x-0 opacity-100'
                : i === (current - 1 + total) % total
                  ? '-translate-x-full opacity-0'
                  : 'translate-x-full opacity-0'
            )}
          >
            <Image
              src={img.url}
              alt={img.caption || `Activity photo ${i + 1}`}
              fill
              className="object-cover"
              sizes="(max-width:768px) 100vw, 80vw"
              priority={i === 0}
            />
            <div className="absolute inset-0 bg-linear-to-t from-[#05060b]/70 via-transparent to-transparent" />
            {img.caption && (
              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
                <p className="font-mono text-[10px] tracking-widest text-white/70 uppercase">
                  {img.caption}
                </p>
              </div>
            )}
          </div>
        ))}
        {total > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Previous image"
              className="absolute top-1/2 left-3 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-[#05060B]/60 text-white/60 opacity-0 backdrop-blur-sm transition-all duration-300 group-hover/slider:opacity-100 hover:text-white"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={next}
              aria-label="Next image"
              className="absolute top-1/2 right-3 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-[#05060B]/60 text-white/60 opacity-0 backdrop-blur-sm transition-all duration-300 group-hover/slider:opacity-100 hover:text-white"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}
      </div>
      {total > 1 && (
        <div className="flex items-center justify-center gap-2 py-3">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                i === current
                  ? 'bg-neon-lime w-6'
                  : 'w-1.5 bg-white/20 hover:bg-white/40'
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Committee card ────────────────────────────────────────────────────── */

function CommitteeCard({ member, accent = 'lime' }) {
  const name = member.users?.full_name || 'Member';
  const position = member.committee_positions?.title || '';
  const avatar = member.custom_avatar_url || member.users?.avatar_url;
  return (
    <motion.div
      variants={cardReveal}
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <div
        className={cn(
          'group holographic-card no-lift overflow-hidden rounded-2xl',
          accent === 'lime'
            ? 'hover:border-neon-lime/30'
            : 'hover:border-neon-violet/30'
        )}
      >
        <div className="relative aspect-square overflow-hidden">
          {avatar ? (
            <Image
              src={avatar}
              alt={name}
              fill
              className="object-cover grayscale transition-all duration-700 group-hover:grayscale-0"
              sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-white/3">
              <Users size={48} className="text-zinc-700" />
            </div>
          )}
          <div className="absolute inset-0 bg-linear-to-t from-[#05060b]/90 via-transparent to-transparent" />
        </div>
        <div className="p-5">
          <h3 className="font-heading text-base font-black text-white">
            {name}
          </h3>
          {position && (
            <p
              className={cn(
                'mt-1 font-mono text-[9px] font-bold tracking-widest uppercase',
                accent === 'lime' ? 'text-neon-lime' : 'text-neon-violet'
              )}
            >
              {position}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Main export ───────────────────────────────────────────────────────── */

export default function AboutClient({
  data = {},
  settings = {},
  galleryImages = [],
  committeeMembers = [],
}) {
  const [missionExpanded, setMissionExpanded] = useState(false);

  const {
    description1 = '',
    description2 = '',
    mission = [],
    vision = [],
    whatWeDo = [],
    coreValues = [],
    orgStructure = [],
    stats = [],
    wieTitle = '',
    wieDescription = '',
    mentorshipTitle = '',
    mentorshipDescription = '',
    mentorshipAreas = [],
  } = data;

  const missionItems = Array.isArray(mission) ? mission : [];
  const visionItems = Array.isArray(vision)
    ? vision
    : typeof vision === 'string' && vision
      ? [vision]
      : [];
  const principles = Array.isArray(coreValues) ? coreValues : [];
  const orgItems = Array.isArray(orgStructure) ? orgStructure : [];
  const activities = Array.isArray(whatWeDo) ? whatWeDo : [];
  const statItems = Array.isArray(stats) ? stats : [];

  const coreExecutive = committeeMembers
    .filter((m) => m.committee_positions?.rank === 2)
    .sort(
      (a, b) =>
        (a.committee_positions?.display_order ?? 999) -
        (b.committee_positions?.display_order ?? 999)
    );

  const displayWieTitle = wieTitle || '';
  const displayWieDesc = wieDescription || '';
  const displayMentorTitle = mentorshipTitle || '';
  const displayMentorDesc = mentorshipDescription || '';
  const displayMentorAreas = Array.isArray(mentorshipAreas)
    ? mentorshipAreas
    : [];
  const hasWie = Boolean(displayWieTitle || displayWieDesc);
  const hasMentorship = Boolean(
    displayMentorTitle || displayMentorDesc || displayMentorAreas.length
  );

  const PREVIEW = 3;
  const shownMission = missionExpanded
    ? missionItems
    : missionItems.slice(0, PREVIEW);

  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#05060B] text-white">
      {/* ================================================================ */}
      {/* HERO — same pattern as EventsClient                             */}
      {/* ================================================================ */}
      <section className="relative isolate flex min-h-[75vh] items-center overflow-hidden px-4 pt-24 pb-16 sm:min-h-[80vh] sm:px-6 sm:pt-28 sm:pb-20 lg:px-8">
        <HeroAmbient />

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="mx-auto w-full max-w-7xl"
        >
          <div className="max-w-3xl space-y-6 sm:max-w-5xl sm:space-y-8">
            {/* Eyebrow */}
            <motion.div variants={fadeUp} className="flex items-center gap-3">
              <span className="pulse-dot bg-neon-lime inline-block h-1.5 w-1.5 rounded-full" />
              <span className="font-mono text-[10px] tracking-[0.3em] text-zinc-400 uppercase sm:text-[11px]">
                {settings?.about_page_badge || ''}
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={fadeUp}
              className="kinetic-headline font-heading text-[clamp(2.8rem,11vw,7rem)] leading-none font-black text-white uppercase select-none"
            >
              {(() => {
                const title = settings?.about_page_title || '';
                if (title.includes(' ')) {
                  return (
                    <>
                      {title.split(' ').slice(0, -1).join(' ')}
                      <br />
                      <span className="neon-text">
                        {title.split(' ').slice(-1)[0]}
                      </span>
                    </>
                  );
                }
                return <span className="neon-text">{title}</span>;
              })()}
            </motion.h1>

            {/* Description */}
            {description1 && (
              <motion.p
                variants={fadeUp}
                className="max-w-2xl text-sm leading-relaxed text-zinc-400 sm:max-w-4xl sm:text-base lg:text-lg"
              >
                {description1}
              </motion.p>
            )}

            {description2 && (
              <motion.p
                variants={fadeUp}
                className="max-w-2xl text-sm leading-relaxed text-zinc-400 sm:max-w-4xl sm:text-base lg:text-lg"
              >
                {description2}
              </motion.p>
            )}

            {/* Status pill */}
            {settings?.member_count && (
              <motion.div
                variants={fadeUp}
                className="border-neon-lime/20 bg-neon-lime/8 text-neon-lime inline-flex items-center gap-2.5 rounded-full border px-4 py-2 font-mono text-[10px] tracking-[0.18em] uppercase sm:px-5 sm:py-2.5 sm:text-[11px]"
              >
                <span className="pulse-dot bg-neon-lime h-1.5 w-1.5 rounded-full" />
                {`${settings.member_count} Members & Growing`}
              </motion.div>
            )}

            {/* Stats row */}
            {statItems.length > 0 && (
              <motion.div
                variants={fadeUp}
                className="border-t border-white/8 pt-6 sm:pt-8"
              >
                <div
                  className={cn(
                    'grid gap-x-6 gap-y-4',
                    statItems.length >= 4
                      ? 'grid-cols-2 sm:grid-cols-4'
                      : statItems.length === 3
                        ? 'grid-cols-3'
                        : 'grid-cols-2'
                  )}
                >
                  {statItems.map((s, i) => (
                    <div key={s.label || i} className="space-y-0.5">
                      <div
                        className={cn(
                          'font-heading text-xl font-black sm:text-2xl',
                          i === 0 ? 'text-neon-lime' : 'text-white'
                        )}
                      >
                        {s.value}
                      </div>
                      <div className="font-mono text-[9px] tracking-[0.2em] text-zinc-500 uppercase sm:text-[10px]">
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </section>

      {/* ================================================================ */}
      {/* MISSION & VISION                                                 */}
      {/* ================================================================ */}
      <section className="relative overflow-hidden py-20 sm:py-28">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="bg-neon-lime/5 absolute top-0 -left-20 h-[400px] w-[500px] rounded-full blur-[140px]" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            tag="Our Purpose · 001"
            title="Mission &"
            accent="Vision"
            description="What drives us every day and where we're headed as a community"
            color="violet"
            onMount
          />

          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="grid gap-6 lg:grid-cols-2 lg:gap-8"
          >
            {/* Mission card */}
            <motion.div
              variants={fadeUp}
              className="holographic-card group rounded-2xl p-7 sm:p-10"
            >
              <div className="mb-6 flex items-center gap-3">
                <IconBox
                  icon={Rocket}
                  size={18}
                  accent="lime"
                  className="h-10 w-10"
                />
                <h3 className="font-heading text-neon-lime text-[11px] font-bold tracking-widest uppercase sm:text-[12px]">
                  Mission
                </h3>
              </div>
              {missionItems.length > 0 ? (
                <ul className="space-y-4">
                  {shownMission.map((item, i) => {
                    const text =
                      typeof item === 'string' ? item : item?.title || '';
                    return (
                      <li
                        key={i}
                        className="flex items-start gap-3 text-zinc-400 transition-colors hover:text-zinc-200"
                      >
                        <span className="bg-neon-lime mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full" />
                        <span className="text-sm leading-relaxed sm:text-base">
                          {text}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-zinc-500">
                  Mission details coming soon.
                </p>
              )}
              {missionItems.length > PREVIEW && (
                <button
                  type="button"
                  onClick={() => setMissionExpanded((v) => !v)}
                  className="font-heading text-neon-lime mt-5 text-[10px] font-bold tracking-widest uppercase transition-opacity hover:opacity-70 sm:text-[11px]"
                >
                  {missionExpanded
                    ? '− Collapse'
                    : `+ ${missionItems.length - PREVIEW} More`}
                </button>
              )}
            </motion.div>

            {/* Vision card */}
            <motion.div
              variants={fadeUp}
              className="holographic-card group rounded-2xl p-7 sm:p-10"
            >
              <div className="mb-6 flex items-center gap-3">
                <IconBox
                  icon={Eye}
                  size={18}
                  accent="violet"
                  className="h-10 w-10"
                />
                <h3 className="font-heading text-neon-violet text-[11px] font-bold tracking-widest uppercase sm:text-[12px]">
                  Vision
                </h3>
              </div>
              {visionItems.length > 0 ? (
                <ul className="space-y-4">
                  {visionItems.map((item, i) => {
                    const text =
                      typeof item === 'string' ? item : item?.title || '';
                    return (
                      <li
                        key={i}
                        className="flex items-start gap-3 text-zinc-400 transition-colors hover:text-zinc-200"
                      >
                        <span className="bg-neon-violet mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full" />
                        <span className="text-sm leading-relaxed sm:text-base">
                          {text}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-zinc-500">
                  Vision details coming soon.
                </p>
              )}

            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* WHAT WE DO                                                       */}
      {/* ================================================================ */}
      <section className="relative overflow-hidden py-20 sm:py-28">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="bg-neon-violet/5 absolute top-1/4 -right-20 h-[400px] w-[400px] rounded-full blur-[140px]" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            tag="Activities · 002"
            title="What We"
            accent="Do"
            description="Our programs and initiatives throughout the academic year"
            color="lime"
          />

          {activities.length > 0 ? (
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
              className={cn(
                'grid gap-5',
                activities.length >= 4
                  ? 'sm:grid-cols-2 lg:grid-cols-4'
                  : activities.length === 3
                    ? 'sm:grid-cols-2 lg:grid-cols-3'
                    : 'sm:grid-cols-2'
              )}
            >
              {activities.map((card, i) => {
                const accent = i % 2 === 0 ? 'lime' : 'violet';
                const items = Array.isArray(card.items) ? card.items : [];
                return (
                  <motion.div
                    key={card.title || i}
                    variants={cardReveal}
                    className="flex"
                  >
                    <div className="holographic-card group flex h-full w-full flex-col rounded-2xl p-7">
                      <IconBox
                        icon={card.icon || card.emoji}
                        size={22}
                        accent={accent}
                        className="mb-5 h-12 w-12"
                      />
                      <h3 className="font-heading mb-3 text-lg font-black text-white">
                        {card.title}
                      </h3>
                      {(card.desc || card.description) && (
                        <p className="text-sm leading-relaxed text-zinc-500">
                          {card.desc || card.description}
                        </p>
                      )}
                      {items.length > 0 && (
                        <ul className="mt-4 space-y-2.5">
                          {items.map((it, j) => (
                            <li
                              key={j}
                              className="flex items-start gap-2.5 text-sm text-zinc-500"
                            >
                              <span
                                className={cn(
                                  'mt-[0.35rem] h-1 w-1 shrink-0 rounded-full',
                                  accent === 'lime'
                                    ? 'bg-neon-lime'
                                    : 'bg-neon-violet'
                                )}
                              />
                              {it}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <EmptyState />
          )}

          {galleryImages.length > 0 && (
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
            >
              <GallerySlider images={galleryImages} />
            </motion.div>
          )}
        </div>
      </section>

      {/* ================================================================ */}
      {/* CORE PRINCIPLES                                                  */}
      {/* ================================================================ */}
      <section className="relative overflow-hidden py-20 sm:py-28">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="bg-neon-lime/4 absolute top-1/3 -left-20 h-[400px] w-[500px] rounded-full blur-[160px]" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            tag="Foundation · 003"
            title="Core"
            accent="Principles"
            description="The values that define our community and guide every decision"
            color="lime"
          />

          {principles.length > 0 ? (
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {principles.map((p, i) => {
                const accent = p.color || (i % 2 === 0 ? 'lime' : 'violet');
                return (
                  <motion.div key={p.label || i} variants={cardReveal}>
                    <div className="holographic-card no-lift group flex items-center gap-4 rounded-2xl p-5 sm:p-6">
                      <IconBox
                        icon={p.icon}
                        size={20}
                        accent={accent}
                        className="h-11 w-11 shrink-0 group-hover:scale-110"
                      />
                      <span className="text-sm font-medium text-zinc-300 transition-colors group-hover:text-white sm:text-base">
                        {p.label}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <EmptyState />
          )}
        </div>
      </section>

      {/* ================================================================ */}
      {/* ORG STRUCTURE                                                    */}
      {/* ================================================================ */}
      <section className="relative overflow-hidden py-20 sm:py-28">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="bg-neon-violet/5 absolute top-1/3 right-0 h-[400px] w-[400px] rounded-full blur-[140px]" />
        </div>

        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            tag="Structure · 004"
            title="How We're"
            accent="Organized"
            description="A well-defined hierarchy enabling focused, effective leadership"
            color="violet"
          />

          <div className="relative">
            {/* Vertical connector line */}
            <div
              className="from-neon-lime/30 via-neon-violet/20 pointer-events-none absolute top-0 bottom-0 w-px bg-linear-to-b to-transparent"
              style={{ left: '1.85rem' }}
              aria-hidden
            />

            {orgItems.length > 0 ? (
              <motion.div
                variants={stagger}
                initial="hidden"
                whileInView="visible"
                viewport={viewport}
                className="space-y-4"
              >
                {orgItems.map((item, i) => {
                  const accent =
                    item.color || (i % 2 === 0 ? 'lime' : 'violet');
                  return (
                    <motion.div key={item.title || i} variants={fadeUp}>
                      <div className="holographic-card no-lift group relative flex items-center gap-5 rounded-xl py-5 pr-6 pl-16 md:pl-20">
                        {/* Connector dot */}
                        <div
                          className={cn(
                            'absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-[#05060b] shadow-lg transition-transform duration-300 group-hover:scale-125',
                            accent === 'lime'
                              ? 'bg-neon-lime shadow-[0_0_8px_rgba(182,243,107,0.4)]'
                              : 'bg-neon-violet shadow-[0_0_8px_rgba(124,92,255,0.4)]'
                          )}
                          style={{ left: '1.6rem' }}
                        />

                        <IconBox
                          icon={item.icon}
                          size={18}
                          accent={accent}
                          className="h-10 w-10 shrink-0"
                        />

                        <div className="min-w-0">
                          <h4 className="font-heading text-base font-black text-white sm:text-lg">
                            {item.title}
                          </h4>
                          <p className="mt-0.5 text-sm text-zinc-500">
                            {item.desc || item.description}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              <EmptyState />
            )}
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* COMMITTEE / CORE ARCHITECTS                                      */}
      {/* ================================================================ */}
      {coreExecutive.length > 0 && (
        <section className="relative overflow-hidden py-20 sm:py-28">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="bg-neon-violet/6 absolute top-0 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full blur-[160px]" />
          </div>

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              tag="Leadership · 005"
              title="Core"
              accent="Architects"
              description="The people steering NEUPC's mission and culture"
              color="violet"
            />

            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
              className={cn(
                'grid gap-5',
                coreExecutive.length >= 4
                  ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
                  : coreExecutive.length === 3
                    ? 'grid-cols-2 sm:grid-cols-3'
                    : 'grid-cols-2 sm:grid-cols-2'
              )}
            >
              {coreExecutive.map((m, i) => (
                <CommitteeCard
                  key={m.id || i}
                  member={m}
                  accent={i % 2 === 0 ? 'lime' : 'violet'}
                />
              ))}
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
              className="mt-10 text-center"
            >
              <Link
                href="/committee"
                className="font-heading hover:border-neon-violet/50 hover:text-neon-violet inline-flex min-h-11 touch-manipulation items-center gap-2 rounded-full border border-white/15 px-8 py-3.5 text-[11px] font-bold tracking-widest text-zinc-300 uppercase backdrop-blur-sm transition-all"
              >
                View Full Committee
                <span
                  aria-hidden
                  className="transition-transform group-hover:translate-x-1"
                >
                  →
                </span>
              </Link>
            </motion.div>
          </div>
        </section>
      )}

      {/* ================================================================ */}
      {/* GROWTH & INCLUSIVITY                                             */}
      {/* ================================================================ */}
      <section className="relative overflow-hidden py-20 sm:py-28">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="bg-neon-lime/4 absolute -right-20 bottom-0 h-[400px] w-[500px] rounded-full blur-[160px]" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            tag="Community · 006"
            title="Growth &"
            accent="Inclusivity"
            description="Building leaders through mentorship, diversity, and shared purpose"
            color="lime"
          />

          {hasWie || hasMentorship ? (
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
              className="grid gap-6 lg:grid-cols-2 lg:gap-8"
            >
              {/* WIE */}
              {hasWie && (
                <motion.div
                  variants={fadeUp}
                  className="holographic-card group h-full rounded-2xl p-7 sm:p-10"
                >
                  <div className="mb-6 flex items-center gap-4">
                    <IconBox
                      icon={Users}
                      size={22}
                      accent="lime"
                      className="h-12 w-12"
                    />
                    <div>
                      {displayWieTitle && (
                        <h3 className="font-heading text-xl font-black text-white sm:text-2xl">
                          {displayWieTitle}
                        </h3>
                      )}
                      <div className="bg-neon-lime mt-1.5 h-0.5 w-14 rounded-full" />
                    </div>
                  </div>
                  {displayWieDesc && (
                    <p className="text-sm leading-relaxed text-zinc-400 sm:text-base">
                      {displayWieDesc}
                    </p>
                  )}
                </motion.div>
              )}

              {/* Mentorship */}
              {hasMentorship && (
                <motion.div
                  variants={fadeUp}
                  className="holographic-card group h-full rounded-2xl p-7 sm:p-10"
                >
                  <div className="mb-6 flex items-center gap-4">
                    <IconBox
                      icon={GraduationCap}
                      size={22}
                      accent="violet"
                      className="h-12 w-12"
                    />
                    <div>
                      {displayMentorTitle && (
                        <h3 className="font-heading text-xl font-black text-white sm:text-2xl">
                          {displayMentorTitle}
                        </h3>
                      )}
                      <div className="bg-neon-violet mt-1.5 h-0.5 w-14 rounded-full" />
                    </div>
                  </div>
                  {displayMentorDesc && (
                    <p className="mb-5 text-sm text-zinc-400 sm:text-base">
                      {displayMentorDesc}
                    </p>
                  )}
                  {displayMentorAreas.length > 0 && (
                    <ul className="space-y-3">
                      {displayMentorAreas.map((area, i) => (
                        <li
                          key={i}
                          className="flex items-center gap-3 text-sm text-zinc-400 transition-colors hover:text-zinc-200 sm:text-base"
                        >
                          <span className="bg-neon-violet h-1 w-1 shrink-0 rounded-full" />
                          {area}
                        </li>
                      ))}
                    </ul>
                  )}
                </motion.div>
              )}
            </motion.div>
          ) : (
            <EmptyState />
          )}
        </div>
      </section>

      {/* ================================================================ */}
      {/* STATUS PULSE                                                     */}
      {/* ================================================================ */}
      <div className="border-y border-white/5 py-8">
        <div className="flex flex-wrap items-center justify-center gap-5 px-4 text-center">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2 w-2">
              <span className="bg-neon-lime absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
              <span className="pulse-dot bg-neon-lime relative inline-flex h-2 w-2 rounded-full" />
            </span>
            <span className="text-neon-lime font-mono text-[9px] font-bold tracking-[0.4em] uppercase">
              Club Active
            </span>
          </div>
          <div className="h-3 w-px bg-white/10" />
          <span className="font-mono text-[9px] tracking-[0.5em] text-zinc-600 uppercase">
            NEUPC · Dept of CSE · Netrokona University
          </span>
        </div>
      </div>

      {/* ================================================================ */}
      {/* CTA                                                              */}
      {/* ================================================================ */}
      <CTASection
        icon="🎯"
        title={settings?.about_page_cta_title}
        description={settings?.about_page_cta_description}
        primaryAction={{ label: 'Join the Club', href: '/join' }}
        secondaryAction={{ label: 'Meet Our Committee', href: '/committee' }}
      />

      <ScrollToTop />
    </div>
  );
}
