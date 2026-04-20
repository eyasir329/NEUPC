/**
 * @file Header
 * @module Header
 */

import { Suspense } from 'react';
import Navigation from './Navigation';
import Logo from '../ui/Logo';
import ScrollHeader from '../ui/ScrollHeader';

export default function Header() {
  return (
    <ScrollHeader>
      <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-8 px-8">
        <Logo />
        <Suspense fallback={<div className="h-10 w-48" />}>
          <Navigation />
        </Suspense>
      </div>
    </ScrollHeader>
  );
}
