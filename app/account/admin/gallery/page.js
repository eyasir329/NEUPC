/**
 * @file Admin gallery management page (server component).
 * Body is shared via {@link createGalleryPage} (see executive panel).
 *
 * @module AdminGalleryPage
 * @access admin
 */

import { createGalleryPage } from '@/app/account/_lib/pages/createGalleryPage';

export const metadata = { title: 'Gallery | Admin | NEUPC' };

export default createGalleryPage('admin');
