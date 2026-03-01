/**
 * @file public actions - read-only data fetchers for public pages
 * @module public-actions
 *
 * NOTE: No 'use server' directive — these are plain async functions called
 * directly from server components during SSR, avoiding unnecessary Server
 * Action POST round-trips for read-only data.
 */

import { unstable_cache } from 'next/cache';
import {
  getPublishedEvents,
  getFeaturedEvents,
  getUpcomingEvents,
  getEventBySlug,
  getEventById,
  getPublishedBlogPosts,
  getFeaturedBlogPosts,
  getBlogPostBySlug,
  getBlogPostsByCategory,
  getTrendingBlogPosts,
  getAllAchievements,
  getAchievementsByCategory,
  getAllGalleryItems,
  getFeaturedGalleryItems,
  getGalleryItemsByCategory,
  getCurrentCommittee,
  getCommitteePositions,
  getPublishedRoadmaps,
  getRoadmapBySlug,
  getSettingsByCategory,
  getSetting,
  getActiveNotices,
} from './data-service';

// ============================================================================
// Helper: Parse JSON setting value safely
// ============================================================================
function parseJsonSetting(value, fallback = []) {
  if (value === null || value === undefined) return fallback;
  // jsonb columns return already-parsed JS values (arrays, objects, strings)
  if (typeof value === 'object') return value;
  // If somehow a raw JSON string, try to parse it
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return value; // return the plain string as-is
    }
  }
  return fallback;
}

// ============================================================================
// Helper: Get settings as key-value map for a category
// ============================================================================
async function getSettingsMap(category) {
  try {
    const settings = await getSettingsByCategory(category);
    const map = {};
    if (settings) {
      settings.forEach((s) => {
        map[s.key] = s.value;
      });
    }
    return map;
  } catch {
    return {};
  }
}

// ============================================================================
// Site Settings (Hero, About, Social, Contact, Footer, Stats)
// Cached for 1 hour — these rarely change
// ============================================================================
export const getHeroData = unstable_cache(
  async () => {
    try {
      const settings = await getSettingsMap('hero');
      return {
        title: settings.hero_title || 'Programming Club',
        subtitle: settings.hero_subtitle || '(NEUPC)',
        department:
          settings.hero_department ||
          'Department of Computer Science and Engineering',
        university:
          settings.hero_university ||
          'Netrokona University, Netrokona, Bangladesh',
      };
    } catch {
      return {
        title: 'Programming Club',
        subtitle: '(NEUPC)',
        department: 'Department of Computer Science and Engineering',
        university: 'Netrokona University, Netrokona, Bangladesh',
      };
    }
  },
  ['hero-data'],
  { revalidate: 3600, tags: ['settings'] }
);

export const getAboutData = unstable_cache(
  async () => {
    try {
      const settings = await getSettingsMap('about');
      return {
        title: settings.about_title || 'Who We Are',
        description1:
          settings.about_description_1 ||
          'The Programming Club (NEUPC) of Netrokona University is an academic and skill-development organization under the Department of Computer Science and Engineering.',
        description2:
          settings.about_description_2 ||
          'The club serves as a platform where students can explore competitive programming, software development, research discussions, and emerging technologies beyond the academic syllabus.',
        mission: parseJsonSetting(settings.about_mission, []),
        vision: parseJsonSetting(settings.about_vision, []),
        whatWeDo: parseJsonSetting(settings.about_what_we_do, []),
        stats: parseJsonSetting(settings.about_stats, []),
      };
    } catch {
      return {
        title: 'Who We Are',
        description1: '',
        description2: '',
        mission: [],
        vision: [],
        whatWeDo: [],
        stats: [],
      };
    }
  },
  ['about-data'],
  { revalidate: 3600, tags: ['settings'] }
);

export const getSocialLinks = unstable_cache(
  async () => {
    try {
      const settings = await getSettingsMap('social');
      return {
        facebook: settings.social_facebook || '',
        github: settings.social_github || '',
        linkedin: settings.social_linkedin || '',
        youtube: settings.social_youtube || '',
        twitter: settings.social_twitter || '',
      };
    } catch {
      return {
        facebook: '',
        github: '',
        linkedin: '',
        youtube: '',
        twitter: '',
      };
    }
  },
  ['social-links'],
  { revalidate: 3600, tags: ['settings'] }
);

export const getContactInfo = unstable_cache(
  async () => {
    try {
      const settings = await getSettingsMap('contact');
      return {
        email: settings.contact_email || '',
        phone: settings.contact_phone || '',
        address: settings.contact_address || '',
        officeHours: settings.contact_office_hours || '',
        subjects: parseJsonSetting(settings.contact_subjects, []),
      };
    } catch {
      return {
        email: '',
        phone: '',
        address: '',
        officeHours: '',
        subjects: [],
      };
    }
  },
  ['contact-info'],
  { revalidate: 3600, tags: ['settings'] }
);

