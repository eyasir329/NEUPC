import { auth } from '@/app/_lib/auth';
import Navbar from '../features/Navbar';

async function Navigation() {
  const session = await auth();

  return <Navbar session={session} />;
}

export default Navigation;
