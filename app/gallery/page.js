/**
 * @file Gallery page
 * @module GalleryPage
 */

import { getPublicGallery } from '@/app/_lib/public-actions';
import GalleryClient from './GalleryClient';
import { buildMetadata } from '@/app/_lib/seo';
import {
  ImageGalleryJsonLd,
  BreadcrumbJsonLd,
} from '@/app/_components/ui/JsonLd';

export const metadata = buildMetadata({
  title: 'Gallery',
  description:
    'Photo gallery of NEUPC Programming Club — event highlights, workshop snapshots, contest moments, and community memories.',
  pathname: '/gallery',
  keywords: [
    'photo gallery',
    'event photos',
    'workshop images',
    'contest photos',
    'club activities',
  ],
});

export default async function Page() {
  const galleryItems = await getPublicGallery();

  return (
    <>
      <ImageGalleryJsonLd images={galleryItems} />
      <BreadcrumbJsonLd
        items={[{ name: 'Home', url: '/' }, { name: 'Gallery' }]}
      />
      <GalleryClient galleryItems={galleryItems} />
    </>
  );
}
