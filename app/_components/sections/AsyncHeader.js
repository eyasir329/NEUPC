/**
 * @file Async header component
 * @module AsyncHeader
 */

import { auth } from '@/app/_lib/auth/auth';
import { getAllPublicSettings } from '@/app/_lib/actions/public-actions';
import Header from './Header';
import { ReadySignal } from '@/app/_components/ui/AppShell';

export default async function AsyncHeader() {
  let session = null;
  try {
    session = await auth();
  } catch {
    // Render the header unauthenticated rather than throwing the whole boundary
    session = null;
  }
  const settings = await getAllPublicSettings().catch(() => ({}));
  return (
    <>
      <Header session={session} settings={settings} />
      <ReadySignal />
    </>
  );
}
