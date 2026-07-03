/**
 * @file Public user profile page.
 * Renders the high-fidelity redesigned public profile using pre-filled mock data.
 * @module PublicProfilePage
 * @access public
 */

import PublicProfileClient from './_components/PublicProfileClient';

export async function generateMetadata() {
  return {
    title: 'Eyasir Ahamed | NEUPC',
    description: 'Verified Executive Administrator at NEUPC. Experienced in Competitive Programming and web architectures.',
  };
}

export default async function PublicProfilePage() {
  // Bypasses database check to render the requested high-fidelity mock profile interface directly
  return <PublicProfileClient />;
}
