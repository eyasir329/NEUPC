/**
 * @file robots
 * @module robots
 */

export default function robots() {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || 'https://neupc.vercel.app';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/account/', '/api/', '/login'],
      },
      {
        userAgent: 'GPTBot',
        disallow: '/',
      },
      {
        userAgent: 'CCBot',
        disallow: '/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
