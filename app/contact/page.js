/**
 * @file Contact page
 * @module ContactPage
 */

import {
  getContactInfo,
  getSocialLinks,
  getFaqsData,
} from '@/app/_lib/public-actions';
import {
  FAQJsonLd,
  ContactPageJsonLd,
  BreadcrumbJsonLd,
} from '@/app/_components/ui/JsonLd';
import ContactClient from './ContactClient';
import { buildMetadata } from '@/app/_lib/seo';

export const metadata = buildMetadata({
  title: 'Contact',
  description:
    'Get in touch with NEUPC — reach out with questions, feedback, partnership requests, or collaboration ideas.',
  pathname: '/contact',
  keywords: [
    'contact',
    'get in touch',
    'feedback',
    'support',
    'FAQ',
    'frequently asked questions',
  ],
});

export default async function Page() {
  const [contactInfo, socialLinks, faqs] = await Promise.all([
    getContactInfo(),
    getSocialLinks(),
    getFaqsData(),
  ]);

  return (
    <>
      <ContactPageJsonLd />
      <BreadcrumbJsonLd
        items={[{ name: 'Home', url: '/' }, { name: 'Contact' }]}
      />
      <FAQJsonLd faqs={faqs} />
      <ContactClient
        contactInfo={contactInfo}
        socialLinks={socialLinks}
        faqs={faqs}
      />
    </>
  );
}
