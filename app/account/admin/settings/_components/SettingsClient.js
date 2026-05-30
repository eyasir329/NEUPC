/**
 * @file Settings client — admin website-settings editor with grouped
 *   form fields organized by functionality. No duplicate keys.
 *
 *   Sections:
 *     1. Website Content — Hero, About, Social, Contact, Footer, FAQs, Join, Developers
 *     1b. Page Content — Headings, badges, and CTAs for all public pages
 *     2. Feature Toggles — Enable/disable major platform features
 *     3. Users & Access — Registration, profiles, default role
 *     4. Applications — Membership application workflow
 *     5. Events — Event management behaviour
 *     6. Blogs — Blog publication & comments
 *     7. Notifications — Email & in-app notification settings
 *     8. Security — Account protection, session, rate limits
 *     9. Maintenance — Maintenance mode
 *
 * @module AdminSettingsClient
 */

'use client';

import {
  useState,
  useEffect,
  useTransition,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Layout,
  ToggleLeft,
  Users,
  GraduationCap,
  CalendarDays,
  BookOpen,
  Bell,
  ShieldCheck,
  Wrench,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
  Instagram,
  Facebook,
  Twitter,
  Github,
  Linkedin,
  Youtube,
  Database,
  Type,
  Search,
  X,
  Sparkles,
  RotateCcw,
  Check,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  Settings2,
  Sliders,
  Globe,
  FileText,
  Lock,
  UserPlus,
  Power,
} from 'lucide-react';
import Link from 'next/link';
import {
  saveSettingsAction,
  seedDefaultSettingsAction,
} from '@/app/_lib/actions/settings-actions';
import {
  PageShell,
  PageHeader,
  EmptyState,
  GlassCard,
} from '@/app/account/_components/ui';

// ─── Section / field definitions ─────────────────────────────────────────────

