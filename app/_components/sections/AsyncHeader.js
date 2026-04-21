import { auth } from '@/app/_lib/auth';
import Header from './Header';
import { ReadySignal } from '@/app/_components/ui/AppShell';

export default async function AsyncHeader() {
  const session = await auth();
  return (
    <>
      <Header session={session} />
      <ReadySignal />
    </>
  );
}
