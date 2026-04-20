/**
 * @file Logo
 * @module Logo
 */

import Link from 'next/link';

function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-3 transition-opacity duration-200 hover:opacity-80"
    >
      <div className="w-1.5 h-7 bg-linear-to-b from-neon-lime to-neon-violet rounded-full" />
      <span className="font-heading text-2xl font-black tracking-tighter text-white">
        NEUPC
      </span>
    </Link>
  );
}

export default Logo;
