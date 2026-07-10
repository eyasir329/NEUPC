/**
 * @file Async footer component
 * @module AsyncFooter
 */

import { auth } from '@/app/_lib/auth/auth';
import {
  getSocialLinks,
  getContactInfo,
  getFooterData,
  getAllPublicSettings,
} from '@/app/_lib/actions/public-actions';
import Footer from './Footer';
import { ReadySignal } from '@/app/_components/ui/AppShell';

export default async function AsyncFooter() {
  const [session, social, contact, footer, settings] = await Promise.all([
    auth().catch(() => null),
    getSocialLinks(),
    getContactInfo(),
    getFooterData(),
    getAllPublicSettings(),
  ]);
  return (
    <>
      <Footer
        session={session}
        social={social}
        contact={contact}
        footer={footer}
        settings={settings}
      />
      <ReadySignal />
    </>
  );
}
