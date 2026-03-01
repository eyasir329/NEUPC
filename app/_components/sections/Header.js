/**
 * @file Header
 * @module Header
 */

import Navigation from './Navigation';
import Logo from '../ui/Logo';

/** Site header — logo and navigation bar. */
function Header() {
  return (
    <header className="border-primary-900 border-b px-8 py-5">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Logo />
        <Navigation />
      </div>
    </header>
  );
}

export default Header;
