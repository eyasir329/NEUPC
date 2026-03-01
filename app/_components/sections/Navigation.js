/**
 * @file Navigation
 * @module Navigation
 */

import { auth } from '@/app/_lib/auth';
import Navbar from '../ui/Navbar';

async function Navigation() {
  const session = await auth();

  return <Navbar session={session} />;
}

export default Navigation;
