/**
 * @file [blogId] page
 * @module [blogId]Page
 */

import { notFound } from 'next/navigation';
import {
  getPublicBlogBySlug,
  getPublicBlogsByCategory,
} from '@/app/_lib/public-actions';
import { ArticleJsonLd, BreadcrumbJsonLd } from '@/app/_components/ui/JsonLd';
import BlogDetailClient from './BlogDetailClient';
import { buildArticleMetadata } from '@/app/_lib/seo';

export async function generateMetadata({ params }) {
  const { blogId } = await params;
  const blog = await getPublicBlogBySlug(blogId);

  if (!blog) {
    return { title: 'Blog Not Found | NEUPC' };
  }

  return buildArticleMetadata(blog, `/blogs/${blogId}`);
}

export default async function Page({ params }) {
  const { blogId } = await params;
  const blog = await getPublicBlogBySlug(blogId);

  if (!blog) {
    notFound();
  }

  // Fetch related blogs from the same category, excluding current blog
  let relatedBlogs = [];
  try {
    if (blog.category) {
      const categoryBlogs = await getPublicBlogsByCategory(blog.category);
      relatedBlogs = (categoryBlogs || [])
        .filter((b) => b.id !== blog.id)
        .slice(0, 3);
    }
  } catch {
    relatedBlogs = [];
  }

  return (
    <>
      <ArticleJsonLd article={blog} />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'Blogs', url: '/blogs' },
          { name: blog.title },
        ]}
      />
      <BlogDetailClient blog={blog} relatedBlogs={relatedBlogs} />
    </>
  );
}