const SECTIONS = [
  // ── 1. Website Content ──────────────────────────────────────
  {
    id: 'website',
    label: 'Website Content',
    icon: Layout,
    group: 'content',
    description: 'Manage all public-facing website content',
    categories: ['hero', 'about', 'social', 'contact', 'footer', 'content'],
    fields: [
      // Hero
      { type: 'divider', label: 'Hero Section' },
      {
        key: 'hero_title',
        label: 'Club Name',
        type: 'text',
        placeholder: 'Programming Club',
        category: 'hero',
      },
      {
        key: 'hero_subtitle',
        label: 'Subtitle',
        type: 'text',
        placeholder: '(NEUPC)',
        category: 'hero',
      },
      {
        key: 'hero_department',
        label: 'Department',
        type: 'text',
        placeholder: 'Department of Computer Science and Engineering',
        category: 'hero',
      },
      {
        key: 'hero_university',
        label: 'University',
        type: 'text',
        placeholder: 'Netrokona University, Netrokona, Bangladesh',
        category: 'hero',
      },

      // About
      { type: 'divider', label: 'About Section' },
      {
        key: 'about_title',
        label: 'About Heading',
        type: 'text',
        placeholder: 'Who We Are',
        category: 'about',
      },
      {
        key: 'about_description_1',
        label: 'Description (Paragraph 1)',
        type: 'textarea',
        placeholder: 'First paragraph about the club…',
        category: 'about',
      },
      {
        key: 'about_description_2',
        label: 'Description (Paragraph 2)',
        type: 'textarea',
        placeholder: 'Second paragraph about the club…',
        category: 'about',
      },
      {
        key: 'about_mission',
        label: 'Mission Points',
        type: 'json',
        desc: 'JSON array of mission statement strings',
        category: 'about',
      },
      {
        key: 'about_vision',
        label: 'Vision Points',
        type: 'json',
        desc: 'JSON array of vision statement strings',
        category: 'about',
      },
      {
        key: 'about_what_we_do',
        label: 'What We Do',
        type: 'json',
        desc: 'JSON array of {icon, title, description} objects',
        category: 'about',
      },
      {
        key: 'about_stats',
        label: 'Club Statistics',
        type: 'json',
        desc: 'JSON array of {value, label, icon} objects',
        category: 'about',
      },
      {
        key: 'about_core_values',
        label: 'Core Values / Principles',
        type: 'json',
        desc: 'JSON array of {label, icon} objects — icon is a Lucide icon name',
        category: 'about',
      },
      {
        key: 'about_org_structure',
        label: 'Organizational Structure',
        type: 'json',
        desc: 'JSON array of {title, description, icon, color} — color: "primary" or "secondary"',
        category: 'about',
      },
      {
        key: 'about_org_financial_note',
        label: 'Org Financial Note',
        type: 'textarea',
        placeholder: 'Note shown below the org structure section…',
        category: 'about',
      },
      {
        key: 'about_skills',
        label: 'Skills / Impact Items',
        type: 'json',
        desc: 'JSON array of {icon, label} objects — icon is a Lucide icon name',
        category: 'about',
      },
      {
        key: 'about_skills_description',
        label: 'Skills Description',
        type: 'textarea',
        placeholder: 'Paragraph shown below skills items…',
        category: 'about',
      },
      {
        key: 'about_wie_title',
        label: 'WIE Title',
        type: 'text',
        placeholder: 'Women in Engineering',
        category: 'about',
      },
      {
        key: 'about_wie_description',
        label: 'WIE Description',
        type: 'textarea',
        placeholder: 'Description for Women in Engineering section…',
        category: 'about',
      },
      {
        key: 'about_mentorship_title',
        label: 'Mentorship Title',
        type: 'text',
        placeholder: 'Mentorship & Guidance',
        category: 'about',
      },
      {
        key: 'about_mentorship_description',
        label: 'Mentorship Description',
        type: 'textarea',
        placeholder: 'Intro text for the mentorship section…',
        category: 'about',
      },
      {
        key: 'about_mentorship_areas',
        label: 'Mentorship Areas',
        type: 'json',
        desc: 'JSON array of strings — each is a mentorship focus area',
        category: 'about',
      },

      // Social Media
      { type: 'divider', label: 'Social Media Links' },
      {
        key: 'social_facebook',
        label: 'Facebook',
        type: 'url',
        placeholder: 'https://facebook.com/…',
        category: 'social',
        icon: Facebook,
      },
      {
        key: 'social_github',
        label: 'GitHub',
        type: 'url',
        placeholder: 'https://github.com/…',
        category: 'social',
        icon: Github,
      },
      {
        key: 'social_linkedin',
        label: 'LinkedIn',
        type: 'url',
        placeholder: 'https://linkedin.com/…',
        category: 'social',
        icon: Linkedin,
      },
      {
        key: 'social_youtube',
        label: 'YouTube',
        type: 'url',
        placeholder: 'https://youtube.com/…',
        category: 'social',
        icon: Youtube,
      },
      {
        key: 'social_twitter',
        label: 'Twitter / X',
        type: 'url',
        placeholder: 'https://twitter.com/…',
        category: 'social',
        icon: Twitter,
      },
      {
        key: 'social_instagram',
        label: 'Instagram',
        type: 'url',
        placeholder: 'https://instagram.com/…',
        category: 'social',
        icon: Instagram,
      },

      // Contact
      { type: 'divider', label: 'Contact Information' },
      {
        key: 'contact_email',
        label: 'Contact Email',
        type: 'email',
        placeholder: 'contact@university.edu',
        category: 'contact',
      },
      {
        key: 'contact_phone',
        label: 'Contact Phone',
        type: 'text',
        placeholder: '+880 1XXX-XXXXXX',
        category: 'contact',
      },
      {
        key: 'contact_address',
        label: 'Address',
        type: 'text',
        placeholder: 'Department of CSE, University…',
        category: 'contact',
      },
      {
        key: 'contact_office_hours',
        label: 'Office Hours',
        type: 'text',
        placeholder: 'Sunday - Thursday, 10:00 AM - 4:00 PM',
        category: 'contact',
      },
      {
        key: 'contact_subjects',
        label: 'Contact Form Subjects',
        type: 'json',
        desc: 'JSON array of subject option strings',
        category: 'contact',
      },

      // Footer
      { type: 'divider', label: 'Footer' },
      {
        key: 'footer_description',
        label: 'Footer Description',
        type: 'textarea',
        placeholder: 'Short description shown in footer…',
        category: 'footer',
      },

      // FAQs
      { type: 'divider', label: 'FAQs' },
      {
        key: 'faqs',
        label: 'FAQ Items',
        type: 'json',
        desc: 'JSON array of {question, answer} objects',
        category: 'content',
      },

      // Join Page
      { type: 'divider', label: 'Join Page' },
      {
        key: 'join_benefits',
        label: 'Membership Benefits',
        type: 'json',
        desc: 'JSON array of {icon, title, description} objects',
        category: 'content',
      },
      {
        key: 'join_features',
        label: 'Public Account Features',
        type: 'json',
        desc: 'JSON array of {icon, title, description} objects',
        category: 'content',
      },

      // Developers Page
      { type: 'divider', label: 'Developers Page' },
      {
        key: 'developers_core',
        label: 'Core Developers',
        type: 'json',
        desc: 'JSON array of {name, role, bio, stack, github, linkedin, portfolio, photo}',
        category: 'content',
      },
      {
        key: 'developers_contributors',
        label: 'Contributors',
        type: 'json',
        desc: 'JSON array of {name, role, contribution, github}',
        category: 'content',
      },
      {
        key: 'tech_stack',
        label: 'Technology Stack',
        type: 'json',
        desc: 'JSON array of {category, items: [{name, description, icon}]}',
        category: 'content',
      },
      {
        key: 'developers_timeline',
        label: 'Development Timeline',
        type: 'json',
        desc: 'JSON array of {year, title, description, status}',
        category: 'content',
      },
      {
        key: 'github_stats',
        label: 'GitHub Statistics',
        type: 'json',
        desc: 'JSON object: {commits, contributors, stars, forks}',
        category: 'content',
      },
    ],
  },

  // ── 1b. Page Content ───────────────────────────────────────
  {
    id: 'pages',
    label: 'Page Content',
    icon: Type,
    description:
      'Customize headings, badges, and call-to-action text across all public pages',
    categories: ['page_content'],
    fields: [
      // Hero
      { type: 'divider', label: 'Hero Section' },
      {
        key: 'hero_welcome_text',
        label: 'Welcome Text',
        type: 'text',
        placeholder: 'Welcome to',
        category: 'page_content',
        desc: 'Text shown before the site name in the hero',
      },
      {
        key: 'hero_join_label',
        label: 'Join Button Label',
        type: 'text',
        placeholder: 'Join Now',
        category: 'page_content',
      },
      {
        key: 'hero_learn_more_label',
        label: 'Learn More Button Label',
        type: 'text',
        placeholder: 'Learn More',
        category: 'page_content',
      },

      // Homepage — About
      { type: 'divider', label: 'Homepage — About Section' },
      {
        key: 'homepage_about_badge',
        label: 'Badge Text',
        type: 'text',
        placeholder: 'About Us',
        category: 'page_content',
      },
      {
        key: 'homepage_about_title',
        label: 'Title',
        type: 'text',
        placeholder: 'Get to Know NEUPC',
        category: 'page_content',
      },
      {
        key: 'homepage_about_subtitle',
        label: 'Subtitle',
        type: 'textarea',
        placeholder:
          'Learn about our mission, vision, and the amazing community…',
        category: 'page_content',
      },
      {
        key: 'homepage_about_cta',
        label: 'CTA Button Text',
        type: 'text',
        placeholder: 'Learn More About Us',
        category: 'page_content',
      },

      // Homepage — Events
      { type: 'divider', label: 'Homepage — Events Section' },
      {
        key: 'homepage_events_badge',
        label: 'Badge Text',
        type: 'text',
        placeholder: 'Upcoming Events',
        category: 'page_content',
      },
      {
        key: 'homepage_events_title',
        label: 'Title',
        type: 'text',
        placeholder: 'Recent Events',
        category: 'page_content',
      },
      {
        key: 'homepage_events_subtitle',
        label: 'Subtitle',
        type: 'textarea',
        placeholder: 'Join our upcoming workshops, contests, and tech talks…',
        category: 'page_content',
      },
      {
        key: 'homepage_events_cta',
        label: 'CTA Button Text',
        type: 'text',
        placeholder: 'View All Events',
        category: 'page_content',
      },
      {
        key: 'events_empty_message',
        label: 'Empty State Message',
        type: 'text',
        placeholder: 'No upcoming events at the moment. Check back soon!',
        category: 'page_content',
      },

      // Homepage — Achievements
      { type: 'divider', label: 'Homepage — Achievements Section' },
      {
        key: 'homepage_achievements_badge',
        label: 'Badge Text',
        type: 'text',
        placeholder: 'Our Achievements',
        category: 'page_content',
      },
      {
        key: 'homepage_achievements_title',
        label: 'Title',
        type: 'text',
        placeholder: 'Excellence in Action',
        category: 'page_content',
      },
      {
        key: 'homepage_achievements_subtitle',
        label: 'Subtitle',
        type: 'textarea',
        placeholder:
          'Celebrating our journey of competitive programming success…',
        category: 'page_content',
      },
      {
        key: 'homepage_achievements_cta',
        label: 'CTA Button Text',
        type: 'text',
        placeholder: 'View All Achievements',
        category: 'page_content',
      },
      {
        key: 'achievements_empty_message',
        label: 'Empty State Message',
        type: 'text',
        placeholder: 'No achievements to display yet.',
        category: 'page_content',
      },

      // Homepage — Blog
      { type: 'divider', label: 'Homepage — Blog Section' },
      {
        key: 'homepage_blogs_badge',
        label: 'Badge Text',
        type: 'text',
        placeholder: 'Latest Articles & Resources',
        category: 'page_content',
      },
      {
        key: 'homepage_blogs_title',
        label: 'Title',
        type: 'text',
        placeholder: 'Knowledge Base',
        category: 'page_content',
      },
      {
        key: 'homepage_blogs_subtitle',
        label: 'Subtitle',
        type: 'textarea',
        placeholder: 'Explore tutorials, contest insights, career guidance…',
        category: 'page_content',
      },
      {
        key: 'homepage_blogs_cta',
        label: 'CTA Button Text',
        type: 'text',
        placeholder: 'Explore All Articles',
        category: 'page_content',
      },
      {
        key: 'blogs_empty_message',
        label: 'Empty State Message',
        type: 'text',
        placeholder: 'No blog posts available yet. Check back soon!',
        category: 'page_content',
      },

      // Homepage — Join
      { type: 'divider', label: 'Homepage — Join Section' },
      {
        key: 'homepage_join_badge',
        label: 'Badge Text',
        type: 'text',
        placeholder: 'Join Our Community',
        category: 'page_content',
      },
      {
        key: 'homepage_join_title',
        label: 'Title',
        type: 'text',
        placeholder: 'Become a Member',
        category: 'page_content',
      },
      {
        key: 'homepage_join_subtitle',
        label: 'Subtitle',
        type: 'textarea',
        placeholder: 'Join NEUPC and unlock your potential…',
        category: 'page_content',
      },
      {
        key: 'homepage_join_cta_title',
        label: 'CTA Title',
        type: 'text',
        placeholder: 'Ready to Start Your Journey?',
        category: 'page_content',
      },
      {
        key: 'homepage_join_cta_description',
        label: 'CTA Description',
        type: 'textarea',
        placeholder: 'Join hundreds of students who are already part of NEUPC…',
        category: 'page_content',
      },
      {
        key: 'homepage_join_cta_button',
        label: 'CTA Button Text',
        type: 'text',
        placeholder: 'Join NEUPC Now',
        category: 'page_content',
      },

      // Footer
      { type: 'divider', label: 'Footer' },
      {
        key: 'site_name_full',
        label: 'Full Site Name',
        type: 'text',
        placeholder: 'Netrokona University Programming Club',
        category: 'page_content',
      },
      {
        key: 'footer_developer_credit',
        label: 'Developer Credit',
        type: 'text',
        placeholder: 'Made with ❤️ by NEUPC Developers',
        category: 'page_content',
      },

      // About Page
      { type: 'divider', label: 'About Page' },
      {
        key: 'about_page_badge',
        label: 'Hero Badge',
        type: 'text',
        placeholder: '🎓 Student Organization',
        category: 'page_content',
      },
      {
        key: 'about_page_title',
        label: 'Hero Title',
        type: 'text',
        placeholder: 'About NEUPC',
        category: 'page_content',
      },
      {
        key: 'about_page_subtitle',
        label: 'Hero Subtitle',
        type: 'text',
        placeholder: 'Netrokona University Programming Club',
        category: 'page_content',
      },
      {
        key: 'about_page_department',
        label: 'Department Name',
        type: 'text',
        placeholder: 'Department of Computer Science and Engineering',
        category: 'page_content',
      },
      {
        key: 'about_page_cta_title',
        label: 'CTA Title',
        type: 'text',
        placeholder: 'Ready to Join Us?',
        category: 'page_content',
      },
      {
        key: 'about_page_cta_description',
        label: 'CTA Description',
        type: 'textarea',
        placeholder: 'Become part of a community dedicated to excellence…',
        category: 'page_content',
      },

      // Contact Page
      { type: 'divider', label: 'Contact Page' },
      {
        key: 'contact_page_badge',
        label: 'Hero Badge',
        type: 'text',
        placeholder: 'Contact Us',
        category: 'page_content',
      },
      {
        key: 'contact_page_title',
        label: 'Hero Title',
        type: 'text',
        placeholder: 'Get in Touch',
        category: 'page_content',
      },
      {
        key: 'contact_page_description',
        label: 'Hero Description',
        type: 'textarea',
        placeholder: 'Have questions, ideas, or collaboration proposals?…',
        category: 'page_content',
      },
      {
        key: 'contact_page_cta_title',
        label: 'CTA Title',
        type: 'text',
        placeholder: 'Ready to Get Started?',
        category: 'page_content',
      },
      {
        key: 'contact_page_cta_description',
        label: 'CTA Description',
        type: 'textarea',
        placeholder: "Whether you're a student looking to join…",
        category: 'page_content',
      },

      // Events Page
      { type: 'divider', label: 'Events Page' },
      {
        key: 'events_page_badge',
        label: 'Hero Badge',
        type: 'text',
        placeholder: 'Upcoming Events',
        category: 'page_content',
      },
      {
        key: 'events_page_title',
        label: 'Hero Title',
        type: 'text',
        placeholder: 'Events & Activities',
        category: 'page_content',
      },
      {
        key: 'events_page_description',
        label: 'Hero Description',
        type: 'textarea',
        placeholder: 'Join us for exciting programming contests, workshops…',
        category: 'page_content',
      },
      {
        key: 'events_page_subtitle',
        label: 'Hero Subtitle',
        type: 'textarea',
        placeholder: 'From ICPC preparation to beginner-friendly sessions…',
        category: 'page_content',
      },
      {
        key: 'events_page_cta_title',
        label: 'CTA Title',
        type: 'text',
        placeholder: "Don't Miss Out!",
        category: 'page_content',
      },
      {
        key: 'events_page_cta_description',
        label: 'CTA Description',
        type: 'textarea',
        placeholder: 'Stay updated with our latest events and activities…',
        category: 'page_content',
      },

      // Achievements Page
      { type: 'divider', label: 'Achievements Page' },
      {
        key: 'achievements_page_badge',
        label: 'Hero Badge',
        type: 'text',
        placeholder: 'Excellence & Achievements',
        category: 'page_content',
      },
      {
        key: 'achievements_page_title',
        label: 'Hero Title',
        type: 'text',
        placeholder: 'Our Achievements',
        category: 'page_content',
      },
      {
        key: 'achievements_page_description',
        label: 'Hero Description',
        type: 'textarea',
        placeholder: 'Celebrating excellence in competitive programming…',
        category: 'page_content',
      },
      {
        key: 'achievements_page_cta_title',
        label: 'CTA Title',
        type: 'text',
        placeholder: 'Ready to Make Your Mark?',
        category: 'page_content',
      },
      {
        key: 'achievements_page_cta_description',
        label: 'CTA Description',
        type: 'textarea',
        placeholder: 'Join NEUPC today and be part of our legacy…',
        category: 'page_content',
      },

      // Blogs Page
      { type: 'divider', label: 'Blogs Page' },
      {
        key: 'blogs_page_badge',
        label: 'Hero Badge',
        type: 'text',
        placeholder: 'Knowledge Hub',
        category: 'page_content',
      },
      {
        key: 'blogs_page_title',
        label: 'Hero Title',
        type: 'text',
        placeholder: 'Programming Insights & Updates',
        category: 'page_content',
      },
      {
        key: 'blogs_page_description',
        label: 'Hero Description',
        type: 'textarea',
        placeholder: 'Explore tutorials, contest insights, club updates…',
        category: 'page_content',
      },

      // Gallery Page
      { type: 'divider', label: 'Gallery Page' },
      {
        key: 'gallery_page_badge',
        label: 'Hero Badge',
        type: 'text',
        placeholder: 'Photo Gallery',
        category: 'page_content',
      },
      {
        key: 'gallery_page_title',
        label: 'Hero Title',
        type: 'text',
        placeholder: 'Moments That Define Us',
        category: 'page_content',
      },
      {
        key: 'gallery_page_description',
        label: 'Hero Description',
        type: 'textarea',
        placeholder: 'Capturing innovation, teamwork, and excellence…',
        category: 'page_content',
      },
      {
        key: 'gallery_page_cta_title',
        label: 'CTA Title',
        type: 'text',
        placeholder: 'Join the Programming Club Today',
        category: 'page_content',
      },
      {
        key: 'gallery_page_cta_description',
        label: 'CTA Description',
        type: 'textarea',
        placeholder:
          'Be part of creating these memorable moments. Join us in our next competition, workshop, or community event.',
        category: 'page_content',
      },

      // Committee Page
      { type: 'divider', label: 'Committee Page' },
      {
        key: 'committee_page_badge',
        label: 'Hero Badge',
        type: 'text',
        placeholder: 'Leadership Team 2025-2026',
        category: 'page_content',
      },
      {
        key: 'committee_page_title',
        label: 'Hero Title',
        type: 'text',
        placeholder: 'Meet the Committee',
        category: 'page_content',
      },
      {
        key: 'committee_page_description',
        label: 'Hero Description',
        type: 'textarea',
        placeholder: 'The dedicated team leading the Netrokona University…',
        category: 'page_content',
      },
      {
        key: 'committee_page_cta_title',
        label: 'CTA Title',
        type: 'text',
        placeholder: 'Want to Lead with Us?',
        category: 'page_content',
      },
      {
        key: 'committee_page_cta_description',
        label: 'CTA Description',
        type: 'textarea',
        placeholder: 'Applications for the next committee term open soon…',
        category: 'page_content',
      },

      // Developers Page
      { type: 'divider', label: 'Developers Page' },
      {
        key: 'developers_page_badge',
        label: 'Hero Badge',
        type: 'text',
        placeholder: 'Development Team',
        category: 'page_content',
      },
      {
        key: 'developers_page_title',
        label: 'Hero Title',
        type: 'text',
        placeholder: 'Meet the Developers',
        category: 'page_content',
      },
      {
        key: 'developers_page_description',
        label: 'Hero Description',
        type: 'textarea',
        placeholder: 'The minds behind the digital platform…',
        category: 'page_content',
      },
      {
        key: 'developers_page_cta_title',
        label: 'CTA Title',
        type: 'text',
        placeholder: 'Want to Contribute?',
        category: 'page_content',
      },
      {
        key: 'developers_page_cta_description',
        label: 'CTA Description',
        type: 'textarea',
        placeholder:
          'This project follows collaborative development practices…',
        category: 'page_content',
      },

      // Join Page
      { type: 'divider', label: 'Join Page' },
      {
        key: 'join_page_badge',
        label: 'Hero Badge',
        type: 'text',
        placeholder: 'Public Account',
        category: 'page_content',
      },
      {
        key: 'join_page_title',
        label: 'Hero Title',
        type: 'text',
        placeholder: 'Create Your Public Account',
        category: 'page_content',
      },
      {
        key: 'join_page_description',
        label: 'Hero Description',
        type: 'textarea',
        placeholder: 'Stay updated with events, contests, and workshops…',
        category: 'page_content',
      },

      // Roadmaps Page
      { type: 'divider', label: 'Roadmaps Page' },
      {
        key: 'roadmaps_page_badge',
        label: 'Hero Badge',
        type: 'text',
        placeholder: 'Learning Pathways',
        category: 'page_content',
      },
      {
        key: 'roadmaps_page_title',
        label: 'Hero Title',
        type: 'text',
        placeholder: 'Club Learning Roadmaps',
        category: 'page_content',
      },
      {
        key: 'roadmaps_page_description',
        label: 'Hero Description',
        type: 'textarea',
        placeholder: 'Structured pathways to become a skilled developer…',
        category: 'page_content',
      },
      {
        key: 'roadmaps_page_cta_title',
        label: 'CTA Title',
        type: 'text',
        placeholder: 'Ready to Start Your Journey?',
        category: 'page_content',
      },
      {
        key: 'roadmaps_page_cta_description',
        label: 'CTA Description',
        type: 'textarea',
        placeholder: 'Join NEUPC today and accelerate your learning…',
        category: 'page_content',
      },
    ],
  },

  // ── 2. Feature Toggles ─────────────────────────────────────
  {
    id: 'features',
    label: 'Features',
    icon: ToggleLeft,
    description: 'Enable or disable major platform features globally',
    fields: [
      { type: 'divider', label: 'Communication' },
      {
        key: 'features.chat_enabled',
        label: 'Chat System',
        type: 'toggle',
        desc: 'Enable real-time direct messaging and support tickets',
      },
      {
        key: 'features.discussions_enabled',
        label: 'Discussion Forum',
        type: 'toggle',
        desc: 'Enable threaded discussion forum for members',
      },
      { type: 'divider', label: 'Learning & Development' },
      {
        key: 'features.mentorship_enabled',
        label: 'Mentorship Program',
        type: 'toggle',
        desc: 'Enable mentor-mentee assignments, tasks, and sessions',
      },
      {
        key: 'features.contests_enabled',
        label: 'Contest Tracking',
        type: 'toggle',
        desc: 'Enable multi-platform competitive programming contest tracking',
      },
      {
        key: 'features.resources_enabled',
        label: 'Resource Library',
        type: 'toggle',
        desc: 'Enable the shared resource/link library',
      },
      {
        key: 'features.roadmaps_enabled',
        label: 'Roadmaps',
        type: 'toggle',
        desc: 'Enable learning path roadmaps for members',
      },
      { type: 'divider', label: 'Content & Media' },
      {
        key: 'features.gallery_enabled',
        label: 'Gallery',
        type: 'toggle',
        desc: 'Enable the photo gallery for events and activities',
      },
      {
        key: 'features.achievements_enabled',
        label: 'Achievements',
        type: 'toggle',
        desc: 'Enable the achievements/results showcase',
      },
      {
        key: 'features.notices_enabled',
        label: 'Notice Board',
        type: 'toggle',
        desc: 'Enable the announcements and notice board',
      },
      { type: 'divider', label: 'Operations' },
      {
        key: 'features.certificates_enabled',
        label: 'Certificate System',
        type: 'toggle',
        desc: 'Enable issuing and verifying event certificates',
      },
      {
        key: 'features.budget_enabled',
        label: 'Budget Management',
        type: 'toggle',
        desc: 'Enable income/expense tracking and budget management',
      },
    ],
  },

  // ── 3. Users & Access ──────────────────────────────────────
  {
    id: 'users',
    label: 'Users',
    icon: Users,
    description: 'Control user registration and access settings',
    fields: [
      {
        key: 'users.registration_enabled',
        label: 'Allow New Registrations',
        type: 'toggle',
        desc: 'Allow users to create new accounts',
      },
      {
        key: 'users.require_email_verification',
        label: 'Require Email Verification',
        type: 'toggle',
        desc: 'Users must verify their email before accessing the platform',
      },
      {
        key: 'users.allow_google_login',
        label: 'Allow Google Login',
        type: 'toggle',
        desc: 'Enable "Continue with Google" sign-in',
      },
      {
        key: 'users.default_role',
        label: 'Default Role for New Users',
        type: 'select',
        desc: 'Role assigned automatically upon registration',
        options: [
          { value: 'guest', label: 'Guest' },
          { value: 'member', label: 'Member' },
        ],
      },
      {
        key: 'users.public_profiles',
        label: 'Public Member Profiles',
        type: 'toggle',
        desc: 'Member profiles are visible to anyone without login',
      },
    ],
  },

  // ── 4. Applications ────────────────────────────────────────
  {
    id: 'applications',
    label: 'Applications',
    icon: GraduationCap,
    description: 'Settings for membership application workflow',
    fields: [
      {
        key: 'applications.accept_applications',
        label: 'Accept Applications',
        type: 'toggle',
        desc: 'Open the membership application form to the public',
      },
      {
        key: 'applications.auto_approve',
        label: 'Auto Approve',
        type: 'toggle',
        desc: 'Automatically approve every submitted application',
      },
      {
        key: 'applications.require_login',
        label: 'Require Login to Apply',
        type: 'toggle',
        desc: 'Applicants must be logged in before submitting',
      },
      {
        key: 'applications.max_per_year',
        label: 'Max Applications per Year',
        type: 'number',
        placeholder: '100',
        min: 1,
        max: 9999,
        desc: 'Maximum number of applications accepted per year',
      },
    ],
  },

  // ── 5. Events ──────────────────────────────────────────────
  {
    id: 'events',
    label: 'Events',
    icon: CalendarDays,
    description: 'Control how events are managed and displayed',
    fields: [
      {
        key: 'events.allow_external_registration',
        label: 'Allow External Registration Links',
        type: 'toggle',
        desc: 'Events can use external URLs for registration',
      },
      {
        key: 'events.allow_rsvp_cancellation',
        label: 'Allow RSVP Cancellation',
        type: 'toggle',
        desc: 'Users can cancel their event registration',
      },
      {
        key: 'events.registration_required_default',
        label: 'Registration Required by Default',
        type: 'toggle',
        desc: 'New events require registration by default',
      },
      {
        key: 'events.default_max_participants',
        label: 'Default Max Participants',
        type: 'number',
        placeholder: '0 = unlimited',
        min: 0,
        max: 10000,
        desc: 'Default capacity for new events (0 = unlimited)',
      },
      {
        key: 'events.reminder_hours_before',
        label: 'Reminder Hours Before Event',
        type: 'number',
        placeholder: '24',
        min: 1,
        max: 168,
        desc: 'How many hours before an event to send reminders',
      },
    ],
  },

  // ── 6. Blogs ───────────────────────────────────────────────
  {
    id: 'blogs',
    label: 'Blogs',
    icon: BookOpen,
    description: 'Manage blog publication and comment settings',
    fields: [
      {
        key: 'blogs.require_approval',
        label: 'Require Approval Before Publish',
        type: 'toggle',
        desc: 'Posts need admin approval before going live',
      },
      {
        key: 'blogs.allow_comments',
        label: 'Allow Comments',
        type: 'toggle',
        desc: 'Readers can leave comments on blog posts',
      },
      {
        key: 'blogs.moderate_comments',
        label: 'Moderate Comments',
        type: 'toggle',
        desc: 'Comments are held for review before appearing',
      },
      {
        key: 'blogs.enable_likes',
        label: 'Enable Post Likes',
        type: 'toggle',
        desc: 'Show the like button on blog posts',
      },
      {
        key: 'blogs.max_image_size_mb',
        label: 'Max Blog Image Size (MB)',
        type: 'number',
        placeholder: '5',
        min: 1,
        max: 50,
        desc: 'Maximum upload size for blog images',
      },
    ],
  },

  // ── 7. Notifications ───────────────────────────────────────
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    description: 'Configure email and in-app notification behaviour',
    fields: [
      { type: 'divider', label: 'Email Notifications' },
      {
        key: 'notifications.email_new_user',
        label: 'New User Registered',
        type: 'toggle',
        desc: 'Email admins when a new user registers',
      },
      {
        key: 'notifications.email_new_application',
        label: 'New Application Submitted',
        type: 'toggle',
        desc: 'Email admins when a membership application is submitted',
      },
      {
        key: 'notifications.email_contact_form',
        label: 'Contact Form Submission',
        type: 'toggle',
        desc: 'Email admins on new contact form submissions',
      },
      {
        key: 'notifications.email_event_reminder',
        label: 'Event Reminder',
        type: 'toggle',
        desc: 'Send reminders to registered users before events',
      },
      {
        key: 'notifications.email_role_change',
        label: 'Role Change Notification',
        type: 'toggle',
        desc: 'Email users when their role is changed',
      },
      { type: 'divider', label: 'In-App Notifications' },
      {
        key: 'notifications.inapp_enabled',
        label: 'Enable In-App Notifications',
        type: 'toggle',
        desc: 'Show notification bell and alerts within the platform',
      },
      {
        key: 'notifications.retention_days',
        label: 'Notification Retention (days)',
        type: 'number',
        placeholder: '30',
        min: 1,
        max: 365,
        desc: 'Automatically delete notifications older than this',
      },
    ],
  },

  // ── 8. Security ────────────────────────────────────────────
  {
    id: 'security',
    label: 'Security',
    icon: ShieldCheck,
    description: 'Account protection and session management settings',
    fields: [
      {
        key: 'security.max_login_attempts',
        label: 'Max Failed Login Attempts',
        type: 'number',
        placeholder: '5',
        min: 1,
        max: 20,
        desc: 'Account locked after this many consecutive failures',
      },
      {
        key: 'security.lock_duration_minutes',
        label: 'Account Lock Duration (min)',
        type: 'number',
        placeholder: '30',
        min: 5,
        max: 1440,
        desc: 'How long an account stays locked after too many failures',
      },
      {
        key: 'security.session_timeout_minutes',
        label: 'Session Timeout (minutes)',
        type: 'number',
        placeholder: '60',
        min: 5,
        max: 1440,
        desc: 'Inactive sessions expire after this duration',
      },
      {
        key: 'security.password_min_length',
        label: 'Minimum Password Length',
        type: 'number',
        placeholder: '8',
        min: 6,
        max: 64,
      },
      {
        key: 'security.require_special_chars',
        label: 'Require Special Characters',
        type: 'toggle',
        desc: 'Passwords must contain at least one special character',
      },
      {
        key: 'security.enable_2fa',
        label: 'Enable Two-Factor Auth',
        type: 'toggle',
        desc: 'Allow users to optionally enable 2FA on their accounts',
      },
    ],
  },

  // ── 9. Maintenance ─────────────────────────────────────────
  {
    id: 'maintenance',
    label: 'Maintenance',
    icon: Wrench,
    description: 'Control platform maintenance mode',
    fields: [
      {
        key: 'maintenance.enabled',
        label: 'Enable Maintenance Mode',
        type: 'toggle',
        desc: 'Show a maintenance page to all non-admin users',
      },
      {
        key: 'maintenance.message',
        label: 'Maintenance Message',
        type: 'textarea',
        placeholder: 'Custom message shown during maintenance…',
        desc: 'Displayed to visitors during maintenance',
      },
      {
        key: 'maintenance.expected_end',
        label: 'Expected End Time',
        type: 'text',
        placeholder: 'e.g. March 5, 2026 at 10:00 PM BST',
        desc: 'Shown to users so they know when to come back',
      },
    ],
  },
];

