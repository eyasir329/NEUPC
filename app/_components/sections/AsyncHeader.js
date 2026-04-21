import { auth } from '@/app/_lib/auth';
import Header from './Header';

export default async function AsyncHeader() {
  const session = await auth();
  return <Header session={session} />;
}
