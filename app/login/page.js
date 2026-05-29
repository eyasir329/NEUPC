/**
 * @file Login route page
 * @module LoginPage
 */

import { auth } from '@/app/_lib/auth/auth';
import { redirect } from 'next/navigation';
import SignInButton from '@/app/_components/ui/SignInButton';
import Link from 'next/link';
import ScrollToTop from '@/app/_components/ui/ScrollToTop';
import JoinButton from '@/app/_components/ui/JoinButton';
import { buildMetadata } from '@/app/_lib/config/seo';

export const metadata = buildMetadata({
  title: 'Login',
  description:
    'Sign in to access your NEUPC account — manage your profile, register for events, and track your competitive programming progress.',
  pathname: '/login',
  keywords: ['login', 'sign in', 'account access'],
});

async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect('/account');
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#05060B] px-4 py-24 sm:px-6">
      {/* ── Background ─────────────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0">
        <div className="grid-overlay absolute inset-0 opacity-25" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,rgba(124,92,255,0.07),transparent)]" />
        <div className="bg-neon-violet/10 absolute -top-40 -left-32 h-125 w-125 rounded-full blur-[140px]" />
        <div className="bg-neon-lime/8 absolute -right-32 -bottom-40 h-100 w-100 rounded-full blur-[120px]" />
      </div>

      {/* ── Card ───────────────────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-sm">
        {/* Eyebrow — same pattern as Hero */}
        <div className="mb-8 flex items-center gap-3">
          <span className="pulse-dot bg-neon-lime inline-block h-1.5 w-1.5 rounded-full" />
          <span className="font-mono text-[9px] font-medium tracking-[0.3em] text-zinc-500 uppercase">
            Dept of CSE · Netrokona University
          </span>
        </div>

        {/* Terminal panel */}
        <div className="void-glow-violet relative overflow-hidden rounded-sm border border-white/5 bg-[rgba(12,14,22,0.75)] p-8 backdrop-blur-2xl sm:p-10">
          {/* Corner accents */}
          <span className="bg-neon-violet/70 absolute top-0 left-0 h-6 w-px" />
          <span className="bg-neon-violet/70 absolute top-0 left-0 h-px w-6" />
          <span className="bg-neon-lime/50 absolute right-0 bottom-0 h-6 w-px" />
          <span className="bg-neon-lime/50 absolute right-0 bottom-0 h-px w-6" />

          {/* Headline — kinetic style from Hero */}
          <div className="mb-8">
            <h1 className="kinetic-headline font-heading text-4xl font-black text-white uppercase sm:text-5xl">
              SIGN
              <br />
              <span className="text-stroke-lime text-transparent">IN.</span>
            </h1>
            <p className="mt-3 font-mono text-[10px] tracking-[0.25em] text-zinc-500 uppercase">
              Programming Club · Member Portal
            </p>
          </div>

          {/* Sign in button */}
          <SignInButton />

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/5" />
            <span className="font-mono text-[9px] tracking-[0.3em] text-zinc-700 uppercase">
              OAuth_2.0
            </span>
            <div className="h-px flex-1 bg-white/5" />
          </div>

          {/* Security note */}
          <div className="border-neon-lime/10 bg-neon-lime/3 flex items-start gap-3 rounded-sm border p-3.5">
            <span className="material-symbols-outlined text-neon-lime/60 mt-0.5 shrink-0 text-[16px]">
              lock
            </span>
            <p className="font-mono text-[9px] leading-relaxed tracking-wide text-zinc-600 uppercase">
              OAuth 2.0 · No passwords stored · TLS 1.3 encrypted
            </p>
          </div>

          {/* Terms */}
          <p className="mt-5 text-center font-mono text-[9px] tracking-wide text-zinc-700">
            By signing in you agree to our{' '}
            <Link
              href="/terms"
              className="text-neon-violet/70 decoration-neon-violet/20 hover:text-neon-violet underline underline-offset-2 transition-colors"
            >
              Terms
            </Link>{' '}
            &amp;{' '}
            <Link
              href="/privacy"
              className="text-neon-violet/70 decoration-neon-violet/20 hover:text-neon-violet underline underline-offset-2 transition-colors"
            >
              Privacy
            </Link>
          </p>
        </div>

        {/* ── Footer nav ─────────────────────────────────────────── */}
        <div className="mt-7 flex flex-col items-center gap-3">
          {/* Uplink status */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="bg-neon-lime absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
                <span className="bg-neon-lime relative inline-flex h-1.5 w-1.5 rounded-full" />
              </span>
              <span className="font-mono text-[9px] tracking-[0.25em] text-zinc-700 uppercase">
                Uplink_Stable
              </span>
            </div>
            <span className="h-2.5 w-px bg-zinc-800" />
            <span className="font-mono text-[9px] tracking-[0.25em] text-zinc-700 uppercase">
              TLS_1.3
            </span>
          </div>

          {/* New user */}
          <p className="font-mono text-[10px] text-zinc-600">
            New here?{' '}
            <JoinButton
              href="/join"
              label="Join the Club →"
              className="text-neon-violet/80 hover:text-neon-lime font-bold transition-colors"
            />
          </p>

          {/* Back to home */}
          <Link
            href="/"
            className="group inline-flex items-center gap-1.5 font-mono text-[9px] tracking-widest text-zinc-700 uppercase transition-colors hover:text-zinc-400"
          >
            <svg
              className="h-3 w-3 transition-transform group-hover:-translate-x-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Return_To_Nexus
          </Link>
        </div>
      </div>

      <ScrollToTop />
    </main>
  );
}

export default LoginPage;
