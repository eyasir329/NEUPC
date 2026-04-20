/**
 * @file Logo
 * @module Logo
 */

import Link from 'next/link';
import Image from 'next/image';
import { CodeXml } from 'lucide-react';

function Logo() {
  return (
    <Link
      href="/"
      className="group focus-visible:ring-primary-500/50 relative flex items-center gap-2.5 rounded-xl transition-all duration-300 focus-visible:ring-2 focus-visible:outline-none sm:gap-3"
      aria-label="Home"
    >
      {/* Left: Logo Icon Block */}
      <div className="relative flex shrink-0 items-center justify-center">
        {/* Ambient glow — sits outside the container via negative inset so it isn't clipped */}
        <div className="pointer-events-none absolute -inset-2 z-0 rounded-full opacity-0 blur-xl transition-all duration-500 ease-out group-hover:opacity-100 bg-primary-500/20 dark:bg-primary-500/25" />

        {/* Logo container */}
        <div className="relative z-10 flex h-11 w-11 overflow-hidden rounded-xl bg-white/70 shadow-sm backdrop-blur-md transition-all duration-300 ease-out group-hover:scale-[1.07] group-hover:shadow-[0_0_16px_rgba(8,131,149,0.3)] sm:h-12 sm:w-12 dark:bg-surface-2/70 dark:group-hover:bg-surface-2">
          <Image
            src="/logo.png"
            alt="NEUPC Logo"
            fill
            sizes="(max-width: 640px) 44px, 48px"
            className="object-contain p-1 transition-transform duration-500 ease-out group-hover:scale-110"
          />
        </div>
      </div>

      {/* Brand name */}
      <div className="flex flex-col justify-center">
        <span className="font-heading text-[1.1rem] leading-none font-bold tracking-tight text-slate-900 transition-colors duration-300 ease-out group-hover:text-primary-600 sm:text-xl dark:text-white dark:group-hover:text-primary-400">
          NEUPC
        </span>
        <span className="mt-0.5 hidden text-[0.6875rem] font-medium tracking-widest text-slate-500 transition-colors duration-300 ease-out group-hover:text-slate-700 md:block dark:text-slate-400 dark:group-hover:text-slate-300">
          NeU Programming Club
        </span>
      </div>

      {/* Decorative divider + icon — desktop only */}
      <div className="hidden items-center gap-3 pl-2 opacity-40 transition-all duration-300 ease-out group-hover:opacity-100 lg:flex">
        <div className="h-6 w-px rounded-full bg-slate-200 dark:bg-white/10" />
        <CodeXml
          className="h-4 w-4 text-primary-600 transition-transform duration-300 ease-out group-hover:scale-110 dark:text-primary-400"
          strokeWidth={2.5}
          aria-hidden
        />
      </div>
    </Link>
  );
}

export default Logo;
