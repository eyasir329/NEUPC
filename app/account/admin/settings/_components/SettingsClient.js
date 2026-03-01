/**
 * @file Settings client — admin website-settings editor with grouped
 *   form fields for site identity, social links, feature toggles,
 *   and platform configuration (key-value persistence).
 * @module AdminSettingsClient
 */

'use client';

import { useState, useTransition, useCallback } from 'react';
import {
  Settings,
  Globe,
  Palette,
  Users,
  GraduationCap,
  CalendarDays,
  BookOpen,
  Bell,
  ShieldCheck,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronRight,
  Eye,
  EyeOff,
  Instagram,
  Facebook,
  Twitter,
  Github,
  Linkedin,
  Link,
  Layout,
} from 'lucide-react';
import {
  saveSettingsAction,
  resetCategoryAction,
} from '@/app/_lib/settings-actions';

// ─── Section / field definitions ─────────────────────────────────────────────

const SECTIONS = [
  {
    id: 'general',
    label: 'General',
    icon: Globe,
    description: 'Basic platform information and contact details',
    fields: [
      {
        key: 'general.club_name',
        label: 'Club Name',
        type: 'text',
        placeholder: 'NEUPC',
        default: '',
      },
      {
        key: 'general.club_description',
        label: 'Short Description',
        type: 'textarea',
        placeholder: 'University programming club…',
        default: '',
      },
      {
        key: 'general.contact_email',
        label: 'Contact Email',
        type: 'email',
        placeholder: 'admin@example.com',
        default: '',
      },
      {
        key: 'general.contact_phone',
        label: 'Contact Phone',
        type: 'text',
        placeholder: '+880 …',
        default: '',
      },
      {
        key: 'general.address',
        label: 'Address',
        type: 'text',
        placeholder: 'University Campus, Building…',
        default: '',
      },
      {
        key: 'general.website_url',
        label: 'Website URL',
        type: 'url',
        placeholder: 'https://neupc.club',
        default: '',
      },
      {
        key: 'general.google_analytics',
        label: 'Google Analytics ID',
        type: 'text',
        placeholder: 'G-XXXXXXXXXX',
        default: '',
      },
      { type: 'divider', label: 'Social Media Links' },
      {
        key: 'general.social_instagram',
        label: 'Instagram',
        type: 'url',
        placeholder: 'https://instagram.com/…',
        default: '',
        icon: Instagram,
      },
      {
        key: 'general.social_facebook',
        label: 'Facebook',
        type: 'url',
        placeholder: 'https://facebook.com/…',
        default: '',
        icon: Facebook,
      },
      {
        key: 'general.social_twitter',
        label: 'Twitter / X',
        type: 'url',
        placeholder: 'https://twitter.com/…',
        default: '',
        icon: Twitter,
      },
      {
        key: 'general.social_github',
        label: 'GitHub',
        type: 'url',
        placeholder: 'https://github.com/…',
        default: '',
        icon: Github,
      },
      {
        key: 'general.social_linkedin',
        label: 'LinkedIn',
        type: 'url',
        placeholder: 'https://linkedin.com/…',
        default: '',
        icon: Linkedin,
      },
    ],
  },
  {
    id: 'appearance',
    label: 'Appearance',
    icon: Palette,
    description: 'Customize the look and feel of the platform',
    fields: [
      {
        key: 'appearance.theme',
        label: 'Default Theme',
        type: 'select',
        default: 'dark',
        options: [
          { value: 'dark', label: 'Dark' },
          { value: 'light', label: 'Light' },
          { value: 'system', label: 'System' },
        ],
      },
      {
        key: 'appearance.layout_style',
        label: 'Layout Style',
        type: 'select',
        default: 'spacious',
        options: [
          { value: 'spacious', label: 'Spacious' },
          { value: 'compact', label: 'Compact' },
        ],
      },
      {
        key: 'appearance.font',
        label: 'Font Family',
        type: 'select',
        default: 'inter',
        options: [
          { value: 'inter', label: 'Inter' },
          { value: 'josefin-sans', label: 'Josefin Sans' },
          { value: 'poppins', label: 'Poppins' },
          { value: 'system', label: 'System' },
        ],
      },
      {
        key: 'appearance.primary_color',
        label: 'Primary Color',
        type: 'color',
        default: '#3b82f6',
      },
      {
        key: 'appearance.enable_animations',
        label: 'Enable Page Animations',
        type: 'toggle',
        default: true,
      },
    ],
  },
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
        default: true,
        desc: 'Allow users to create new accounts',
      },
      {
        key: 'users.email_verification_required',
        label: 'Require Email Verification',
        type: 'toggle',
        default: true,
        desc: 'Users must verify their email before accessing the platform',
      },
      {
        key: 'users.require_profile_photo',
        label: 'Require Profile Photo',
        type: 'toggle',
        default: false,
        desc: 'Users must upload a photo before getting approved',
      },
      {
        key: 'users.public_profiles',
        label: 'Public Member Profiles',
        type: 'toggle',
        default: false,
        desc: 'Member profiles are visible to anyone without login',
      },
      {
        key: 'users.default_role',
        label: 'Default Role for New Users',
        type: 'select',
        default: 'guest',
        desc: 'Role assigned automatically upon registration',
        options: [
          { value: 'guest', label: 'Guest' },
          { value: 'member', label: 'Member' },
        ],
      },
      {
        key: 'users.allow_google_login',
        label: 'Allow Google Login',
        type: 'toggle',
        default: true,
        desc: 'Enable "Continue with Google" sign-in',
      },
    ],
  },
  {
    id: 'applications',
    label: 'Applications',
    icon: GraduationCap,
    description: 'Settings for membership application workflow',
    fields: [
      {
        key: 'applications.enabled',
        label: 'Accept Applications',
        type: 'toggle',
        default: true,
        desc: 'Open the membership application form to the public',
      },
      {
        key: 'applications.auto_approve',
        label: 'Auto Approve',
        type: 'toggle',
        default: false,
        desc: 'Automatically approve every submitted application',
      },
      {
        key: 'applications.max_per_year',
        label: 'Max Applications per Year',
        type: 'number',
        default: 100,
        placeholder: '100',
        min: 1,
        max: 9999,
      },
      {
        key: 'applications.require_login',
        label: 'Require Login to Apply',
        type: 'toggle',
        default: true,
        desc: 'Applicants must log in before submitting an application',
      },
    ],
  },
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
        default: true,
        desc: 'Events can use external URLs for registration',
      },
      {
        key: 'events.auto_close_after_date',
        label: 'Auto-Close After Event Date',
        type: 'toggle',
        default: true,
        desc: 'Automatically move past events to completed status',
      },
      {
        key: 'events.allow_rsvp_cancellation',
        label: 'Allow RSVP Cancellation',
        type: 'toggle',
        default: true,
        desc: 'Users can cancel their event registration',
      },
      {
        key: 'events.registration_required',
        label: 'Registration Required by Default',
        type: 'toggle',
        default: false,
      },
      {
        key: 'events.reminder_hours_before',
        label: 'Reminder Email Hours Before Event',
        type: 'number',
        default: 24,
        placeholder: '24',
        min: 1,
        max: 168,
      },
    ],
  },
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
        default: true,
        desc: 'Admins must approve posts before they go live',
      },
      {
        key: 'blogs.allow_comments',
        label: 'Allow Comments',
        type: 'toggle',
        default: true,
        desc: 'Readers can leave comments on posts',
      },
      {
        key: 'blogs.moderate_comments',
        label: 'Moderate Comments',
        type: 'toggle',
        default: true,
        desc: 'Comments are held for review before appearing',
      },
      {
        key: 'blogs.allow_guest_comments',
        label: 'Allow Guest Comments',
        type: 'toggle',
        default: false,
        desc: 'Non-logged-in users can post comments',
      },
      {
        key: 'blogs.enable_likes',
        label: 'Enable Post Likes',
        type: 'toggle',
        default: true,
        desc: 'Show the like button on blog posts',
      },
    ],
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    description: 'Configure email and in-app notification behavior',
    fields: [
      { type: 'divider', label: 'Email Notifications' },
      {
        key: 'notifications.email_new_user',
        label: 'New User Registered',
        type: 'toggle',
        default: true,
      },
      {
        key: 'notifications.email_new_application',
        label: 'New Application Submitted',
        type: 'toggle',
        default: true,
      },
      {
        key: 'notifications.email_contact_form',
        label: 'Contact Form Submission',
        type: 'toggle',
        default: true,
      },
      {
        key: 'notifications.email_event_reminder',
        label: 'Event Reminder',
        type: 'toggle',
        default: true,
      },
      {
        key: 'notifications.email_role_change',
        label: 'Role Change Notification',
        type: 'toggle',
        default: false,
      },
      { type: 'divider', label: 'In-App Notifications' },
      {
        key: 'notifications.inapp_enabled',
        label: 'Enable In-App Notifications',
        type: 'toggle',
        default: true,
      },
      {
        key: 'notifications.retention_days',
        label: 'Notification Retention (days)',
        type: 'number',
        default: 30,
        placeholder: '30',
        min: 1,
        max: 365,
      },
    ],
  },
  {
    id: 'security',
    label: 'Security',
    icon: ShieldCheck,
    description: 'Account protection and session management settings',
    fields: [
      {
        key: 'security.login_attempt_limit',
        label: 'Max Failed Login Attempts',
        type: 'number',
        default: 5,
        placeholder: '5',
        min: 1,
        max: 20,
        desc: 'Account locked after this many consecutive failures',
      },
      {
        key: 'security.account_lock_duration_minutes',
        label: 'Account Lock Duration (min)',
        type: 'number',
        default: 30,
        placeholder: '30',
        min: 5,
        max: 1440,
        desc: 'How long the account stays locked after too many failures',
      },
      {
        key: 'security.session_timeout_minutes',
        label: 'Session Timeout (minutes)',
        type: 'number',
        default: 60,
        placeholder: '60',
        min: 5,
        max: 1440,
        desc: 'Inactive sessions expire after this duration',
      },
      {
        key: 'security.password_min_length',
        label: 'Minimum Password Length',
        type: 'number',
        default: 8,
        placeholder: '8',
        min: 6,
        max: 64,
      },
      {
        key: 'security.require_special_chars',
        label: 'Require Special Characters',
        type: 'toggle',
        default: false,
        desc: 'Passwords must contain at least one special character',
      },
      {
        key: 'security.enable_2fa',
        label: 'Enable Two-Factor Auth',
        type: 'toggle',
        default: false,
        desc: 'Users can optionally enable 2FA on their accounts',
      },
    ],
  },
  {
    id: 'website',
    label: 'Website',
    icon: Layout,
    group: 'content',
    description: 'Manage all public-facing website content',
    // Categories this section spans (for multi-category reset)
    categories: ['hero', 'about', 'social', 'contact', 'footer', 'content'],
    fields: [
      { type: 'divider', label: 'Hero Section' },
      {
        key: 'hero_title',
        label: 'Club Name',
        type: 'text',
        placeholder: 'Programming Club',
        default: 'Programming Club',
        category: 'hero',
      },
      {
        key: 'hero_subtitle',
        label: 'Subtitle',
        type: 'text',
        placeholder: '(NEUPC)',
        default: '(NEUPC)',
        category: 'hero',
      },
      {
        key: 'hero_department',
        label: 'Department',
        type: 'text',
        placeholder: 'Department of Computer Science and Engineering',
        default: 'Department of Computer Science and Engineering',
        category: 'hero',
      },
      {
        key: 'hero_university',
        label: 'University',
        type: 'text',
        placeholder: 'Netrokona University, Netrokona, Bangladesh',
        default: 'Netrokona University, Netrokona, Bangladesh',
        category: 'hero',
      },
      { type: 'divider', label: 'About Section' },
      {
        key: 'about_title',
        label: 'About Heading',
        type: 'text',
        placeholder: 'Who We Are',
        default: 'Who We Are',
        category: 'about',
      },
      {
        key: 'about_description_1',
        label: 'Description (Paragraph 1)',
        type: 'textarea',
        placeholder: 'First paragraph about the club…',
        default: '',
        category: 'about',
      },
      {
        key: 'about_description_2',
        label: 'Description (Paragraph 2)',
        type: 'textarea',
        placeholder: 'Second paragraph about the club…',
        default: '',
        category: 'about',
      },
      {
        key: 'about_mission',
        label: 'Mission Points',
        type: 'json',
        desc: 'JSON array of mission statement strings',
        default: [],
        category: 'about',
      },
      {
        key: 'about_vision',
        label: 'Vision Points',
        type: 'json',
        desc: 'JSON array of vision statement strings',
        default: [],
        category: 'about',
      },
      {
        key: 'about_what_we_do',
        label: 'What We Do',
        type: 'json',
        desc: 'JSON array of {icon, title, description} objects',
        default: [],
        category: 'about',
      },
      {
        key: 'about_stats',
        label: 'Club Statistics',
        type: 'json',
        desc: 'JSON array of {value, label, icon} objects',
        default: [],
        category: 'about',
      },
      { type: 'divider', label: 'Social Media Links' },
      {
        key: 'social_facebook',
        label: 'Facebook',
        type: 'url',
        placeholder: 'https://facebook.com/…',
        default: '',
        category: 'social',
        icon: Facebook,
      },
      {
        key: 'social_github',
        label: 'GitHub',
        type: 'url',
        placeholder: 'https://github.com/…',
        default: '',
        category: 'social',
        icon: Github,
      },
      {
        key: 'social_linkedin',
        label: 'LinkedIn',
        type: 'url',
        placeholder: 'https://linkedin.com/…',
        default: '',
        category: 'social',
        icon: Linkedin,
      },
      {
        key: 'social_youtube',
        label: 'YouTube',
        type: 'url',
        placeholder: 'https://youtube.com/…',
        default: '',
        category: 'social',
      },
      {
        key: 'social_twitter',
        label: 'Twitter / X',
        type: 'url',
        placeholder: 'https://twitter.com/…',
        default: '',
        category: 'social',
        icon: Twitter,
      },
      { type: 'divider', label: 'Contact Information' },
      {
        key: 'contact_email',
        label: 'Contact Email',
        type: 'email',
        placeholder: 'contact@university.edu',
        default: '',
        category: 'contact',
      },
      {
        key: 'contact_phone',
        label: 'Contact Phone',
        type: 'text',
        placeholder: '+880 1XXX-XXXXXX',
        default: '',
        category: 'contact',
      },
      {
        key: 'contact_address',
        label: 'Address',
        type: 'text',
        placeholder: 'Department of CSE, University…',
        default: '',
        category: 'contact',
      },
      {
        key: 'contact_office_hours',
        label: 'Office Hours',
        type: 'text',
        placeholder: 'Sunday - Thursday, 10:00 AM - 4:00 PM',
        default: '',
        category: 'contact',
      },
      {
        key: 'contact_subjects',
        label: 'Contact Form Subjects',
        type: 'json',
        desc: 'JSON array of subject option strings',
        default: [],
        category: 'contact',
      },
      { type: 'divider', label: 'Footer' },
      {
        key: 'footer_description',
        label: 'Footer Description',
        type: 'textarea',
        placeholder: 'Short description shown in footer…',
        default: '',
        category: 'footer',
      },
      { type: 'divider', label: 'FAQs' },
      {
        key: 'faqs',
        label: 'FAQ Items',
        type: 'json',
        desc: 'JSON array of {question, answer} objects',
        default: [],
        category: 'content',
      },
      { type: 'divider', label: 'Join Page' },
      {
        key: 'join_benefits',
        label: 'Membership Benefits',
        type: 'json',
        desc: 'JSON array of {icon, title, description} objects',
        default: [],
        category: 'content',
      },
      {
        key: 'join_features',
        label: 'Public Account Features',
        type: 'json',
        desc: 'JSON array of {icon, title, description} objects',
        default: [],
        category: 'content',
      },
      { type: 'divider', label: 'Developers Page' },
      {
        key: 'developers_core',
        label: 'Core Developers',
        type: 'json',
        desc: 'JSON array of {name, role, bio, stack, github, linkedin, portfolio, photo}',
        default: [],
        category: 'content',
      },
      {
        key: 'developers_contributors',
        label: 'Contributors',
        type: 'json',
        desc: 'JSON array of {name, role, contribution, github}',
        default: [],
        category: 'content',
      },
      {
        key: 'tech_stack',
        label: 'Technology Stack',
        type: 'json',
        desc: 'JSON array of {category, items: [{name, description, icon}]}',
        default: [],
        category: 'content',
      },
      {
        key: 'developers_timeline',
        label: 'Development Timeline',
        type: 'json',
        desc: 'JSON array of {year, title, description, status}',
        default: [],
        category: 'content',
      },
      {
        key: 'github_stats',
        label: 'GitHub Statistics',
        type: 'json',
        desc: 'JSON object: {commits, contributors, stars, forks}',
        default: {},
        category: 'content',
      },
    ],
  },
];

