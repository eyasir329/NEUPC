/**
 * @file Factory for the blog management page. Shared verbatim by the admin
 *   and executive panels (auth is enforced by each panel's layout).
 *
 * @module account/_lib/pages/createBlogsPage
 */

import { getBlogsWithStats } from '@/app/_lib/services/data-service';
import BlogManagementClient from '@/app/account/_components/blogs/BlogManagementClient';

/** Build the blog management page component. */
export function createBlogsPage() {
  return async function BlogsPage() {
    const { posts, stats } = await getBlogsWithStats().catch(() => ({
      posts: [],
      stats: {},
    }));

    return (
      <div className="space-y-6 px-4 pt-6 pb-8 sm:space-y-8 sm:px-6 sm:pt-8 lg:px-8">
        <BlogManagementClient initialPosts={posts} stats={stats} />
      </div>
    );
  };
}
