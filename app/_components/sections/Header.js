/**
 * @file Header
 * @module Header
 */

import { Suspense } from 'react';
import Navigation from './Navigation';
import Logo from '../ui/Logo';

/** Site header — logo and navigation bar. */
function Header() {
  return (
    <header className="fixed top-0 w-full z-50 bg-site-bg/70 backdrop-blur-2xl border-b border-white/5 px-8 py-5">
      <div className="mx-auto flex max-w-screen-2xl items-center justify-between">
        <Logo />
        <Suspense fallback={<div className="h-10 w-48" />}>
          <Navigation />
        </Suspense>
      </div>
    </header>
  );
}

export default Header;
