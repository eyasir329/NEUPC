/**
 * @file About page
 * @module AboutPage
 */

import AboutClient from './AboutClient';
import { getAboutData } from '@/app/_lib/public-actions';
import { buildMetadata } from '@/app/_lib/seo';
import { AboutPageJsonLd, BreadcrumbJsonLd } from '@/app/_components/ui/JsonLd';

export const metadata = buildMetadata({
  title: 'About',
  description:
    'Learn about Netrokona University Programming Club (NEUPC) — our mission, vision, activities, team, and how we build a thriving CSE community.',
  pathname: '/about',
  keywords: [
    'about NEUPC',
    'mission',
    'vision',
    'programming community',
    'CSE department',
  ],
});

export default async function Page() {
  const aboutData = await getAboutData();
  return <AboutClient data={aboutData} />;
}