export const getFooterData = unstable_cache(
  async () => {
    try {
      const footerSettings = await getSettingsMap('footer');
      return {
        description:
          footerSettings.footer_description ||
          'Netrokona University Programming Club - Empowering students with competitive programming, web development, and cutting-edge technology skills.',
      };
    } catch {
      return {
        description:
          'Netrokona University Programming Club - Empowering students with competitive programming, web development, and cutting-edge technology skills.',
      };
    }
  },
  ['footer-data'],
  { revalidate: 3600, tags: ['settings'] }
);

// Stats are now part of about_stats in the 'about' category.
// Use getAboutData().stats instead of a separate getStatsData().

// ============================================================================
// Content Settings (FAQs, Join benefits, Developers, Tech Stack)
// Cached for 1 hour — these rarely change
// ============================================================================
export const getFaqsData = unstable_cache(
  async () => {
    try {
      const setting = await getSetting('faqs');
      return parseJsonSetting(setting?.value, []);
    } catch {
      return [];
    }
  },
  ['faqs-data'],
  { revalidate: 3600, tags: ['settings'] }
);

export const getJoinPageData = unstable_cache(
  async () => {
    try {
      const [benefitsSetting, featuresSetting] = await Promise.all([
        getSetting('join_benefits'),
        getSetting('join_features'),
      ]);
      return {
        benefits: parseJsonSetting(benefitsSetting?.value, []),
        features: parseJsonSetting(featuresSetting?.value, []),
      };
    } catch {
      return { benefits: [], features: [] };
    }
  },
  ['join-page-data'],
  { revalidate: 3600, tags: ['settings'] }
);

export const getDevelopersData = unstable_cache(
  async () => {
    try {
      const [
        coreSetting,
        contributorsSetting,
        techStackSetting,
        timelineSetting,
        githubStatsSetting,
      ] = await Promise.all([
        getSetting('developers_core'),
        getSetting('developers_contributors'),
        getSetting('tech_stack'),
        getSetting('developers_timeline'),
        getSetting('github_stats'),
      ]);
      return {
        coreDevelopers: parseJsonSetting(coreSetting?.value, []),
        contributors: parseJsonSetting(contributorsSetting?.value, []),
        techStack: parseJsonSetting(techStackSetting?.value, {}),
        timeline: parseJsonSetting(timelineSetting?.value, []),
        githubStats: parseJsonSetting(githubStatsSetting?.value, {}),
      };
    } catch {
      return {
        coreDevelopers: [],
        contributors: [],
        techStack: {},
        timeline: [],
        githubStats: {},
      };
    }
  },
  ['developers-data'],
  { revalidate: 3600, tags: ['settings'] }
);

// ============================================================================
// Events — cached for 5 minutes
// ============================================================================
export const getPublicEvents = unstable_cache(
  async () => {
    try {
      const events = await getPublishedEvents();
      return events || [];
    } catch {
      return [];
    }
  },
  ['public-events'],
  { revalidate: 300, tags: ['events'] }
);

export const getPublicFeaturedEvents = unstable_cache(
  async () => {
    try {
      const events = await getFeaturedEvents();
      return events || [];
    } catch {
      return [];
    }
  },
  ['public-featured-events'],
  { revalidate: 300, tags: ['events'] }
);

export const getPublicUpcomingEvents = unstable_cache(
  async (limit = 3) => {
    try {
      const events = await getUpcomingEvents(limit);
      return events || [];
    } catch {
      return [];
    }
  },
  ['public-upcoming-events'],
  { revalidate: 300, tags: ['events'] }
);

export const getPublicEventBySlug = unstable_cache(
  async (slug) => {
    try {
      return await getEventBySlug(slug);
    } catch {
      return null;
    }
  },
  ['public-event-by-slug'],
  { revalidate: 120, tags: ['events'] }
);

export const getPublicEventById = unstable_cache(
  async (id) => {
    try {
      return await getEventById(id);
    } catch {
      return null;
    }
  },
  ['public-event-by-id'],
  { revalidate: 120, tags: ['events'] }
);

// ============================================================================
// Blog Posts — cached for 5 minutes
// ============================================================================
export const getPublicBlogs = unstable_cache(
  async (limit) => {
    try {
      const blogs = await getPublishedBlogPosts(limit);
      return blogs || [];
    } catch {
      return [];
    }
  },
  ['public-blogs'],
  { revalidate: 300, tags: ['blogs'] }
);

export const getPublicFeaturedBlogs = unstable_cache(
  async () => {
    try {
      const blogs = await getFeaturedBlogPosts();
      return blogs || [];
    } catch {
      return [];
    }
  },
  ['public-featured-blogs'],
  { revalidate: 300, tags: ['blogs'] }
);

