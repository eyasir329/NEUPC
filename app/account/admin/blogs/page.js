/**
 * @file Admin blog management page (server component).
 * Fetches blog posts with stats for the content management UI.
 *
 * @module AdminBlogsPage
 * @access admin
 */

import { getBlogsWithStats } from '@/app/_lib/data-service';
import BlogManagementClient from './_components/BlogManagementClient';

export const metadata = { title: 'Blogs | Admin | NEUPC' };

export default async function AdminBlogsPage() {
  const { posts, stats } = await getBlogsWithStats().catch(() => ({
    posts: [],
    stats: {},
  }));

  return (
    <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
      <BlogManagementClient initialPosts={posts} stats={stats} />
    </div>
  );
}
