/**
 * @file Logo
 * @module Logo
 */

import Image from 'next/image';
import Link from 'next/link';
import { Code2 } from 'lucide-react';

function Logo() {
  return (
    <Link
      href="/"
      className="group relative z-10 flex items-center gap-3 transition-all duration-300 hover:scale-105 sm:gap-4"
    >
      {/* Logo Image with Glow Effect */}
      <div className="relative">
        <div className="bg-primary-500/20 absolute inset-0 rounded-full opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-100" />
        <div className="from-primary-500 to-primary-700 shadow-soft group-hover:shadow-glow relative h-12 w-12 rounded-xl bg-linear-to-br p-2 transition-all duration-300 sm:h-14 sm:w-14 md:h-16 md:w-16">
          <Image
            src="/logo.png"
            fill
            sizes="(max-width: 640px) 48px, (max-width: 768px) 56px, 64px"
            className="object-contain p-1"
            alt="Netrokona University Programming Club logo"
            priority
          />
        </div>
      </div>

      {/* Text Content */}
      <div className="flex flex-col">
        <span className="font-heading text-primary-50 group-hover:text-secondary-400 text-lg leading-tight font-bold transition-colors duration-300 sm:text-xl md:text-2xl">
          <span className="sm:hidden">NEUPC</span>
          <span className="hidden sm:inline">NEU</span>
        </span>
        <span className="text-primary-300 group-hover:text-primary-200 hidden text-xs leading-tight transition-colors duration-300 sm:block md:text-sm">
          Programming Club
        </span>
      </div>

      {/* Optional Decorative Element */}
      <div className="text-primary-500 ml-2 hidden items-center gap-2 lg:flex">
        <div className="bg-primary-700 h-8 w-px" />
        <Code2 className="group-hover:text-secondary-400 h-5 w-5 opacity-50 transition-all duration-300 group-hover:opacity-100" />
      </div>
    </Link>
  );
}

export default Logo;