// ─── Sidebar groups ───────────────────────────────────────────────────────────

const SIDEBAR_GROUPS = [
  { label: 'Content', ids: ['website', 'pages'] },
  {
    label: 'Platform',
    ids: ['features', 'users', 'applications', 'events', 'blogs'],
  },
  { label: 'System', ids: ['notifications', 'security', 'maintenance'] },
];
// ─── Utilities ────────────────────────────────────────────────────────────────

/** Split flat fields array into labelled groups using divider entries */
function parseFieldGroups(fields) {
  const groups = [];
  let current = { label: null, fields: [] };
  for (const f of fields) {
    if (f.type === 'divider') {
      if (current.fields.length > 0 || current.label !== null)
        groups.push(current);
      current = { label: f.label, fields: [] };
    } else {
      current.fields.push(f);
    }
  }
  if (current.fields.length > 0) groups.push(current);
  return groups;
}

/** Count real (non-divider) fields */
function countFields(section) {
  return section.fields.filter((f) => f.type !== 'divider').length;
}

// ─── Dynamic Icon Renderer ───────────────────────────────────────────────────

function DynamicIcon({ name, className = 'h-4 w-4' }) {
  const icons = {
    Settings,
    Layout,
    ToggleLeft,
    Users,
    GraduationCap,
    CalendarDays,
    BookOpen,
    Bell,
    ShieldCheck,
    Wrench,
    Save,
    CheckCircle2,
    AlertCircle,
    Loader2,
    ChevronDown,
    Instagram,
    Facebook,
    Twitter,
    Github,
    Linkedin,
    Youtube,
    Database,
    Type,
    Search,
    X,
    Sparkles,
    RotateCcw,
    Check,
    Plus,
    Trash2,
    ArrowUp,
    ArrowDown,
    Eye,
    Settings2,
    Sliders,
    Globe,
    FileText,
    Lock,
    UserPlus,
    Power,
  };
  const IconComp = icons[name] || Sparkles;
  return <IconComp className={className} />;
}

