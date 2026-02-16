# Next.js Project Setup Guide

## Netrokona University Programming Club Website

**Version:** 1.0  
**Last Updated:** February 2026  
**Stack:** Next.js 15+ (App Router), React 19, JavaScript, Tailwind CSS, Supabase

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Project Initialization](#2-project-initialization)
3. [Project Structure](#3-project-structure)
4. [Essential Dependencies](#4-essential-dependencies)
5. [Configuration Files](#5-configuration-files)
6. [Supabase Setup](#6-supabase-setup)
7. [Environment Setup](#7-environment-setup)
8. [Development Workflow](#8-development-workflow)
9. [Deployment Preparation](#9-deployment-preparation)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Prerequisites

### 1.1 Required Software

Install the following before starting:

**Node.js** (v20.20.0 or later)

```bash
# Check version
node --version
# Should be v18.17.0 or higher (mine: v24.12.0)

# Install via nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
# nvm --version -> 0.40.3

nvm install 20
nvm use 20
# node --version -> v20.20.0
```

**Package Manager** (choose one)

```bash
# npm (comes with Node.js)
npm --version # 10.8.2

# or yarn
npm install -g yarn
yarn --version # 1.22.22

# or pnpm (recommended for better performance)
npm install -g pnpm
pnpm --version # 10.29.3
```

**Git**

```bash
git --version # git version 2.43.0
```

**Code Editor**

- VS Code (recommended) with extensions:
  - ES7+ React/Redux/React-Native snippets
  - Tailwind CSS IntelliSense
  - Prettier - Code formatter
  - ESLint

### 1.2 Knowledge Requirements

- React fundamentals (components, hooks, props)
- Modern JavaScript (ES6+: arrow functions, destructuring, async/await)
- CSS fundamentals
- Git basics
- Basic understanding of REST APIs

### 1.3 Supabase Account

- Sign up for free at [supabase.com](https://supabase.com)
- Create a new project
- Note your project URL and anon key

---

## 2. Project Initialization

### 2.1 Create Next.js App (JavaScript)

```bash
# Navigate to your projects directory
cd ~/Documents/GitHub

# Create new Next.js app with JavaScript and Tailwind
npx create-next-app@latest neupc
# Need to install the following packages:
# create-next-app@16.1.6
# Ok to proceed? (y) y

# ✔ Would you like to use the recommended Next.js defaults? › No, customize settings
# ✔ Would you like to use TypeScript? … No / Yes
# ✔ Which linter would you like to use? › ESLint
# ✔ Would you like to use React Compiler? … No / Yes
# ✔ Would you like to use Tailwind CSS? … No / Yes
# ✔ Would you like your code inside a `src/` directory? … No / Yes
# ✔ Would you like to use App Router? (recommended) … No / Yes
# ✔ Would you like to customize the import alias (`@/*` by default)? … No / Yes
# Creating a new Next.js app in /home/eyasir329/Documents/GitHub/neupc.
```

### 2.2 Navigate to Project

```bash
cd neupc
ls

# app   eslint.config.mjs  LICENSE          node_modules  package-lock.json   public     types
# docs  jsconfig.json      next.config.mjs  package.json  postcss.config.mjs  README.md
```

### 2.3 Verify Installation

```bash
# Install dependencies (if not already done)
npm install

# Start development server
npm run dev

# Open browser at http://localhost:3000
```

You should see the Next.js welcome page.

---

## 3. Project Structure

### 3.1 Current Project Structure

```
neupc/
├── app/                      # Next.js App Router
│   ├── _components/          # React components (private route)
│   │   ├── ui/              # Reusable UI components
│   │   │   └── ...
│   │   ├── layout/          # Layout components
│   │   │   └── ...
│   │   ├── sections/        # Page sections
│   │   │   ├── Navigation.js
│   │   │   └── ...
│   │   └── features/        # Feature-specific components
│   │       └── ...
│   ├── _lib/                # Utility functions (private route)
│   │   ├── supabase.js      # Supabase client
│   │   ├── utils.js
│   │   └── constants.js
│   ├── _styles/             # Additional styles (private route)
│   │   └── custom.css
│   ├── about/
│   │   └── page.js
│   ├── account/
│   │   └── page.js
│   ├── achievements/
│   │   └── page.js
│   ├── api/                 # API routes
│   │   ├── contact/
│   │   │   └── route.js
│   │   └── join/
│   │       └── route.js
│   ├── blogs/
│   │   └── page.js
│   ├── committee/
│   │   └── page.js
│   ├── contact/
│   │   └── page.js
│   ├── developers/
│   │   └── page.js
│   ├── events/
│   │   └── page.js
│   ├── gallery/
│   │   └── page.js
│   ├── join/
│   │   └── page.js
│   ├── login/
│   │   └── page.js
│   ├── roadmaps/
│   │   └── page.js
│   ├── error.js             # Error boundary
│   ├── layout.js            # Root layout
│   ├── loading.js           # Loading UI
│   ├── not-found.js         # 404 page
│   └── page.js              # Home page
├── docs/                    # Documentation
│   ├── nextjs-project-setup.md
│   ├── public-page-design-guide.md
│   └── public-website-documentation.md
├── public/                  # Static assets
│   ├── logo.png
│   └── (images, fonts, etc.)
├── .env.local               # Environment variables (not committed)
├── .env.example             # Example env file (committed)
├── .gitignore               # Git ignore rules
├── eslint.config.mjs        # ESLint configuration
├── jsconfig.json            # JavaScript configuration
├── next.config.mjs          # Next.js configuration
├── package.json             # Dependencies and scripts
├── postcss.config.mjs       # PostCSS configuration
└── README.md                # Project documentation
```

**Note:** Folders prefixed with `_` (like `_components`, `_lib`, `_styles`) are treated as private routes in Next.js and won't be accessible via URL.

### 3.2 Create Additional Directories (if needed)

```bash
# Create image subdirectories in public folder
mkdir -p public/images/{hero,events,team,gallery}

# Create additional component subdirectories if needed
# (The main structure already exists in app/_components/)

# The following already exist in your project:
# - app/_components/{ui,layout,sections,features}
# - app/_lib/
# - app/_styles/
```

---

## 4. Essential Dependencies

### 4.1 Core Dependencies (Already Installed)

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  }
}
```

### 4.2 Supabase

```bash
# Install Supabase client
npm install @supabase/supabase-js

# Install Supabase SSR helpers (for Next.js App Router)
npm install @supabase/ssr
```

### 4.3 UI & Styling

```bash
# Tailwind CSS (should already be installed)
npm install -D tailwindcss postcss autoprefixer

# Class variance authority (for component variants)
npm install class-variance-authority

# Tailwind merge (for conditional classes)
npm install tailwind-merge

# clsx (conditional classnames)
npm install clsx

# Lucide React (icons)
npm install lucide-react

# OR Heroicons
npm install @heroicons/react
```

### 4.4 Forms & Validation

```bash
# React Hook Form (form management)
npm install react-hook-form

# Zod (schema validation)
npm install zod

# React Hook Form Zod resolver
npm install @hookform/resolvers
```

### 4.5 Content Management

**For Markdown-based content (Simple, No Database)**

```bash
# Markdown processing
npm install gray-matter remark remark-html

# Syntax highlighting for code blocks
npm install rehype-highlight
```

### 4.6 Additional Utilities

```bash
# Date formatting
npm install date-fns

# Animations (optional)
npm install framer-motion

# Email sending (for contact forms)
npm install nodemailer

# React Hot Toast (notifications)
npm install react-hot-toast
```

### 4.7 Development Dependencies

```bash
# Prettier (code formatting)
npm install -D prettier prettier-plugin-tailwindcss

# ESLint plugins
npm install -D eslint-config-prettier
```

---

## 5. Configuration Files

### 5.1 JavaScript Configuration

Update `jsconfig.json` (should already exist):

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "exclude": ["node_modules", ".next"]
}
```

### 5.2 Tailwind Configuration

Create `tailwind.config.mjs` (ESM format for Tailwind v4):

```javascript
/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EBF4F6',
          100: '#D6E9EC',
          200: '#B0D3D9',
          300: '#8ABDC6',
          400: '#64A7B3',
          500: '#088395', // MAIN PRIMARY
          600: '#077485',
          700: '#066575',
          800: '#055665',
          900: '#09637E', // DEEP PRIMARY
        },
        secondary: {
          50: '#F3FAFA',
          100: '#E7F4F4',
          200: '#CFE9E9',
          300: '#B7DEDE',
          400: '#9FD3D3',
          500: '#7AB2B2', // SOFT TEAL
          600: '#5E9C9C',
          700: '#468585',
          800: '#2F6E6E',
          900: '#1A5757',
        },
        background: {
          light: '#EBF4F6',
          dark: '#0F172A',
        },
      },

      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },

      boxShadow: {
        glow: '0 0 20px rgba(8, 131, 149, 0.35)',
        soft: '0 10px 25px rgba(0,0,0,0.08)',
      },

      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
      },
    },
  },
  plugins: [],
};

export default config;
```

**Note:** This project uses Tailwind CSS v4 with the `@tailwindcss/postcss` plugin. The color scheme features a modern teal/cyan primary color (#088395) with complementary secondary colors and dark mode support.

### 5.3 Next.js Configuration

Update `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co', // Allow Supabase storage images
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  // Enable React strict mode
  reactStrictMode: true,
  
  // Optimize packages
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
}

export default nextConfig;
```

### 5.4 ESLint Configuration

Update `eslint.config.mjs` (should already exist with Next.js 15+):

```javascript
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig([
  ...nextVitals,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
```

**Note:** Next.js 15+ uses the new flat config format (`eslint.config.mjs`) instead of the legacy `.eslintrc.json` format.

### 5.5 Prettier Configuration

Create `.prettierrc`:

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "tabWidth": 2,
  "useTabs": false,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

### 5.5.1 VS Code Settings

Create `.vscode/settings.json` to prevent CSS lint warnings for Tailwind directives:

```json
{
  "css.lint.unknownAtRules": "ignore",
  "scss.lint.unknownAtRules": "ignore",
  "less.lint.unknownAtRules": "ignore"
}
```

**Note:** This prevents VS Code from showing "Unknown at rule" warnings for Tailwind's `@config`, `@import`, and `@layer` directives.

### 5.6 PostCSS Configuration

Update `postcss.config.mjs`:

```javascript
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
};

export default config;
```

**Note:** Tailwind CSS v4 uses `@tailwindcss/postcss` instead of the traditional `tailwindcss` PostCSS plugin.

### 5.7 Global Styles

Update `app/_styles/global.css`:

```css
@config '../../tailwind.config.mjs';
@import 'tailwindcss';

@layer base {
  :root {
    --foreground-rgb: 15, 23, 42; /* slate-900 */
    --background-rgb: 235, 244, 246; /* #EBF4F6 */
  }

  .dark {
    --foreground-rgb: 226, 232, 240; /* slate-200 */
    --background-rgb: 15, 23, 42; /* dark background */
  }

  body {
    color: rgb(var(--foreground-rgb));
    background: rgb(var(--background-rgb));
    font-family: var(--font-inter), 'Inter', sans-serif;
    @apply antialiased;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    font-family: var(--font-heading), 'Space Grotesk', sans-serif;
    font-weight: 600;
    @apply tracking-tight;
  }

  h1 {
    @apply text-4xl font-bold md:text-5xl;
  }
  h2 {
    @apply text-3xl md:text-4xl;
  }
  h3 {
    @apply text-2xl md:text-3xl;
  }
}

@layer components {
  /* ======================
     Loading Spinners
  ====================== */

  .spinner {
    margin: 3.2rem auto 1.6rem;
    width: 60px;
    aspect-ratio: 1;
    border-radius: 50%;
    @apply border-primary-600 border-8 border-r-transparent;
    animation: rotate 1s infinite linear;
  }

  .spinner-mini {
    width: 20px;
    aspect-ratio: 1;
    border-radius: 50%;
    @apply border-primary-400 border-2 border-r-transparent;
    animation: rotate 1s infinite linear;
  }

  /* ======================
     Buttons
  ====================== */

  .btn-primary {
    @apply bg-primary-500 hover:bg-primary-600 shadow-soft hover:shadow-glow rounded-xl px-6 py-3 font-semibold text-white transition-all duration-300;
  }

  .btn-secondary {
    @apply border-primary-500 text-primary-600 hover:bg-primary-500 rounded-xl border-2 px-6 py-3 font-semibold transition-all duration-300 hover:text-white;
  }

  .btn-ghost {
    @apply text-primary-600 hover:bg-primary-100 rounded-lg px-5 py-2 transition-colors duration-200;
  }

  /* ======================
     Cards
  ====================== */

  .card {
    @apply shadow-soft rounded-2xl bg-white p-6 transition-all duration-300 dark:bg-slate-800;
  }

  .card-hover {
    @apply hover:shadow-glow hover:-translate-y-1;
  }

  /* ======================
     Section Spacing
  ====================== */

  .section {
    @apply py-16 md:py-24;
  }

  /* ======================
     Custom Container
  ====================== */

  .container-custom {
    @apply mx-auto max-w-7xl px-6 lg:px-8;
  }

  /* ======================
     Animations
  ====================== */

  @keyframes rotate {
    to {
      transform: rotate(1turn);
    }
  }
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }

  .gradient-primary {
    @apply from-primary-900 to-primary-500 bg-gradient-to-r text-white;
  }

  .glass {
    @apply border border-white/30 bg-white/60 backdrop-blur-md;
  }
}
```

**Note:** Tailwind v4 uses `@config` to specify the config file path and `@import 'tailwindcss'` instead of the old `@tailwind` directives. This configuration includes:

- **Dark mode support** with CSS variables for foreground/background colors
- **Responsive typography** with specific heading sizes
- **Enhanced button styles** (primary, secondary, ghost variants) with hover effects
- **Card components** with shadow and hover animations
- **Section spacing** utilities for consistent layout
- **Custom utility classes** for gradients and glassmorphism effects

### 5.8 Typography & Fonts

**Font Stack:**

- **Headings:** Space Grotesk - Modern, techy, strong personality
- **Body Text:** Inter - Extremely readable, clean, professional  
- **Code/Monospace:** JetBrains Mono - Developer-friendly

These fonts create a perfect balance for a university programming club website - professional yet modern.

**Setup:**

Add to Tailwind config (`tailwind.config.mjs`) in the `theme.extend` section:

```javascript
theme: {
  extend: {
    fontFamily: {
      sans: ['Inter', 'sans-serif'],
      heading: ['Space Grotesk', 'sans-serif'],
      mono: ['JetBrains Mono', 'monospace'],
    },
    // ... existing colors config
  },
},
```

**Load fonts in your layout** (`app/layout.js`):

```javascript
import { Space_Grotesk, Inter, JetBrains_Mono } from 'next/font/google';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-heading',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
});

export default function RootLayout({ children }) {
  return (
    <html 
      lang="en" 
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <body className={`${inter.className} bg-background-dark text-primary-50 min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
```

**Usage in components:**

```javascript
// Typography (automatic from global.css)
<h1>This heading uses Space Grotesk automatically</h1>
<p>Body text uses Inter automatically</p>

// Override with Tailwind utilities when needed
<h2 className="font-sans">Heading with Inter instead</h2>
<p className="font-heading">Body text with Space Grotesk</p>
<code className="font-mono">const code = 'JetBrains Mono';</code>

// Buttons with custom classes
<button className="btn-primary">Primary Action</button>
<button className="btn-secondary">Secondary Action</button>
<button className="btn-ghost">Ghost Button</button>

// Cards
<div className="card card-hover">
  <h3>Card Title</h3>
  <p>Card content with soft shadow and hover effect</p>
</div>

// Sections and containers
<section className="section">
  <div className="container-custom">
    <h2>Section content</h2>
  </div>
</section>

// Utility classes
<div className="gradient-primary">Gradient background</div>
<div className="glass">Glassmorphism effect</div>
<p className="text-balance">Balanced text wrapping</p>

// Loading states
<div className="spinner"></div>
<div className="spinner-mini"></div>
```

**Note:** The CSS variables (`--font-inter`, `--font-heading`, `--font-mono`) are automatically applied in `global.css`, so headings use Space Grotesk and body text uses Inter by default.

---

## 6. Supabase Setup

### 6.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign in / Create account
3. Click "New Project"
4. Choose organization
5. Set project details:
   - Name: `neupc-website`
   - Database Password: (generate strong password)
   - Region: Choose closest to your users
6. Click "Create new project"
7. Wait for project to be ready (~2 minutes)

### 6.2 Get API Credentials

From your Supabase dashboard:

1. Go to **Settings** → **API**
2. Copy:
   - Project URL
   - Project API keys → `anon` `public`

### 6.3 Create Database Tables

**⚡ Comprehensive Database Schema Available**

The NEUPC project uses a comprehensive database schema that supports:

- ✅ Role-based access control (6 roles: guest, member, executive, admin, mentor, advisor)
- ✅ User authentication & authorization
- ✅ Member profiles with competitive programming statistics
- ✅ Event & contest management
- ✅ Achievement tracking & certificates
- ✅ Content management (blogs, roadmaps, resources)
- ✅ Mentorship program
- ✅ Discussion forums
- ✅ Budget tracking
- ✅ Analytics & reporting

**📄 Full Schema Files:**

1. **`docs/database-schema.sql`** - Complete SQL schema (45+ tables)
2. **`docs/database-documentation.md`** - Detailed documentation with ERD

**🚀 Quick Setup:**

Go to **SQL Editor** in Supabase dashboard and run the complete schema from:

```bash
docs/database-schema.sql
```

**📊 Database Structure Overview:**

1. **Authentication & User Management** (6 tables)
   - users, roles, user_roles, permissions, role_permissions

2. **Member Profiles** (2 tables)
   - member_profiles, member_statistics

3. **Committee & Team** (2 tables)
   - committee_positions, committee_members

4. **Events & Activities** (3 tables)
   - events, event_registrations, event_gallery

5. **Contests & Competitions** (4 tables)
   - contests, contest_participants, weekly_tasks, task_submissions

6. **Achievements & Certifications** (3 tables)
   - achievements, member_achievements, certificates

7. **Content Management** (5 tables)
   - blog_posts, blog_comments, roadmaps, resources, notices

8. **Mentorship Program** (3 tables)
   - mentorships, mentorship_sessions, member_progress

9. **Discussions & Community** (4 tables)
   - discussion_categories, discussion_threads, discussion_replies, discussion_votes

10. **Forms & Submissions** (2 tables)
    - contact_submissions, join_requests

11. **System & Settings** (4 tables)
    - website_settings, activity_logs, notifications, budget_entries

**🔐 Security Features:**

- Row Level Security (RLS) policies
- Role-based access control
- Activity logging & audit trail
- Encrypted password storage

**📈 Performance Features:**

- Comprehensive indexing
- Materialized views for analytics
- Optimized foreign key relationships
- JSONB for flexible data storage

See **`docs/database-documentation.md`** for complete details including:

- Entity Relationship Diagram
- Table descriptions & relationships
- Migration strategy
- Security considerations
- Performance optimization

### 6.4 Create Supabase Client

Create `app/_lib/supabase.js`:

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 6.5 Example: Fetch Data from Supabase

Create `app/_lib/api.js`:

```javascript
import { supabase } from './supabase';

// Fetch all upcoming events
export async function getUpcomingEvents() {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'upcoming')
    .order('start_date', { ascending: true });

  if (error) {
    console.error('Error fetching events:', error);
    return [];
  }

  return data;
}

// Fetch single event by slug
export async function getEventBySlug(slug) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('Error fetching event:', error);
    return null;
  }

  return data;
}

// Fetch all blog posts
export async function getBlogPosts(limit = 10) {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching blog posts:', error);
    return [];
  }

  return data;
}

// Fetch single blog post by slug
export async function getBlogPostBySlug(slug) {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('Error fetching blog post:', error);
    return null;
  }

  return data;
}

// Fetch team members
export async function getTeamMembers(type = 'executive') {
  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .eq('member_type', type)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching team members:', error);
    return [];
  }

  return data;
}

// Fetch achievements
export async function getAchievements(year = null) {
  let query = supabase
    .from('achievements')
    .select('*')
    .order('year', { ascending: false });

  if (year) {
    query = query.eq('year', year);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching achievements:', error);
    return [];
  }

  return data;
}

// Submit contact form
export async function submitContactForm(formData) {
  const { data, error } = await supabase
    .from('contact_submissions')
    .insert([formData])
    .select();

  if (error) {
    console.error('Error submitting contact form:', error);
    throw error;
  }

  return data;
}

// Submit join request
export async function submitJoinRequest(formData) {
  const { data, error} = await supabase
    .from('join_requests')
    .insert([formData])
    .select();

  if (error) {
    console.error('Error submitting join request:', error);
    throw error;
  }

  return data;
}
```

---

## 7. Environment Setup

### 7.1 Create Environment Files

Create `.env.local` (not committed to git):

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME="Netrokona University Programming Club"

# Email (for contact forms - optional if using Supabase email)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
EMAIL_FROM="noreply@neupc.edu"
EMAIL_TO="contact@neupc.edu"
```

Create `.env.example` (committed to git):

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Application
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_APP_NAME=

# Email (optional)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
EMAIL_FROM=
EMAIL_TO=
```

---

## 8. Development Workflow

### 8.1 Package Scripts

Update `package.json` scripts:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "format": "prettier --write ."
  }
}
```

### 8.2 Git Setup

Initialize git (if not already):

```bash
git init
git add .
git commit -m "Initial commit: Next.js project with Supabase"
```

Update `.gitignore`:

```
# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local
.env

# vercel
.vercel
```

### 8.3 Development Commands

```bash
# Start development server
npm run dev

# Lint code
npm run lint

# Format code
npm run format

# Build for production
npm run build

# Start production server
npm run start
```

---

## 9. Deployment Preparation

### 9.1 Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Production deployment
vercel --prod
```

**Environment Variables in Vercel:**

1. Go to Vercel dashboard
2. Select your project
3. Settings → Environment Variables
4. Add all variables from `.env.local`

### 9.2 Other Platforms

**Netlify:**

```bash
npm install -g netlify-cli
netlify deploy
```

**Railway / Render:**

- Connect GitHub repository
- Add environment variables
- Auto-deploy on push

### 9.3 Pre-deployment Checklist

- [ ] All environment variables set in hosting platform
- [ ] Supabase production database ready
- [ ] Build succeeds locally (`npm run build`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] Images optimized
- [ ] SEO metadata added
- [ ] Analytics configured (if needed)
- [ ] Contact/Join forms tested with Supabase

---

## 10. Troubleshooting

### 10.1 Common Issues

**Issue: Port 3000 already in use**

```bash
# Kill process on port 3000
npx kill-port 3000

# Or use different port
npm run dev -- -p 3001
```

**Issue: Module not found**

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Issue: Tailwind classes not working**

```bash
# Ensure content paths are correct in tailwind.config.js
# Restart dev server
```

**Issue: Supabase connection error**

- Check environment variables are set correctly
- Verify Supabase project is active
- Check API keys are correct (use anon/public key)
- Ensure RLS policies allow public read

**Issue: CORS errors with Supabase**

- Supabase handles CORS automatically
- If issues persist, check you're using the correct URL
- Ensure you're using `@supabase/supabase-js` client

### 10.2 Performance Optimization

```bash
# Analyze bundle size
npm install -D @next/bundle-analyzer

# Add to next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer(nextConfig)

# Run analysis
ANALYZE=true npm run build
```

---

## Quick Start Checklist

- [ ] Node.js 18+ installed
- [ ] Supabase account created
- [ ] Supabase project created
- [ ] Project created with `create-next-app` (JavaScript)
- [ ] Dependencies installed
- [ ] Tailwind configured with design system colors
- [ ] Supabase client installed
- [ ] Database tables created
- [ ] Environment variables set up
- [ ] Git initialized
- [ ] Development server running
- [ ] First API call to Supabase successful

---

## Example Component

Here's a simple example using Supabase data:

`app/events/page.js`:

```javascript
import { getUpcomingEvents } from '@/app/_lib/api';

export default async function EventsPage() {
  const events = await getUpcomingEvents();

  return (
    <div className="container-custom py-12">
      <h1 className="text-4xl font-bold mb-8">Upcoming Events</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <div key={event.id} className="border rounded-lg p-6">
            <h2 className="text-xl font-semibold">{event.title}</h2>
            <p className="text-gray-600 mt-2">{event.description}</p>
            <p className="text-sm text-gray-500 mt-4">
              {new Date(event.start_date).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Next Steps

After initialization:

1. **Create Base Components**
   - Header, Footer, Button, Card

2. **Set Up Layouts**
   - Root layout with navigation

3. **Create Pages**
   - Home, About, Events, Blog, etc.

4. **Connect to Supabase**
   - Fetch and display data

5. **Implement Forms**
   - Contact, Join forms with Supabase

6. **Optimize**
   - Images, fonts, performance

7. **Deploy**
   - Connect to Vercel

---

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

**Document Owner:** Netrokona University Programming Club Development Team  
**For Questions:** Contact the website development team lead
