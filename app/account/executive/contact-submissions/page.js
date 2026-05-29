/**
 * @file Executive contact submissions page (server component).
 * Fetches all contact form submissions alongside the live public contact
 * page data (contactInfo, socialLinks, FAQs) for executive review.
 *
 * @module ExecutiveContactSubmissionsPage
 * @access executive
 */

import { getAllContactSubmissions } from '@/app/_lib/data-service';
import {
  getContactInfo,
  getSocialLinks,
  getFaqsData,
} from '@/app/_lib/public-actions';
import ContactSubmissionsClient from './_components/ContactSubmissionsClient';

export const metadata = { title: 'Contact Submissions | Executive | NEUPC' };

export default async function ExecutiveContactSubmissionsPage() {
  const [submissions, contactInfo, socialLinks, faqs] = await Promise.all([
    getAllContactSubmissions().catch(() => []),
    getContactInfo().catch(() => null),
    getSocialLinks().catch(() => null),
    getFaqsData().catch(() => []),
  ]);

  return (
    <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
      <ContactSubmissionsClient
        initialSubmissions={submissions}
        contactInfo={contactInfo}
        socialLinks={socialLinks}
        faqs={faqs}
      />
    </div>
  );
}