// ─── Toggle Switch ────────────────────────────────────────────────────────────

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-all duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 disabled:cursor-not-allowed disabled:opacity-40 ${
        checked
          ? 'bg-linear-to-r from-blue-500 to-cyan-500 shadow-[0_0_12px_rgba(59,130,246,0.35)]'
          : 'bg-white/10 hover:bg-white/15'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4.5 w-4.5 rounded-full shadow-md transition-all duration-300 ease-in-out ${
          checked ? 'translate-x-5.5 bg-white' : 'translate-x-0.75 bg-gray-400'
        }`}
      />
    </button>
  );
}

// ─── Visual JSON List / Object Builder ────────────────────────────────────────

const JSON_TEMPLATES = {
  about_mission: () => '',
  about_vision: () => '',
  about_mentorship_areas: () => '',
  contact_subjects: () => '',
  faqs: () => ({ question: '', answer: '' }),
  about_what_we_do: () => ({ icon: 'Code', title: '', description: '' }),
  join_benefits: () => ({ icon: 'Check', title: '', description: '' }),
  join_features: () => ({ icon: 'Eye', title: '', description: '' }),
  about_stats: () => ({ value: '10+', label: 'New Stat', icon: 'Star' }),
  about_core_values: () => ({ label: '', icon: 'Check' }),
  about_skills: () => ({ label: '', icon: 'Check' }),
  about_org_structure: () => ({
    title: '',
    description: '',
    icon: 'Users',
    color: 'primary',
  }),
  developers_core: () => ({
    name: '',
    role: '',
    bio: '',
    stack: '',
    github: '',
    linkedin: '',
    portfolio: '',
    photo: '',
  }),
  developers_contributors: () => ({
    name: '',
    role: '',
    contribution: '',
    github: '',
  }),
  developers_timeline: () => ({
    year: new Date().getFullYear().toString(),
    title: '',
    description: '',
    status: 'completed',
  }),
  tech_stack: () => ({ category: '', items: [] }),
  github_stats: () => ({ commits: 0, contributors: 0, stars: 0, forks: 0 }),
};

// Keys whose values are long-form text and deserve a textarea instead of input.
const LARGE_TEXT_KEYS = ['bio', 'description', 'answer', 'contribution', 'notes'];

// Produce an empty-but-shaped clone of a sample value, used when adding a new
// entry to a nested list so the new row exposes the same fields as its siblings.
function emptyClone(sample) {
  if (Array.isArray(sample)) return [];
  if (sample && typeof sample === 'object') {
    return Object.fromEntries(
      Object.entries(sample).map(([k, v]) => [
        k,
        typeof v === 'number'
          ? 0
          : Array.isArray(v)
            ? []
            : v && typeof v === 'object'
              ? {}
              : '',
      ])
    );
  }
  return typeof sample === 'number' ? 0 : '';
}

// ─── Leaf / nested value inputs (used by the visual JSON builders) ────────────

// A single primitive field (string/number) with key-aware widgets.
function NestedLeafInput({ id, fieldKey, value, onChange, disabled }) {
  const isLarge = LARGE_TEXT_KEYS.includes(fieldKey);
  return (
    <div className={`flex flex-col gap-1 ${isLarge ? 'col-span-full' : ''}`}>
      <label
        htmlFor={id}
        className="text-[10px] font-semibold text-gray-500 uppercase"
      >
        {fieldKey.replace(/_/g, ' ')}
      </label>
      {isLarge ? (
        <textarea
          id={id}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          rows={2}
          className="w-full rounded-lg border border-white/8 bg-white/3 px-3 py-1.5 text-xs text-gray-200 focus:border-blue-500/30 focus:outline-none"
        />
      ) : (
        <div className="relative">
          <input
            type="text"
            id={id}
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={`w-full rounded-lg border border-white/8 bg-white/3 px-3 py-1.5 text-xs text-gray-200 focus:border-blue-500/30 focus:outline-none ${
              fieldKey === 'icon' ? 'pl-8' : ''
            }`}
          />
          {fieldKey === 'icon' && (
            <div className="absolute top-1/2 left-2.5 -translate-y-1/2">
              <DynamicIcon name={value} className="h-3.5 w-3.5 text-gray-500" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Renders one key/value of an object — recursing for nested arrays/objects so
// shapes like tech_stack ({ category, items: [...] }) edit properly instead of
// collapsing a nested array into a broken text input.
function NestedValueField({ id, fieldKey, value, onChange, disabled }) {
  if (Array.isArray(value)) {
    return (
      <NestedListEditor
        id={id}
        label={fieldKey.replace(/_/g, ' ')}
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
    );
  }
  if (value && typeof value === 'object') {
    return (
      <NestedObjectEditor
        id={id}
        label={fieldKey.replace(/_/g, ' ')}
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
    );
  }
  return (
    <NestedLeafInput
      id={id}
      fieldKey={fieldKey}
      value={value}
      onChange={onChange}
      disabled={disabled}
    />
  );
}

// Editor for a nested plain object value.
function NestedObjectEditor({ id, label, value, onChange, disabled }) {
  const obj = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  return (
    <div className="col-span-full flex flex-col gap-2 rounded-lg border border-white/6 bg-black/10 p-3">
      <span className="text-[10px] font-bold tracking-wide text-gray-400 uppercase">
        {label}
      </span>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {Object.entries(obj).map(([k, v]) => (
          <NestedValueField
            key={k}
            id={`${id}-${k}`}
            fieldKey={k}
            value={v}
            onChange={(nv) => onChange({ ...obj, [k]: nv })}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
}

// Editor for a nested array value (array of objects or of strings).
function NestedListEditor({ id, label, value, onChange, disabled }) {
  const list = Array.isArray(value) ? value : [];
  const update = (i, nv) => {
    const next = [...list];
    next[i] = nv;
    onChange(next);
  };
  const remove = (i) => onChange(list.filter((_, x) => x !== i));
  const add = () => {
    const sample = list[0];
    const item =
      sample !== undefined
        ? emptyClone(sample)
        : { name: '', description: '', icon: '' };
    onChange([...list, item]);
  };

  return (
    <div className="col-span-full flex flex-col gap-2 rounded-lg border border-white/6 bg-black/10 p-3">
      <span className="text-[10px] font-bold tracking-wide text-gray-400 uppercase">
        {label} ({list.length})
      </span>
      <div className="space-y-2">
        {list.map((el, i) => (
          <div
            key={i}
            className="rounded-lg border border-white/6 bg-white/[0.02] p-3"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-semibold text-gray-500">
                #{i + 1}
              </span>
              <button
                type="button"
                onClick={() => remove(i)}
                disabled={disabled}
                className="rounded-md p-1 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            {el && typeof el === 'object' ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {Object.entries(el).map(([k, v]) => (
                  <NestedValueField
                    key={k}
                    id={`${id}-${i}-${k}`}
                    fieldKey={k}
                    value={v}
                    onChange={(nv) => update(i, { ...el, [k]: nv })}
                    disabled={disabled}
                  />
                ))}
              </div>
            ) : (
              <input
                type="text"
                value={el ?? ''}
                onChange={(e) => update(i, e.target.value)}
                disabled={disabled}
                className="w-full rounded-lg border border-white/8 bg-white/3 px-3 py-1.5 text-xs text-gray-200 focus:border-blue-500/30 focus:outline-none"
              />
            )}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={add}
        disabled={disabled}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/8 py-2 text-[11px] font-semibold text-gray-400 transition-all hover:border-white/15 hover:text-white"
      >
        <Plus className="h-3.5 w-3.5" /> Add to {label}
      </button>
    </div>
  );
}

// Editor for a top-level object keyed by category whose values are lists or
// objects (e.g. tech_stack: { frontend: [...], backend: [...] }). Renders each
// key with an editable name plus a nested editor for its value.
function ObjectMapEditor({ id, value, onChange, disabled }) {
  const obj =
    value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const entries = Object.entries(obj);

  const renameKey = (oldKey, rawNewKey) => {
    const newKey = rawNewKey.trim();
    if (!newKey || newKey === oldKey || obj[newKey] !== undefined) return;
    onChange(
      Object.fromEntries(entries.map(([k, v]) => [k === oldKey ? newKey : k, v]))
    );
  };
  const setValueFor = (key, nv) => onChange({ ...obj, [key]: nv });
  const removeKey = (key) => {
    const next = { ...obj };
    delete next[key];
    onChange(next);
  };
  const addKey = () => {
    let key = 'new_category';
    let i = 1;
    while (obj[key] !== undefined) key = `new_category_${i++}`;
    onChange({ ...obj, [key]: [] });
  };

  return (
    <div className="space-y-3">
      {entries.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/6 py-6 text-center">
          <span className="text-xs text-gray-600">
            No categories yet. Add the first one to get started.
          </span>
        </div>
      )}
      {entries.map(([key, val]) => (
        <div
          key={key}
          className="rounded-xl border border-white/6 bg-white/[0.02] p-4 transition-all duration-200 hover:border-white/12"
        >
          <div className="mb-3 flex items-center gap-2 border-b border-white/4 pb-2">
            <input
              type="text"
              defaultValue={key}
              onBlur={(e) => renameKey(key, e.target.value)}
              disabled={disabled}
              className="flex-1 rounded-lg border border-white/8 bg-white/3 px-3 py-1.5 text-xs font-bold text-gray-200 focus:border-blue-500/30 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => removeKey(key)}
              disabled={disabled}
              className="rounded-md p-1 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          {Array.isArray(val) ? (
            <NestedListEditor
              id={`${id}-${key}`}
              label="Items"
              value={val}
              onChange={(nv) => setValueFor(key, nv)}
              disabled={disabled}
            />
          ) : val && typeof val === 'object' ? (
            <NestedObjectEditor
              id={`${id}-${key}`}
              label="Fields"
              value={val}
              onChange={(nv) => setValueFor(key, nv)}
              disabled={disabled}
            />
          ) : (
            <NestedLeafInput
              id={`${id}-${key}`}
              fieldKey="value"
              value={val}
              onChange={(nv) => setValueFor(key, nv)}
              disabled={disabled}
            />
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={addKey}
        disabled={disabled}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/8 bg-white/[0.01] py-3 text-xs font-semibold text-gray-400 transition-all duration-150 hover:border-white/15 hover:bg-white/3 hover:text-white active:scale-[0.99]"
      >
        <Plus className="h-4 w-4" />
        Add Category
      </button>
    </div>
  );
}

function VisualJsonEditor({ field, value, onChange, disabled }) {
  const [activeTab, setActiveTab] = useState('visual'); // 'visual' | 'raw'
  const [jsonText, setJsonText] = useState('');
  const [isValidJson, setIsValidJson] = useState(true);

  const isSingleObject = field.key === 'github_stats';

  // Coerce the value into a plain object and overlay the template so every
  // expected key always renders (the stored value may be empty, a string, or
  // an array default). Only used for single-object fields like github_stats.
  const singleObject = useMemo(() => {
    let v = value;
    if (typeof v === 'string') {
      try {
        v = JSON.parse(v);
      } catch {
        v = {};
      }
    }
    if (!v || Array.isArray(v) || typeof v !== 'object') v = {};
    const tpl = JSON_TEMPLATES[field.key];
    return tpl ? { ...tpl(), ...v } : v;
  }, [value, field.key]);

  // Sync the value to the raw JSON textarea string. Single-object fields show
  // the coerced/merged object so the Raw view matches the Visual view.
  useEffect(() => {
    const base = isSingleObject ? singleObject : value;
    const serialized =
      typeof base === 'string'
        ? base
        : JSON.stringify(base ?? (isSingleObject ? {} : []), null, 2);
    setJsonText(serialized);
    try {
      JSON.parse(serialized);
      setIsValidJson(true);
    } catch {
      setIsValidJson(false);
    }
  }, [value, isSingleObject, singleObject]);

  const items = useMemo(() => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return [];
      }
    }
    return Array.isArray(value) ? value : [];
  }, [value]);

  const isSimpleStringList = useMemo(() => {
    return [
      'about_mission',
      'about_vision',
      'about_mentorship_areas',
      'contact_subjects',
    ].includes(field.key);
  }, [field.key]);

  // A value stored as a plain object keyed by category (e.g. tech_stack:
  // { frontend: [...], backend: [...] }) needs the object-map editor instead of
  // the array-of-items builder, which would otherwise show nothing.
  const isObjectMap =
    !isSingleObject &&
    !isSimpleStringList &&
    !!value &&
    typeof value === 'object' &&
    !Array.isArray(value);

  const handleRawChange = (text) => {
    setJsonText(text);
    try {
      const parsed = JSON.parse(text);
      setIsValidJson(true);
      onChange(parsed);
    } catch {
      setIsValidJson(false);
    }
  };

  const handleUpdateItem = (index, key, val) => {
    const updated = [...items];
    if (isSimpleStringList) {
      updated[index] = val;
    } else {
      updated[index] = { ...updated[index], [key]: val };
    }
    onChange(updated);
  };

  const handleAddItem = () => {
    const templateFn = JSON_TEMPLATES[field.key];
    const newItem = templateFn ? templateFn() : {};
    onChange([...items, newItem]);
  };

  const handleDeleteItem = (index) => {
    const updated = items.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleMoveItem = (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === items.length - 1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...items];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    onChange(updated);
  };

  // String lists Tag Builder
  const [newTagText, setNewTagText] = useState('');
  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      e.preventDefault();
      if (newTagText.trim()) {
        onChange([...items, newTagText.trim()]);
        setNewTagText('');
      }
    }
  };

  return (
    <div className="col-span-full rounded-2xl border border-white/6 bg-white/[0.01] p-4.5 backdrop-blur-md">
      <div className="mb-4 flex items-center justify-between border-b border-white/6 pb-3">
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-gray-200 uppercase">
            <Sliders className="h-3.5 w-3.5 text-blue-400" />
            {field.label}
          </label>
          {field.desc && (
            <p className="mt-0.5 text-[11px] text-gray-500">{field.desc}</p>
          )}
        </div>

        {/* Toggle between Visual and Raw modes */}
        <div className="flex rounded-lg border border-white/6 bg-white/3 p-0.5">
          <button
            type="button"
            onClick={() => setActiveTab('visual')}
            className={`rounded-md px-2.5 py-1 text-[10px] font-semibold transition-all ${
              activeTab === 'visual'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Visual Builder
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('raw')}
            className={`rounded-md px-2.5 py-1 text-[10px] font-semibold transition-all ${
              activeTab === 'raw'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Raw Code
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'visual' && !isSingleObject && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="space-y-3"
          >
            {/* Tag / simple string array list builder */}
            {isSimpleStringList && (
              <div className="space-y-3.5">
                <div className="flex min-h-16 flex-wrap gap-2 rounded-xl border border-white/4 bg-black/10 p-3">
                  {items.length === 0 ? (
                    <span className="m-auto text-xs text-gray-600">
                      No items configured. Add one below.
                    </span>
                  ) : (
                    items.map((tag, idx) => (
                      <span
                        key={idx}
                        className="flex items-center gap-1.5 rounded-full border border-blue-500/25 bg-blue-500/10 px-3 py-1 text-xs text-blue-300"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(idx)}
                          className="rounded-full p-0.5 transition-colors hover:bg-blue-500/20 hover:text-white"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTagText}
                    onChange={(e) => setNewTagText(e.target.value)}
                    onKeyDown={handleAddTag}
                    disabled={disabled}
                    placeholder="Type list item and press Enter..."
                    className="flex-1 rounded-lg border border-white/8 bg-white/3 px-3.5 py-2 text-xs text-gray-200 focus:border-blue-500/30 focus:bg-white/5 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    disabled={disabled}
                    className="flex items-center gap-1 rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-xs font-semibold text-blue-300 hover:bg-blue-500/20"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add
                  </button>
                </div>
              </div>
            )}

            {/* Object map builder (category → list, e.g. tech_stack) */}
            {isObjectMap && (
              <ObjectMapEditor
                id={`object-map-${field.key}`}
                value={value}
                onChange={onChange}
                disabled={disabled}
              />
            )}

            {/* Object items builder */}
            {!isSimpleStringList && !isObjectMap && (
              <div className="space-y-3">
                {items.map((item, idx) => {
                  const itemTitle =
                    item.title ||
                    item.label ||
                    item.name ||
                    item.question ||
                    `Item #${idx + 1}`;
                  // Overlay the template so every expected field always renders,
                  // even if this stored item is missing some keys.
                  const templateFn = JSON_TEMPLATES[field.key];
                  const mergedItem =
                    templateFn && item && typeof item === 'object' && !Array.isArray(item)
                      ? { ...templateFn(), ...item }
                      : item;
                  return (
                    <div
                      key={idx}
                      className="rounded-xl border border-white/6 bg-white/[0.02] p-4 transition-all duration-200 hover:border-white/12"
                    >
                      <div className="mb-3 flex items-center justify-between border-b border-white/4 pb-2">
                        <span className="flex items-center gap-2 text-xs font-bold text-gray-200">
                          {item.icon && (
                            <DynamicIcon
                              name={item.icon}
                              className="h-3.5 w-3.5 text-blue-400"
                            />
                          )}
                          {itemTitle}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveItem(idx, 'up')}
                            disabled={idx === 0 || disabled}
                            className="rounded-md p-1 text-gray-500 hover:bg-white/5 hover:text-gray-300 disabled:opacity-30"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveItem(idx, 'down')}
                            disabled={idx === items.length - 1 || disabled}
                            className="rounded-md p-1 text-gray-500 hover:bg-white/5 hover:text-gray-300 disabled:opacity-30"
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(idx)}
                            disabled={disabled}
                            className="rounded-md p-1 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Fields input grid inside the item */}
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {Object.entries(mergedItem).map(([k, v]) => {
                          const inputId = `json-item-${field.key}-${idx}-${k}`;
                          const formattedLabel = k.replace(/_/g, ' ');

                          // Nested array/object values (e.g. tech_stack.items)
                          // get a dedicated recursive editor.
                          if (Array.isArray(v) || (v && typeof v === 'object')) {
                            return (
                              <NestedValueField
                                key={k}
                                id={inputId}
                                fieldKey={k}
                                value={v}
                                onChange={(nv) => handleUpdateItem(idx, k, nv)}
                                disabled={disabled}
                              />
                            );
                          }

                          if (k === 'color') {
                            return (
                              <div key={k} className="flex flex-col gap-1">
                                <label
                                  htmlFor={inputId}
                                  className="text-[10px] font-semibold text-gray-500 uppercase"
                                >
                                  {formattedLabel}
                                </label>
                                <select
                                  id={inputId}
                                  value={v || 'primary'}
                                  onChange={(e) =>
                                    handleUpdateItem(idx, k, e.target.value)
                                  }
                                  disabled={disabled}
                                  className="w-full rounded-lg border border-white/8 bg-white/3 px-3 py-1.5 text-xs text-gray-200 focus:border-blue-500/30 focus:outline-none [&>option]:bg-gray-900"
                                >
                                  <option value="primary">Primary</option>
                                  <option value="secondary">Secondary</option>
                                </select>
                              </div>
                            );
                          }

                          if (k === 'status') {
                            return (
                              <div key={k} className="flex flex-col gap-1">
                                <label
                                  htmlFor={inputId}
                                  className="text-[10px] font-semibold text-gray-500 uppercase"
                                >
                                  {formattedLabel}
                                </label>
                                <select
                                  id={inputId}
                                  value={v || 'completed'}
                                  onChange={(e) =>
                                    handleUpdateItem(idx, k, e.target.value)
                                  }
                                  disabled={disabled}
                                  className="w-full rounded-lg border border-white/8 bg-white/3 px-3 py-1.5 text-xs text-gray-200 focus:border-blue-500/30 focus:outline-none [&>option]:bg-gray-900"
                                >
                                  <option value="completed">Completed</option>
                                  <option value="in-progress">
                                    In Progress
                                  </option>
                                  <option value="planned">Planned</option>
                                </select>
                              </div>
                            );
                          }

                          const isLarge = [
                            'bio',
                            'description',
                            'answer',
                            'contribution',
                          ].includes(k);
                          return (
                            <div
                              key={k}
                              className={`flex flex-col gap-1 ${isLarge ? 'col-span-full' : ''}`}
                            >
                              <label
                                htmlFor={inputId}
                                className="text-[10px] font-semibold text-gray-500 uppercase"
                              >
                                {formattedLabel}
                              </label>
                              {isLarge ? (
                                <textarea
                                  id={inputId}
                                  value={v || ''}
                                  onChange={(e) =>
                                    handleUpdateItem(idx, k, e.target.value)
                                  }
                                  disabled={disabled}
                                  rows={2}
                                  className="w-full rounded-lg border border-white/8 bg-white/3 px-3 py-1.5 text-xs text-gray-200 focus:border-blue-500/30 focus:outline-none"
                                />
                              ) : (
                                <div className="relative">
                                  <input
                                    type="text"
                                    id={inputId}
                                    value={v || ''}
                                    onChange={(e) =>
                                      handleUpdateItem(idx, k, e.target.value)
                                    }
                                    disabled={disabled}
                                    className={`w-full rounded-lg border border-white/8 bg-white/3 px-3 py-1.5 text-xs text-gray-200 focus:border-blue-500/30 focus:outline-none ${
                                      k === 'icon' ? 'pl-8' : ''
                                    }`}
                                  />
                                  {k === 'icon' && (
                                    <div className="absolute top-1/2 left-2.5 -translate-y-1/2">
                                      <DynamicIcon
                                        name={v}
                                        className="h-3.5 w-3.5 text-gray-500"
                                      />
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {items.length === 0 && (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/6 py-6 text-center">
                    <span className="text-xs text-gray-600">
                      No items available. Add the first item to get started.
                    </span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleAddItem}
                  disabled={disabled}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/8 bg-white/[0.01] py-3 text-xs font-semibold text-gray-400 transition-all duration-150 hover:border-white/15 hover:bg-white/3 hover:text-white active:scale-[0.99]"
                >
                  <Plus className="h-4 w-4" />
                  Add New Item
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Flat Object Editor (Single Object schema - like github_stats) */}
        {activeTab === 'visual' && isSingleObject && (
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
            {Object.entries(singleObject).map(([k, v]) => {
              const inputId = `flat-json-${field.key}-${k}`;
              return (
                <div key={k} className="flex flex-col gap-1">
                  <label
                    htmlFor={inputId}
                    className="text-[10px] font-semibold text-gray-500 uppercase"
                  >
                    {k}
                  </label>
                  <input
                    type="number"
                    id={inputId}
                    value={v ?? 0}
                    onChange={(e) => {
                      const updated = {
                        ...singleObject,
                        [k]: Number(e.target.value),
                      };
                      onChange(updated);
                    }}
                    disabled={disabled}
                    className="w-full rounded-lg border border-white/8 bg-white/3 px-3 py-2 text-xs text-gray-200 focus:border-blue-500/30 focus:outline-none"
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Raw Code Editor (JSON text block) */}
        {activeTab === 'raw' && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="relative"
          >
            <textarea
              value={jsonText}
              onChange={(e) => handleRawChange(e.target.value)}
              disabled={disabled}
              rows={8}
              placeholder="[]"
              className={`w-full rounded-xl border border-white/8 bg-black/20 p-3.5 font-mono text-xs leading-relaxed text-gray-300 focus:ring-2 focus:ring-blue-500/15 focus:outline-none disabled:opacity-40 ${
                !isValidJson
                  ? 'border-rose-500/30 focus:border-rose-500/50'
                  : 'focus:border-blue-500/30'
              }`}
            />
            <div className="absolute right-3.5 bottom-3 flex items-center gap-1.5">
              {!isValidJson ? (
                <span className="flex items-center gap-1 rounded-md border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-[9px] font-bold tracking-wide text-rose-400 uppercase">
                  <AlertCircle className="h-3 w-3" />
                  Invalid JSON
                </span>
              ) : (
                <span className="flex items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold tracking-wide text-emerald-400 uppercase">
                  <Check className="h-3 w-3" />
                  Valid Format
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Glowing Quick Toggles Header Widget ─────────────────────────────────────

function QuickTogglesWidget({ values, onChange, disabled }) {
  const activeFeaturesCount = useMemo(() => {
    let active = 0;
    let total = 0;
    Object.entries(values).forEach(([k, v]) => {
      if (k.startsWith('features.')) {
        total++;
        if (v) active++;
      }
    });
    return { active, total };
  }, [values]);

  return (
    <GlassCard className="relative overflow-hidden border-white/[0.08] bg-gray-900/60 p-6 shadow-2xl backdrop-blur-xl">
      {/* Decorative top glow bar */}
      <div className="absolute top-0 right-0 left-0 h-0.75 bg-linear-to-r from-blue-500 via-indigo-500 to-cyan-500 shadow-[0_1px_8px_rgba(59,130,246,0.5)]" />

      <div className="mb-4.5 flex items-center justify-between border-b border-white/6 pb-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold tracking-wide text-gray-200">
          <Settings2 className="h-4 w-4 animate-pulse text-blue-400" />
          System Overview & Quick Controls
        </h3>
        <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-[10px] font-medium text-gray-400">
          Instant Toggles
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Maintenance Toggle */}
        <div className="group rounded-xl border border-white/6 bg-white/[0.01] p-4 transition-all duration-200 hover:border-white/12 hover:bg-white/[0.02]">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${values['maintenance.enabled'] ? 'animate-ping bg-amber-400' : 'bg-emerald-500'}`}
              />
              <span className="text-xs font-semibold text-gray-300">
                Maintenance Mode
              </span>
            </div>
            <Toggle
              checked={!!values['maintenance.enabled']}
              onChange={(v) => onChange('maintenance.enabled', v)}
              disabled={disabled}
            />
          </div>
          <p className="text-[10px] leading-relaxed text-gray-500">
            {values['maintenance.enabled']
              ? `Active: Non-admin users see fallback screen.`
              : 'Inactive: Platform open to the public.'}
          </p>
          {values['maintenance.enabled'] && (
            <div className="mt-2 truncate font-mono text-[9px] text-amber-400/90">
              End: {values['maintenance.expected_end'] || 'Not scheduled'}
            </div>
          )}
        </div>

        {/* Applications Toggle */}
        <div className="group rounded-xl border border-white/6 bg-white/[0.01] p-4 transition-all duration-200 hover:border-white/12 hover:bg-white/[0.02]">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${values['applications.accept_applications'] ? 'animate-pulse bg-emerald-500' : 'bg-gray-600'}`}
              />
              <span className="text-xs font-semibold text-gray-300">
                Accept Applications
              </span>
            </div>
            <Toggle
              checked={!!values['applications.accept_applications']}
              onChange={(v) => onChange('applications.accept_applications', v)}
              disabled={disabled}
            />
          </div>
          <p className="text-[10px] leading-relaxed text-gray-500">
            {values['applications.accept_applications']
              ? 'Open: Guest users can apply to be members.'
              : 'Closed: Membership applications disabled.'}
          </p>
          {values['applications.accept_applications'] && (
            <div className="mt-2 text-[9px] text-gray-400">
              Max per year:{' '}
              <span className="font-semibold text-white tabular-nums">
                {values['applications.max_per_year'] || '100'}
              </span>
            </div>
          )}
        </div>

        {/* Registration Toggle */}
        <div className="group rounded-xl border border-white/6 bg-white/[0.01] p-4 transition-all duration-200 hover:border-white/12 hover:bg-white/[0.02]">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${values['users.registration_enabled'] ? 'animate-pulse bg-blue-400' : 'bg-rose-500'}`}
              />
              <span className="text-xs font-semibold text-gray-300">
                User Registrations
              </span>
            </div>
            <Toggle
              checked={!!values['users.registration_enabled']}
              onChange={(v) => onChange('users.registration_enabled', v)}
              disabled={disabled}
            />
          </div>
          <p className="text-[10px] leading-relaxed text-gray-500">
            {values['users.registration_enabled']
              ? 'Allowed: New users can sign up.'
              : 'Blocked: Nobody can register new accounts.'}
          </p>
          <div className="mt-2 flex items-center gap-1 text-[9px] text-gray-400">
            Email Verification:
            <span
              className={`font-semibold ${values['users.require_email_verification'] ? 'text-amber-400' : 'text-emerald-400'}`}
            >
              {values['users.require_email_verification']
                ? 'Required'
                : 'Bypassed'}
            </span>
          </div>
        </div>

        {/* Active Features stats */}
        <div className="group flex flex-col justify-between rounded-xl border border-white/6 bg-white/[0.01] p-4 transition-all duration-200 hover:border-white/12 hover:bg-white/[0.02]">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-300">
                Active Features
              </span>
              <span className="text-xs font-bold text-emerald-400 tabular-nums">
                {activeFeaturesCount.active}/{activeFeaturesCount.total}
              </span>
            </div>
            <div className="relative h-1.5 w-full overflow-hidden rounded-full border border-white/4 bg-white/5">
              <div
                className="h-full bg-linear-to-r from-emerald-500 to-teal-400 shadow-[0_0_8px_rgba(16,185,129,0.3)] transition-all duration-300"
                style={{
                  width: `${(activeFeaturesCount.active / activeFeaturesCount.total) * 100}%`,
                }}
              />
            </div>
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-gray-500">
            Control chat modules, certificates, notice boards, and roadmap tabs.
          </p>
        </div>
      </div>
    </GlassCard>
  );
}

// ─── Field Renderer ───────────────────────────────────────────────────────────

function SettingField({ field, value, onChange, disabled }) {
  if (field.type === 'toggle') {
    return (
      <div className="col-span-full">
        <div
          className={`group flex items-center justify-between gap-4 rounded-xl border px-4.5 py-4 backdrop-blur-md transition-all duration-300 ${
            value
              ? 'border-blue-500/25 bg-blue-500/[0.03] shadow-[inset_0_1px_8px_rgba(59,130,246,0.05)]'
              : 'border-white/6 bg-white/1 hover:border-white/10 hover:bg-white/2'
          }`}
        >
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold text-gray-200">{field.label}</p>
            {field.desc && (
              <p className="mt-0.5 text-[11px] leading-relaxed text-gray-500">
                {field.desc}
              </p>
            )}
          </div>
          <Toggle checked={!!value} onChange={onChange} disabled={disabled} />
        </div>
      </div>
    );
  }

  if (field.type === 'json') {
    return (
      <VisualJsonEditor
        field={field}
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
    );
  }

  const inputCls =
    'w-full rounded-xl border border-white/8 bg-white/2 px-4 py-3 text-xs text-gray-100 placeholder:text-gray-600 backdrop-blur-md transition-all duration-200 focus:border-blue-500/30 focus:bg-white/4 focus:outline-none focus:ring-2 focus:ring-blue-500/15 disabled:opacity-40 disabled:cursor-not-allowed';

  const labelEl = (
    <label className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">
      {field.label}
    </label>
  );

  const descEl = field.desc ? (
    <p className="text-[11px] leading-relaxed text-gray-600">{field.desc}</p>
  ) : null;

  if (field.type === 'select') {
    return (
      <div className="flex flex-col gap-1.5">
        {labelEl}
        {descEl}
        <select
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`${inputCls} cursor-pointer [&>option]:bg-gray-900`}
        >
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (field.type === 'color') {
    return (
      <div className="flex flex-col gap-1.5">
        {labelEl}
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={value ?? '#3b82f6'}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="h-10 w-14 cursor-pointer rounded-xl border border-white/8 bg-white/3 p-1 disabled:opacity-40"
          />
          <input
            type="text"
            value={value ?? '#3b82f6'}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            placeholder="#3b82f6"
            className={`${inputCls} font-mono`}
          />
        </div>
      </div>
    );
  }

  if (field.type === 'textarea') {
    return (
      <div className="col-span-full flex flex-col gap-1.5">
        {labelEl}
        {descEl}
        <textarea
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          rows={3}
          placeholder={field.placeholder}
          className={`${inputCls} resize-none leading-relaxed`}
        />
      </div>
    );
  }

  // text, email, url, number — with optional icon
  const FieldIcon = field.icon;
  return (
    <div className="flex flex-col gap-1.5">
      {labelEl}
      {descEl}
      <div className="relative">
        {FieldIcon && (
          <FieldIcon className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-gray-500" />
        )}
        <input
          type={field.type}
          value={value ?? ''}
          onChange={(e) => {
            const v =
              field.type === 'number' ? Number(e.target.value) : e.target.value;
            onChange(v);
          }}
          disabled={disabled}
          placeholder={field.placeholder}
          min={field.min}
          max={field.max}
          className={`${inputCls} ${FieldIcon ? 'pl-10' : ''}`}
        />
      </div>
    </div>
  );
}

// ─── Collapsible Field Group ──────────────────────────────────────────────────

function FieldGroup({
  label,
  fields,
  values,
  onChange,
  disabled,
  open,
  onToggle,
  scrollRef,
}) {
  // Ungrouped fields (no divider label)
  if (!label) {
    return fields.map((field) => (
      <SettingField
        key={field.key}
        field={field}
        value={values[field.key]}
        onChange={(val) => onChange(field.key, val)}
        disabled={disabled}
      />
    ));
  }

  const filledCount = fields.filter((f) => {
    const v = values[f.key];
    if (f.type === 'toggle') return !!v;
    if (v === undefined || v === null || v === '') return false;
    return true;
  }).length;

  return (
    <div className="col-span-full scroll-mt-4" ref={scrollRef}>
      <button
        type="button"
        onClick={onToggle}
        className="group mb-4.5 flex w-full items-center gap-2.5 pt-1.5"
      >
        <ChevronDown
          className={`h-4 w-4 text-gray-500 transition-transform duration-300 ${
            open ? '' : '-rotate-90'
          }`}
        />
        <span className="text-[11px] font-bold tracking-[0.1em] text-gray-400 uppercase transition-colors group-hover:text-gray-200">
          {label}
        </span>
        <div className="h-px flex-1 bg-linear-to-r from-white/8 to-transparent" />
        <span className="rounded-md border border-white/4 bg-white/5 px-2 py-0.5 text-[10px] text-gray-500 tabular-nums">
          {filledCount}/{fields.length}
        </span>
      </button>

      {open && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {fields.map((field) => (
            <SettingField
              key={field.key}
              field={field}
              value={values[field.key]}
              onChange={(val) => onChange(field.key, val)}
              disabled={disabled}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Global Search Results View ──────────────────────────────────────────────

function SearchResultsView({ query, values, onChange, disabled }) {
  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const matches = [];

    SECTIONS.forEach((section) => {
      section.fields.forEach((field) => {
        if (field.type === 'divider') return;

        const keyMatch = field.key?.toLowerCase().includes(q);
        const labelMatch = field.label?.toLowerCase().includes(q);
        const descMatch = field.desc?.toLowerCase().includes(q);
        const placeholderMatch = field.placeholder?.toLowerCase().includes(q);

        if (keyMatch || labelMatch || descMatch || placeholderMatch) {
          matches.push({
            field,
            section,
          });
        }
      });
    });

    return matches;
  }, [query]);

  // Group matched fields by section id
  const groupedResults = useMemo(() => {
    const groups = {};
    results.forEach((match) => {
      const secId = match.section.id;
      if (!groups[secId]) {
        groups[secId] = {
          section: match.section,
          fields: [],
        };
      }
      groups[secId].fields.push(match.field);
    });
    return Object.values(groups);
  }, [results]);

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Search className="mb-3 h-10 w-10 animate-bounce text-gray-700" />
        <h3 className="text-sm font-semibold text-gray-300">
          No settings matched your search
        </h3>
        <p className="mt-1 max-w-sm text-xs text-gray-500">
          Try typing a different key, label, description, or fallback value.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">
          Search Results: {results.length} fields found
        </span>
      </div>

      {groupedResults.map((group) => {
        const SectionIcon = group.section.icon;
        return (
          <div
            key={group.section.id}
            className="rounded-2xl border border-white/6 bg-white/[0.01] p-5 shadow-xl"
          >
            <div className="mb-4 flex items-center gap-2 border-b border-white/4 pb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10 text-blue-400">
                <SectionIcon className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold text-gray-200">
                {group.section.label}
              </span>
              <span className="text-[10px] text-gray-500">
                ({group.fields.length} matching)
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {group.fields.map((field) => (
                <SettingField
                  key={field.key}
                  field={field}
                  value={values[field.key]}
                  onChange={(val) => onChange(field.key, val)}
                  disabled={disabled}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Section Content Panel ───────────────────────────────────────────────────

function SectionPanel({
  section,
  values,
  onChange,
  disabled,
  openGroups,
  setOpenGroups,
  search,
  setSearch,
}) {
  const groupRefs = useRef({});

  /* Parse field groups from dividers */
  const fieldGroups = useMemo(
    () => parseFieldGroups(section.fields),
    [section.fields]
  );

  /* Filter groups by search query */
  const filteredGroups = useMemo(() => {
    if (!search.trim()) return fieldGroups;
    const q = search.toLowerCase();
    return fieldGroups
      .map((g) => ({
        ...g,
        fields: g.fields.filter(
          (f) =>
            f.label?.toLowerCase().includes(q) ||
            f.key?.toLowerCase().includes(q) ||
            f.desc?.toLowerCase().includes(q) ||
            f.placeholder?.toLowerCase().includes(q)
        ),
      }))
      .filter((g) => g.fields.length > 0);
  }, [fieldGroups, search]);

  const totalFields = section.fields.filter((f) => f.type !== 'divider').length;
  const labeledGroups = fieldGroups.filter((g) => g.label);
  const isLarge = labeledGroups.length > 4;

  function toggleGroup(label) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  function jumpToGroup(label) {
    setOpenGroups((prev) => new Set(prev).add(label));
    requestAnimationFrame(() => {
      groupRefs.current[label]?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  }

  const SectionIcon = section.icon;

  return (
    <div className="flex flex-col">
      {/* ── Section header ─────────────────────────────────────── */}
      <div className="mb-5.5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-blue-500/15 to-blue-500/5 ring-1 ring-blue-500/25">
            <SectionIcon className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-white">
              {section.label}
            </h2>
            <p className="mt-0.5 text-xs leading-relaxed text-gray-500">
              {section.description}
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-lg border border-white/6 bg-white/5 px-2.5 py-1 text-[10px] font-semibold text-gray-500 tabular-nums">
          {totalFields} fields
        </span>
      </div>

      {/* ── Local Section Search (when fields > 8) ────────────── */}
      {totalFields > 8 && (
        <div className="relative mb-5">
          <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search within ${section.label} (${totalFields} settings)...`}
            className="w-full rounded-xl border border-white/8 bg-white/3 py-2.5 pr-10 pl-10 text-xs text-gray-200 transition-all placeholder:text-gray-600 focus:border-white/15 focus:bg-white/5 focus:ring-2 focus:ring-blue-500/15 focus:outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute top-1/2 right-3.5 -translate-y-1/2 rounded-md p-0.5 text-gray-500 hover:text-gray-300"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* ── Table of contents (large sections) ─────────────────── */}
      {isLarge && !search.trim() && (
        <div className="mb-5 rounded-xl border border-white/6 bg-white/[0.01] p-3.5">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-[0.12em] text-gray-500 uppercase">
              Jump to Category
            </span>
            <button
              onClick={() =>
                setOpenGroups((prev) =>
                  prev.size === labeledGroups.length
                    ? new Set()
                    : new Set(labeledGroups.map((g) => g.label))
                )
              }
              className="text-[10px] font-semibold text-gray-500 transition-colors hover:text-gray-300"
            >
              {openGroups.size === labeledGroups.length
                ? 'Collapse all'
                : 'Expand all'}
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {labeledGroups.map((g) => {
              const filled = g.fields.filter((f) => {
                const v = values[f.key];
                if (f.type === 'toggle') return !!v;
                return !(v === undefined || v === null || v === '');
              }).length;
              return (
                <button
                  key={g.label}
                  onClick={() => jumpToGroup(g.label)}
                  className="flex items-center gap-1.5 rounded-lg border border-white/6 bg-white/3 px-2.5 py-1.5 text-[10px] font-semibold text-gray-400 transition-all duration-150 hover:border-white/12 hover:bg-white/6 hover:text-gray-200 active:scale-[0.97]"
                >
                  {g.label}
                  <span className="text-[9px] text-gray-600 tabular-nums">
                    {filled}/{g.fields.length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Field groups ───────────────────────────────────────── */}
      <div className="space-y-5">
        {filteredGroups.map((group, gi) => (
          <FieldGroup
            key={group.label ?? `group-${gi}`}
            label={group.label}
            fields={group.fields}
            values={values}
            onChange={onChange}
            disabled={disabled}
            open={!!search.trim() || openGroups.has(group.label)}
            onToggle={() => toggleGroup(group.label)}
            scrollRef={(el) => {
              if (group.label) groupRefs.current[group.label] = el;
            }}
          />
        ))}

        {filteredGroups.length === 0 && search && (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Search className="h-8 w-8 animate-bounce text-gray-700" />
            <p className="text-xs text-gray-500">
              No settings match &ldquo;{search}&rdquo; in this section.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SettingsClient({ initialSettings }) {
  const [activeSection, setActiveSection] = useState('website');
  const [seeding, startSeed] = useTransition();
  const [isPending, startSave] = useTransition();
  const [seedMsg, setSeedMsg] = useState(null);
  const [msg, setMsg] = useState(null);
  const [globalSearch, setGlobalSearch] = useState('');
  const [localSearch, setLocalSearch] = useState('');
  const router = useRouter();

  // Accent mapping for category sidebar elements
  const categoryAccents = {
    website: {
      color: 'blue',
      border: 'border-blue-500/20 bg-blue-500/5 text-blue-400',
      glow: 'shadow-[0_0_8px_rgba(59,130,246,0.15)]',
    },
    pages: {
      color: 'violet',
      border: 'border-violet-500/20 bg-violet-500/5 text-violet-400',
      glow: 'shadow-[0_0_8px_rgba(139,92,246,0.15)]',
    },
    features: {
      color: 'emerald',
      border: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400',
      glow: 'shadow-[0_0_8px_rgba(16,185,129,0.15)]',
    },
    users: {
      color: 'cyan',
      border: 'border-cyan-500/20 bg-cyan-500/5 text-cyan-400',
      glow: 'shadow-[0_0_8px_rgba(6,182,212,0.15)]',
    },
    applications: {
      color: 'teal',
      border: 'border-teal-500/20 bg-teal-500/5 text-teal-400',
      glow: 'shadow-[0_0_8px_rgba(20,184,166,0.15)]',
    },
    events: {
      color: 'orange',
      border: 'border-orange-500/20 bg-orange-500/5 text-orange-400',
      glow: 'shadow-[0_0_8px_rgba(249,115,22,0.15)]',
    },
    blogs: {
      color: 'sky',
      border: 'border-sky-500/20 bg-sky-500/5 text-sky-400',
      glow: 'shadow-[0_0_8px_rgba(14,165,233,0.15)]',
    },
    notifications: {
      color: 'indigo',
      border: 'border-indigo-500/20 bg-indigo-500/5 text-indigo-400',
      glow: 'shadow-[0_0_8px_rgba(99,102,241,0.15)]',
    },
    security: {
      color: 'rose',
      border: 'border-rose-500/20 bg-rose-500/5 text-rose-400',
      glow: 'shadow-[0_0_8px_rgba(244,63,94,0.15)]',
    },
    maintenance: {
      color: 'amber',
      border: 'border-amber-500/20 bg-amber-500/5 text-amber-400',
      glow: 'shadow-[0_0_8px_rgba(245,158,11,0.15)]',
    },
  };

  /* Build full unified state from server data */
  const buildInitialState = useCallback(() => {
    const s = { ...initialSettings };
    SECTIONS.forEach((section) => {
      section.fields.forEach((f) => {
        if (f.type === 'divider') return;
        if (s[f.key] === undefined) {
          if (f.type === 'toggle') {
            s[f.key] = false;
          } else if (f.type === 'number') {
            s[f.key] = 0;
          } else if (f.type === 'json') {
            s[f.key] = [];
          } else {
            s[f.key] = '';
          }
        }
      });
    });
    return s;
  }, [initialSettings]);

  const [values, setValues] = useState(buildInitialState);
  const [savedSnapshot, setSavedSnapshot] = useState(buildInitialState);

  /* Keep full state in sync when server loads new defaults */
  useEffect(() => {
    const initial = buildInitialState();
    setValues(initial);
    setSavedSnapshot(initial);
  }, [initialSettings, buildInitialState]);

  /* Dirty check across entire state */
  const isDirty = useMemo(
    () => JSON.stringify(values) !== JSON.stringify(savedSnapshot),
    [values, savedSnapshot]
  );

  /* Count open/collapsed groups for active section */
  const currentSection = SECTIONS.find((s) => s.id === activeSection);
  const hasSettings = Object.keys(initialSettings).length > 0;

  const labeledGroups = useMemo(() => {
    if (!currentSection) return [];
    return parseFieldGroups(currentSection.fields).filter((g) => g.label);
  }, [currentSection]);

  const isLarge = labeledGroups.length > 4;

  const [openGroups, setOpenGroups] = useState(() => {
    const set = new Set();
    if (!isLarge) labeledGroups.forEach((g) => set.add(g.label));
    return set;
  });

  // Re-sync collapse states when category section changes
  useEffect(() => {
    setOpenGroups(() => {
      const set = new Set();
      if (!isLarge) labeledGroups.forEach((g) => set.add(g.label));
      return set;
    });
    setLocalSearch('');
  }, [activeSection, isLarge, labeledGroups]);

  function handleChange(key, val) {
    setValues((prev) => ({ ...prev, [key]: val }));
  }

  function flash(type, text) {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  }

  /* Global Save Handler */
  async function handleSave() {
    startSave(async () => {
      // JSON Validation
      for (const section of SECTIONS) {
        for (const f of section.fields) {
          if (f.type === 'json' && typeof values[f.key] === 'string') {
            try {
              JSON.parse(values[f.key]);
            } catch {
              flash(
                'error',
                `Invalid JSON in "${f.label}". Fix and try again.`
              );
              return;
            }
          }
        }
      }

      // Collect only the DIRTY settings (optimizes DB writes)
      const dirtyEntries = [];
      SECTIONS.forEach((s) => {
        s.fields.forEach((f) => {
          if (f.type === 'divider') return;
          const currentVal = values[f.key];
          const snapVal = savedSnapshot[f.key];

          if (JSON.stringify(currentVal) !== JSON.stringify(snapVal)) {
            let val = currentVal;
            if (val === undefined || val === null) {
              if (f.type === 'toggle') val = false;
              else if (f.type === 'number') val = 0;
              else if (f.type === 'json') val = [];
              else val = '';
            }

            dirtyEntries.push({
              key: f.key,
              value:
                typeof val === 'string' && f.type === 'json'
                  ? JSON.parse(val)
                  : val,
              description: f.desc || null,
              category: f.category || s.id,
            });
          }
        });
      });

      if (dirtyEntries.length === 0) {
        flash('success', 'All changes already saved');
        return;
      }

      const fd = new FormData();
      fd.set('category', activeSection);
      fd.set('entries', JSON.stringify(dirtyEntries));

      const result = await saveSettingsAction(fd);
      if (result?.error) {
        flash('error', result.error);
      } else {
        flash('success', `Successfully saved ${dirtyEntries.length} settings!`);
        setSavedSnapshot({ ...values });
        router.refresh();
      }
    });
  }

  /* Keyboard shortcut support (Ctrl + S or CMD + S) */
  const saveRef = useRef(handleSave);
  useEffect(() => {
    saveRef.current = handleSave;
  });

  useEffect(() => {
    function onKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        saveRef.current?.();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  function handleSeedDefaults() {
    startSeed(async () => {
      const result = await seedDefaultSettingsAction();
      if (result?.error) {
        setSeedMsg({ type: 'error', text: result.error });
      } else {
        setSeedMsg({
          type: 'success',
          text: `Seeded ${result.count} default settings successfully. Reloading platform...`,
        });
        setTimeout(() => window.location.reload(), 1500);
      }
      setTimeout(() => setSeedMsg(null), 4500);
    });
  }

  return (
    <PageShell>
      {/* ── Page Header ──────────────────────────────────────────── */}
      <PageHeader
        title="Settings"
        subtitle="Manage platform configurations, default roles, visual page contents, and feature locks."
        icon={Settings}
        accent="blue"
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/account/admin"
              className="rounded-xl border border-white/8 bg-white/5 px-4 py-2.5 text-xs font-semibold text-gray-300 transition-all hover:border-white/15 hover:bg-white/8 hover:text-white"
            >
              ← Dashboard
            </Link>
            <button
              onClick={handleSeedDefaults}
              disabled={seeding}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-gray-300 transition-all hover:border-white/15 hover:bg-white/8 hover:text-white active:scale-[0.98] disabled:opacity-50"
            >
              {seeding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Database className="h-4 w-4 text-gray-500" />
              )}
              {seeding
                ? 'Seeding...'
                : hasSettings
                  ? 'Reset All to Defaults'
                  : 'Seed Defaults'}
            </button>
          </div>
        }
      />

      {/* ── Seed notification message ────────────────────────────── */}
      {seedMsg && (
        <div
          className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm ${
            seedMsg.type === 'error'
              ? 'border-rose-500/20 bg-rose-500/5 text-rose-300'
              : 'border-emerald-500/20 bg-emerald-500/5 text-emerald-300'
          }`}
        >
          {seedMsg.type === 'error' ? (
            <AlertCircle className="h-4 w-4 shrink-0" />
          ) : (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          )}
          {seedMsg.text}
        </div>
      )}

      {/* ── Empty state configuration defaults ───────────────────── */}
      {!hasSettings && (
        <EmptyState
          icon={Sparkles}
          title="No settings configured"
          description="Get started by seeding the default settings. You can customize everything after."
          action={
            <button
              onClick={handleSeedDefaults}
              disabled={seeding}
              className="flex items-center gap-2 rounded-xl bg-blue-500 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-400 active:scale-[0.98] disabled:opacity-60"
            >
              {seeding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Database className="h-4 w-4" />
              )}
              {seeding ? 'Seeding...' : 'Seed Default Settings'}
            </button>
          }
        />
      )}

      {/* ── Master Status Toggles Widget ─────────────────────────── */}
      {hasSettings && (
        <QuickTogglesWidget
          values={values}
          onChange={handleChange}
          disabled={isPending}
        />
      )}

      {/* ── Main Layout Workspace ────────────────────────────────── */}
      {hasSettings && (
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* ── Left Sidebar Navigation ────────────────────────────── */}
          <aside className="shrink-0 lg:w-64">
            {/* Unified Global Settings Search bar */}
            <div className="relative mb-5 hidden lg:block">
              <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Global settings search..."
                className="w-full rounded-xl border border-white/6 bg-white/2 py-3.5 pr-10 pl-10 text-xs text-gray-200 transition-all placeholder:text-gray-600 focus:border-white/12 focus:bg-white/4 focus:ring-2 focus:ring-blue-500/10 focus:outline-none"
              />
              {globalSearch && (
                <button
                  onClick={() => setGlobalSearch('')}
                  className="absolute top-1/2 right-3.5 -translate-y-1/2 rounded-md p-0.5 text-gray-500 hover:text-gray-300"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Mobile View Navigation (horizontal scrolling tabs) */}
            <div className="scrollbar-none flex gap-1.5 overflow-x-auto py-1 lg:hidden">
              {SECTIONS.map((s) => {
                const Icon = s.icon;
                const active = activeSection === s.id && !globalSearch;
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      setActiveSection(s.id);
                      setGlobalSearch('');
                    }}
                    className={`flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-all ${
                      active
                        ? 'border border-white/10 bg-white/10 text-white'
                        : 'border border-transparent text-gray-500 hover:bg-white/4 hover:text-gray-300'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {s.label}
                  </button>
                );
              })}
            </div>

            {/* Desktop: Grouped sidebar list */}
            <nav className="hidden space-y-6 lg:block">
              {SIDEBAR_GROUPS.map((group) => {
                const groupSections = group.ids
                  .map((id) => SECTIONS.find((s) => s.id === id))
                  .filter(Boolean);
                if (groupSections.length === 0) return null;

                return (
                  <div key={group.label} className="space-y-2">
                    <p className="px-3 text-[10px] font-bold tracking-[0.15em] text-gray-600 uppercase">
                      {group.label}
                    </p>
                    <div className="space-y-1">
                      {groupSections.map((s) => {
                        const Icon = s.icon;
                        const active = activeSection === s.id && !globalSearch;
                        const fc = countFields(s);
                        const accent = categoryAccents[s.id] || {
                          color: 'blue',
                          border: 'border-white/10 bg-white/5',
                          glow: '',
                        };

                        return (
                          <button
                            key={s.id}
                            onClick={() => {
                              setActiveSection(s.id);
                              setGlobalSearch('');
                            }}
                            className={`group relative flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-xs font-semibold transition-all duration-200 ${
                              active
                                ? `border border-white/[0.08] bg-white/[0.06] text-white ${accent.glow}`
                                : 'border border-transparent text-gray-500 hover:bg-white/[0.02] hover:text-gray-300'
                            }`}
                          >
                            {/* Color accented left indicator light */}
                            <div
                              className={`absolute top-3.5 bottom-3.5 left-0 w-1 rounded-full transition-transform ${
                                active
                                  ? `bg-${accent.color}-500 scale-100`
                                  : 'scale-0'
                              }`}
                            />

                            <Icon
                              className={`h-4.5 w-4.5 shrink-0 transition-colors ${
                                active
                                  ? `text-${accent.color}-400`
                                  : 'text-gray-600 group-hover:text-gray-400'
                              }`}
                            />

                            <span className="flex-1 text-left">{s.label}</span>
                            <span
                              className={`rounded-md border px-1.5 py-0.25 text-[10px] font-semibold tabular-nums transition-colors ${
                                active
                                  ? 'border-white/8 bg-white/5 text-gray-400'
                                  : 'border-transparent text-gray-700 group-hover:text-gray-500'
                              }`}
                            >
                              {fc}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </nav>
          </aside>

          {/* ── Content View Workspace Panel ───────────────────────── */}
          <div className="min-w-0 flex-1 rounded-2xl border border-white/6 bg-white/[0.01] p-5 shadow-2xl backdrop-blur-xl sm:p-6.5">
            {msg && (
              <div
                className={`mb-5 flex items-center gap-2.5 rounded-xl border px-4.5 py-3 text-sm ${
                  msg.type === 'error'
                    ? 'border-rose-500/20 bg-rose-500/5 text-rose-300'
                    : 'border-emerald-500/20 bg-emerald-500/5 text-emerald-300'
                }`}
              >
                {msg.type === 'error' ? (
                  <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                ) : (
                  <CheckCircle2 className="h-4.5 w-4.5 shrink-0 animate-bounce" />
                )}
                <span className="flex-1">{msg.text}</span>
              </div>
            )}

            {/* Render search results if there is a query */}
            {globalSearch.trim() ? (
              <SearchResultsView
                query={globalSearch}
                values={values}
                onChange={handleChange}
                disabled={isPending}
              />
            ) : (
              currentSection && (
                <SectionPanel
                  key={currentSection.id}
                  section={currentSection}
                  values={values}
                  onChange={handleChange}
                  disabled={isPending}
                  openGroups={openGroups}
                  setOpenGroups={setOpenGroups}
                  search={localSearch}
                  setSearch={setLocalSearch}
                />
              )
            )}

            {/* ── Sticky Unsaved Changes Save Bar ────────────────── */}
            <div
              className={`sticky bottom-0 z-20 -mx-5 mt-7 -mb-5 flex items-center justify-between gap-4 border-t border-white/8 bg-gray-950/75 px-5 py-4.5 backdrop-blur-2xl transition-all duration-300 sm:-mx-6.5 sm:-mb-6.5 sm:px-6.5 ${
                isDirty
                  ? 'translate-y-0 opacity-100 shadow-[0_-8px_24px_rgba(0,0,0,0.5)]'
                  : 'pointer-events-none translate-y-3 opacity-0'
              }`}
            >
              <div className="flex items-center gap-2.5 text-xs font-semibold text-gray-400">
                <div className="h-2 w-2 animate-ping rounded-full bg-amber-400" />
                You have unsaved changes across settings.
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setValues(buildInitialState());
                  }}
                  disabled={isPending}
                  className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold text-gray-400 transition-all hover:bg-white/5 hover:text-gray-300 disabled:opacity-40"
                >
                  <RotateCcw className="h-4 w-4" />
                  Discard
                </button>
                <button
                  onClick={handleSave}
                  disabled={isPending}
                  className="flex items-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {isPending ? 'Saving...' : 'Save Changes'}
                  <span className="ml-1 hidden rounded-md border border-white/5 bg-white/10 px-1.5 py-0.5 text-[9px] font-medium tracking-wide text-blue-200 shadow-inner sm:inline">
                    ⌘S
                  </span>
                </button>
              </div>
            </div>

            {/* ── Static confirmation footer (when clean) ────────── */}
            {!isDirty && (
              <div className="mt-6 flex items-center justify-end border-t border-white/5 pt-5">
                <button
                  disabled
                  className="flex items-center gap-2 rounded-xl border border-white/6 bg-white/2 px-4 py-2.5 text-xs font-semibold text-gray-600 opacity-60 transition-all"
                >
                  <Check className="h-4 w-4" />
                  All configurations are up to date
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </PageShell>
  );
}
