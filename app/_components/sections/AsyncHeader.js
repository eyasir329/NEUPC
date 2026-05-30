/**
 * @file Async header component
 * @module AsyncHeader
 */

import { auth } from '@/app/_lib/auth/auth';
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
