/**
 * @file Executive gallery management page (server component).
 * Body is shared via {@link createGalleryPage} (see admin panel).
 *
 * @module ExecutiveGalleryPage
 * @access executive
 */

import { createGalleryPage } from '@/app/account/_lib/pages/createGalleryPage';

export const metadata = { title: 'Gallery | Executive | NEUPC' };

export default createGalleryPage('executive');
