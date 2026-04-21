import { auth } from '@/app/_lib/auth';
import {
  getSocialLinks,
  getContactInfo,
  getFooterData,
  getAllPublicSettings,
} from '@/app/_lib/public-actions';
import Footer from './Footer';

export default async function AsyncFooter() {
  const [session, social, contact, footer, settings] = await Promise.all([
    auth(),
    getSocialLinks(),
    getContactInfo(),
    getFooterData(),
    getAllPublicSettings(),
  ]);
  return (
    <Footer
      session={session}
      social={social}
      contact={contact}
      footer={footer}
      settings={settings}
    />
  );
}