export const getPublicBlogBySlug = unstable_cache(
  async (slug) => {
    try {
      return await getBlogPostBySlug(slug);
    } catch {
      return null;
    }
  },
  ['public-blog-by-slug'],
  { revalidate: 120, tags: ['blogs'] }
);

export const getPublicBlogsByCategory = unstable_cache(
  async (category) => {
    try {
      const blogs = await getBlogPostsByCategory(category);
      return blogs || [];
    } catch {
      return [];
    }
  },
  ['public-blogs-by-category'],
  { revalidate: 300, tags: ['blogs'] }
);

export const getPublicTrendingBlogs = unstable_cache(
  async (limit = 5) => {
    try {
      const blogs = await getTrendingBlogPosts(limit);
      return blogs || [];
    } catch {
      return [];
    }
  },
  ['public-trending-blogs'],
  { revalidate: 300, tags: ['blogs'] }
);

// ============================================================================
// Achievements — cached for 5 minutes
// ============================================================================
export const getPublicAchievements = unstable_cache(
  async () => {
    try {
      const achievements = await getAllAchievements();
      return achievements || [];
    } catch {
      return [];
    }
  },
  ['public-achievements'],
  { revalidate: 300, tags: ['achievements'] }
);

export const getPublicAchievementsByCategory = unstable_cache(
  async (category) => {
    try {
      const achievements = await getAchievementsByCategory(category);
      return achievements || [];
    } catch {
      return [];
    }
  },
  ['public-achievements-by-category'],
  { revalidate: 300, tags: ['achievements'] }
);

// ============================================================================
// Gallery — cached for 5 minutes
// ============================================================================
export const getPublicGallery = unstable_cache(
  async () => {
    try {
      const items = await getAllGalleryItems();
      return items || [];
    } catch {
      return [];
    }
  },
  ['public-gallery'],
  { revalidate: 300, tags: ['gallery'] }
);

export const getPublicFeaturedGallery = unstable_cache(
  async () => {
    try {
      const items = await getFeaturedGalleryItems();
      return items || [];
    } catch {
      return [];
    }
  },
  ['public-featured-gallery'],
  { revalidate: 300, tags: ['gallery'] }
);

export const getPublicGalleryByCategory = unstable_cache(
  async (category) => {
    try {
      const items = await getGalleryItemsByCategory(category);
      return items || [];
    } catch {
      return [];
    }
  },
  ['public-gallery-by-category'],
  { revalidate: 300, tags: ['gallery'] }
);

// ============================================================================
// Committee — cached for 10 minutes
// ============================================================================
export const getPublicCommittee = unstable_cache(
  async () => {
    try {
      const [members, positions] = await Promise.all([
        getCurrentCommittee(),
        getCommitteePositions(),
      ]);
      return {
        members: members || [],
        positions: positions || [],
      };
    } catch {
      return { members: [], positions: [] };
    }
  },
  ['public-committee'],
  { revalidate: 600, tags: ['committee'] }
);

// ============================================================================
// Roadmaps — cached for 10 minutes
// ============================================================================
export const getPublicRoadmaps = unstable_cache(
  async () => {
    try {
      const roadmaps = await getPublishedRoadmaps();
      return roadmaps || [];
    } catch {
      return [];
    }
  },
  ['public-roadmaps'],
  { revalidate: 600, tags: ['roadmaps'] }
);

export const getPublicRoadmapBySlug = unstable_cache(
  async (slug) => {
    try {
      return await getRoadmapBySlug(slug);
    } catch {
      return null;
    }
  },
  ['public-roadmap-by-slug'],
  { revalidate: 120, tags: ['roadmaps'] }
);

// ============================================================================
// Notices — cached for 2 minutes (time-sensitive)
// ============================================================================
export const getPublicNotices = unstable_cache(
  async () => {
    try {
      const notices = await getActiveNotices();
      return notices || [];
    } catch {
      return [];
    }
  },
  ['public-notices'],
  { revalidate: 120, tags: ['notices'] }
);

// ============================================================================
// Homepage: Combined data fetch — cached for 5 minutes
// Inner calls also benefit from their own caches
// ============================================================================
export const getHomePageData = unstable_cache(
  async () => {
    try {
      const [hero, about, events, achievements, blogs, joinData] =
        await Promise.all([
          getHeroData(),
          getAboutData(),
          getPublicUpcomingEvents(3),
          getPublicAchievements(),
          getPublicBlogs(6),
          getJoinPageData(),
        ]);
      return {
        hero,
        about,
        events,
        achievements,
        blogs,
        stats: about.stats || [],
        joinBenefits: joinData.benefits,
      };
    } catch {
      return {
        hero: await getHeroData(),
        about: await getAboutData(),
        events: [],
        achievements: [],
        blogs: [],
        stats: [],
        joinBenefits: [],
      };
    }
  },
  ['homepage-data'],
  { revalidate: 300, tags: ['homepage'] }
);
