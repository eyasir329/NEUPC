/**
 * @file Navigation
 * @module Navigation
 */

import Navbar from '@/app/_components/ui/Navbar';

function Navigation({ session, settings }) {
  return <Navbar session={session} settings={settings} />;
}

export default Navigation;