// ─── Toggle Switch ────────────────────────────────────────────────────────────

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 transition-all focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? 'border-blue-500 bg-blue-500' : 'border-white/20 bg-white/8'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

// ─── Field renderer ───────────────────────────────────────────────────────────

function SettingField({ field, value, onChange, disabled }) {
  if (field.type === 'divider') {
    return (
      <div className="col-span-full pt-2 pb-1">
        <p className="text-[10px] font-semibold tracking-widest text-gray-500 uppercase">
          {field.label}
        </p>
        <div className="mt-1.5 h-px bg-white/6" />
      </div>
    );
  }

  if (field.type === 'toggle') {
    return (
      <div className="col-span-full flex items-start justify-between gap-4 rounded-xl border border-white/6 bg-white/2 px-4 py-3 transition-colors hover:bg-white/4">
        <div className="min-w-0 flex-1">
          <label className="text-sm font-medium text-gray-200">
            {field.label}
          </label>
          {field.desc && (
            <p className="mt-0.5 text-[11px] text-gray-600">{field.desc}</p>
          )}
        </div>
        <Toggle checked={!!value} onChange={onChange} disabled={disabled} />
      </div>
    );
  }

  const inputBase =
    'w-full rounded-xl border border-white/10 bg-white/4 px-3 py-2.5 text-sm text-white placeholder-gray-600 backdrop-blur-sm transition-all focus:border-white/25 focus:bg-white/6 focus:outline-none focus:ring-1 focus:ring-white/10 disabled:opacity-50';

  if (field.type === 'select') {
    return (
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-gray-400">
          {field.label}
        </label>
        {field.desc && (
          <p className="-mt-0.5 text-[11px] text-gray-600">{field.desc}</p>
        )}
        <select
          value={value ?? field.default ?? ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`${inputBase} [&>option]:bg-gray-900`}
        >
          {field.options.map((opt) => (
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
        <label className="text-xs font-medium text-gray-400">
          {field.label}
        </label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={value ?? field.default ?? '#3b82f6'}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="h-10 w-16 cursor-pointer rounded-lg border border-white/10 bg-white/4 p-1 disabled:opacity-50"
          />
          <input
            type="text"
            value={value ?? field.default ?? '#3b82f6'}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            placeholder="#3b82f6"
            className={`${inputBase} font-mono`}
          />
        </div>
      </div>
    );
  }

  if (field.type === 'textarea') {
    return (
      <div className="col-span-full flex flex-col gap-1.5">
        <label className="text-xs font-medium text-gray-400">
          {field.label}
        </label>
        <textarea
          value={value ?? field.default ?? ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          rows={3}
          placeholder={field.placeholder}
          className={`${inputBase} resize-none`}
        />
      </div>
    );
  }

  if (field.type === 'json') {
    const strValue =
      typeof value === 'string'
        ? value
        : value !== undefined && value !== null
          ? JSON.stringify(value, null, 2)
          : JSON.stringify(field.default ?? [], null, 2);
    let isValid = true;
    try {
      JSON.parse(strValue);
    } catch {
      isValid = false;
    }
    return (
      <div className="col-span-full flex flex-col gap-1.5">
        <label className="text-xs font-medium text-gray-400">
          {field.label}
        </label>
        {field.desc && (
          <p className="-mt-0.5 text-[11px] text-gray-600">{field.desc}</p>
        )}
        <textarea
          value={strValue}
          onChange={(e) => {
            const raw = e.target.value;
            try {
              const parsed = JSON.parse(raw);
              onChange(parsed);
            } catch {
              // Keep the raw string while user is typing
              onChange(raw);
            }
          }}
          disabled={disabled}
          rows={6}
          placeholder={field.placeholder || '[]'}
          className={`${inputBase} resize-y font-mono text-xs ${!isValid ? 'border-red-500/50' : ''}`}
        />
        {!isValid && (
          <p className="text-[11px] text-red-400">Invalid JSON format</p>
        )}
      </div>
    );
  }

  const FieldIcon = field.icon;
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-gray-400">{field.label}</label>
      <div className="relative">
        {FieldIcon && (
          <FieldIcon className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-gray-600" />
        )}
        <input
          type={field.type}
          value={value ?? field.default ?? ''}
          onChange={(e) => {
            const v =
              field.type === 'number' ? Number(e.target.value) : e.target.value;
            onChange(v);
          }}
          disabled={disabled}
          placeholder={field.placeholder}
          min={field.min}
          max={field.max}
          className={`${inputBase} ${FieldIcon ? 'pl-9' : ''}`}
        />
      </div>
    </div>
  );
}

// ─── Section Panel ─────────────────────────────────────────────────────────────

function SectionPanel({ section, initialSettings, adminId }) {
  // Build initial state from DB values or defaults
  const buildInitial = useCallback(() => {
    const s = {};
    section.fields.forEach((f) => {
      if (f.type === 'divider') return;
      s[f.key] =
        initialSettings[f.key] !== undefined
          ? initialSettings[f.key]
          : f.default;
    });
    return s;
  }, [section, initialSettings]);

  const [values, setValues] = useState(buildInitial);
  const [msg, setMsg] = useState(null); // {type, text}
  const [isPending, startSave] = useTransition();
  const [isReset, startReset] = useTransition();
  const [confirmReset, setConfirmReset] = useState(false);

  const busy = isPending || isReset;

  function handleChange(key, val) {
    setValues((prev) => ({ ...prev, [key]: val }));
  }

  function flash(type, text) {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3500);
  }

  async function handleSave() {
    startSave(async () => {
      // Validate JSON fields before saving
      for (const f of section.fields) {
        if (f.type === 'json' && typeof values[f.key] === 'string') {
          try {
            JSON.parse(values[f.key]);
          } catch {
            flash(
              'error',
              `Invalid JSON in "${f.label}". Fix the format and save again.`
            );
            return;
          }
        }
      }

      const entries = section.fields
        .filter((f) => f.type !== 'divider')
        .map((f) => ({
          key: f.key,
          value:
            typeof values[f.key] === 'string' && f.type === 'json'
              ? JSON.parse(values[f.key])
              : values[f.key],
          ...(f.category ? { category: f.category } : {}),
        }));

      const fd = new FormData();
      fd.set('category', section.id);
      fd.set('entries', JSON.stringify(entries));
      const result = await saveSettingsAction(fd);
      if (result?.error) {
        flash('error', result.error);
      } else {
        flash('success', 'Settings saved successfully');
      }
    });
  }

  async function handleReset() {
    startReset(async () => {
      const fd = new FormData();
      // If the section spans multiple categories, pass them all
      if (section.categories) {
        fd.set('categories', JSON.stringify(section.categories));
      }
      fd.set('category', section.id);
      const result = await resetCategoryAction(fd);
      setConfirmReset(false);
      if (result?.error) {
        flash('error', result.error);
      } else {
        setValues(buildInitial());
        flash('success', 'Reset to defaults');
      }
    });
  }

  return (
    <div>
      {/* Section header */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-white">{section.label}</h2>
        <p className="mt-0.5 text-sm text-gray-500">{section.description}</p>
      </div>

      {/* Flash message */}
      {msg && (
        <div
          className={`mb-5 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${
            msg.type === 'error'
              ? 'border-red-500/30 bg-red-500/10 text-red-300'
              : 'border-green-500/30 bg-green-500/10 text-green-300'
          }`}
        >
          {msg.type === 'error' ? (
            <AlertCircle className="h-4 w-4 shrink-0" />
          ) : (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          )}
          {msg.text}
        </div>
      )}

      {/* Fields */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {section.fields.map((field, i) => (
          <SettingField
            key={field.key ?? `divider-${i}`}
            field={field}
            value={field.key ? values[field.key] : undefined}
            onChange={(val) => handleChange(field.key, val)}
            disabled={busy}
          />
        ))}
      </div>

      {/* Footer actions */}
      <div className="mt-6 flex items-center justify-between border-t border-white/8 pt-5">
        {/* Reset */}
        {confirmReset ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Reset to defaults?</span>
            <button
              onClick={handleReset}
              disabled={busy}
              className="flex items-center gap-1.5 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 transition-colors hover:bg-red-500/20 disabled:opacity-50"
            >
              {isReset ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RotateCcw className="h-3 w-3" />
              )}
              Yes, reset
            </button>
            <button
              onClick={() => setConfirmReset(false)}
              className="px-1.5 text-xs text-gray-500 transition-colors hover:text-gray-300"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmReset(true)}
            disabled={busy}
            className="flex items-center gap-1.5 rounded-lg border border-white/8 bg-white/3 px-3 py-2 text-xs font-medium text-gray-500 transition-all hover:bg-white/6 hover:text-gray-300 disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset to defaults
          </button>
        )}

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={busy}
          className="flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/15 px-5 py-2.5 text-sm font-semibold text-blue-300 transition-all hover:scale-[1.02] hover:bg-blue-500/25 active:scale-95 disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isPending ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SettingsClient({ initialSettings, adminId }) {
  const [activeSection, setActiveSection] = useState('general');

  const currentSection = SECTIONS.find((s) => s.id === activeSection);

  return (
    <>
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            Settings
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage platform configuration
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">
          <Settings className="h-5 w-5 text-gray-400" />
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        {/* ── Sidebar ────────────────────────────────────────────── */}
        <aside className="shrink-0 lg:w-56">
          {/* Horizontal scroll on mobile */}
          <div className="scrollbar-none flex gap-1 overflow-x-auto pb-1 lg:hidden">
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              const active = activeSection === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium whitespace-nowrap transition-all ${
                    active
                      ? 'bg-white/12 text-white'
                      : 'text-gray-500 hover:bg-white/6 hover:text-gray-300'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {s.label}
                </button>
              );
            })}
          </div>

          {/* Vertical on desktop */}
          <nav className="hidden lg:flex lg:flex-col lg:gap-0.5">
            {SECTIONS.map((s, i) => {
              const Icon = s.icon;
              const active = activeSection === s.id;
              const prevGroup = i > 0 ? SECTIONS[i - 1].group : undefined;
              const showGroupLabel = s.group && s.group !== prevGroup;
              return (
                <div key={s.id}>
                  {showGroupLabel && (
                    <p className="mt-4 mb-1 px-3 text-[10px] font-semibold tracking-widest text-gray-600 uppercase">
                      Website Content
                    </p>
                  )}
                  <button
                    onClick={() => setActiveSection(s.id)}
                    className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                      active
                        ? 'bg-white/10 text-white shadow-sm'
                        : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 shrink-0 ${active ? 'text-blue-400' : 'text-gray-600 group-hover:text-gray-400'}`}
                    />
                    <span className="flex-1 text-left">{s.label}</span>
                    {active && (
                      <ChevronRight className="h-3 w-3 text-gray-500" />
                    )}
                  </button>
                </div>
              );
            })}
          </nav>
        </aside>

        {/* ── Content ────────────────────────────────────────────── */}
        <div className="min-w-0 flex-1 rounded-2xl border border-white/8 bg-white/3 p-5 backdrop-blur-sm sm:p-6">
          {currentSection && (
            <SectionPanel
              key={currentSection.id}
              section={currentSection}
              initialSettings={initialSettings}
              adminId={adminId}
            />
          )}
        </div>
      </div>
    </>
  );
}
