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
      className="group flex items-center gap-3 transition-opacity duration-300 hover:opacity-90"
    >
      {/* Icon block — always true brand colors, never overridden by light-mode CSS */}
      <div className="relative">
        <div
          className="absolute inset-0 rounded-full opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: 'rgba(182,243,107,0.25)' }}
        />
        <div
          className="relative h-10 w-10 overflow-hidden rounded-xl p-1.5 shadow-lg transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(182,243,107,0.4)] sm:h-11 sm:w-11"
          style={{ background: 'linear-gradient(135deg, #B6F36B 0%, #7C5CFF 100%)' }}
        >
          <Image
            src="/logo.png"
            alt="Netrokona University Programming Club logo"
            fill
            sizes="(max-width: 640px) 40px, 44px"
            className="object-contain p-0.5"
          />
        </div>
      </div>

      {/* Name */}
      <div className="flex flex-col">
        <span className="font-heading text-lg font-bold leading-tight text-slate-900 transition-colors duration-300 dark:text-white sm:text-xl">
          NEUPC
        </span>
        <span className="hidden text-[11px] leading-tight text-slate-500 transition-colors duration-300 group-hover:text-slate-700 sm:block dark:text-zinc-500 dark:group-hover:text-zinc-300">
          Programming Club
        </span>
      </div>

      {/* Divider + icon */}
      <div className="ml-1 hidden items-center gap-2 text-slate-400 lg:flex dark:text-zinc-600">
        <div className="h-7 w-px bg-slate-200 dark:bg-white/10" />
        <CodeXml
          className="h-5 w-5 opacity-50 transition-all duration-300 group-hover:opacity-100"
          style={{}}
          aria-hidden
        />
      </div>
    </Link>
  );
}

export default Logo;
