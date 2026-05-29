/**
 * @file Factory for the contact-submissions page. Shared by the admin and
 *   executive panels; the only per-role difference is navigation links,
 *   supplied via `role`.
 *
 * @module account/_lib/pages/createContactSubmissionsPage
 */

import { getAllContactSubmissions } from '@/app/_lib/data-service';
import {
  getContactInfo,
  getSocialLinks,
  getFaqsData,
} from '@/app/_lib/public-actions';
import ContactSubmissionsClient from '@/app/account/_components/contact-submissions/ContactSubmissionsClient';

/**
 * Build the contact-submissions page component.
 * @param {string} role panel role, used for navigation links
 */
export function createContactSubmissionsPage(role) {
  return async function ContactSubmissionsPage() {
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
          role={role}
        />
      </div>
    );
  };
}
