# Adding a New Feature

Step-by-step guide for adding a new feature to the NEUPC Platform.

This example walks through adding a hypothetical **"Bootcamp"** feature — a CRUD module with a public page and admin management.

---

## 1. Plan the Database Schema

Design the table(s) in SQL and add them to `docs/database/schema.sql`:

```sql
CREATE TABLE public.bootcamps (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  content text,                    -- rich text (TipTap HTML)
  category text DEFAULT 'general',
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  featured boolean DEFAULT false,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  max_participants integer DEFAULT 50,
  view_count integer DEFAULT 0,
  created_by uuid REFERENCES users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE bootcamps ENABLE ROW LEVEL SECURITY;

-- Public can read published bootcamps
CREATE POLICY "Public read" ON bootcamps FOR SELECT USING (status = 'published');
```

Run the SQL in Supabase SQL Editor.

---

## 2. Add Data-Service Functions

Add CRUD functions to `app/_lib/data-service.js`:

```js
// ── Bootcamps ───────────────────────────────────────────────────────────────

export async function getAllBootcamps() {
  const { data, error } = await supabaseAdmin
    .from('bootcamps')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getPublishedBootcamps() {
  const { data, error } = await supabase
    .from('bootcamps')
    .select('*')
    .eq('status', 'published')
    .order('start_date', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getBootcampBySlug(slug) {
  const { data, error } = await supabase
    .from('bootcamps')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();
  if (error) return null;
  return data;
}

export async function createBootcamp(data) {
  const { data: result, error } = await supabaseAdmin
    .from('bootcamps')
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return result;
}

export async function updateBootcamp(id, data) {
  const { error } = await supabaseAdmin
    .from('bootcamps')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteBootcamp(id) {
  const { error } = await supabaseAdmin
    .from('bootcamps')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
```

---

## 3. Add Cached Public Fetchers

Add to `app/_lib/public-actions.js`:

```js
export const getPublicBootcamps = unstable_cache(
  async () => {
    const { getPublishedBootcamps } = await import('./data-service');
    return getPublishedBootcamps();
  },
  ['public-bootcamps'],
  { tags: ['bootcamps'], revalidate: 3600 }
);
```

---

## 4. Create Server Actions

Create `app/_lib/bootcamp-actions.js`:

```js
'use server';

import { requireRole } from '@/app/_lib/auth-guard';
import { sanitizeRichText, sanitizeText } from '@/app/_lib/validation';
import {
  createBootcamp,
  updateBootcamp,
  deleteBootcamp,
} from '@/app/_lib/data-service';
import { revalidatePath, revalidateTag } from 'next/cache';

export async function createBootcampAction(formData) {
  await requireRole(['executive', 'admin']);

  const title = sanitizeText(formData.get('title'), 200);
  const content = sanitizeRichText(formData.get('content'));
  const slug = title.toLowerCase().replace(/\s+/g, '-');

  await createBootcamp({ title, content, slug, status: 'draft' });

  revalidateTag('bootcamps');
  revalidatePath('/account/admin/bootcamps');
}

export async function deleteBootcampAction(id) {
  await requireRole('admin');
  await deleteBootcamp(id);
  revalidateTag('bootcamps');
  revalidatePath('/account/admin/bootcamps');
}
```

**Checklist for every server action:**
- ✅ `requireRole()` as first line
- ✅ Input validated/sanitized
- ✅ `supabaseAdmin` used for writes (via data-service)
- ✅ `revalidatePath()` / `revalidateTag()` after mutation

---

## 5. Create the Public Page

Create `app/bootcamps/page.js`:

```js
import { getPublicBootcamps } from '@/app/_lib/public-actions';
import BootcampsClient from './BootcampsClient';

export const metadata = {
  title: 'Bootcamps | NEUPC',
  description: 'Intensive coding bootcamp programs by NEUPC.',
};

export default async function BootcampsPage() {
  const bootcamps = await getPublicBootcamps();
  return <BootcampsClient bootcamps={bootcamps} />;
}
```

Create `app/bootcamps/BootcampsClient.js`:

```js
'use client';

export default function BootcampsClient({ bootcamps }) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-display font-bold">Bootcamps</h1>
      {/* Render bootcamp cards */}
    </div>
  );
}
```

---

## 6. Create the Admin Page

Create `app/account/admin/bootcamps/page.js`:

```js
import { requireRole } from '@/app/_lib/auth-guard';
import { getAllBootcamps } from '@/app/_lib/data-service';

export default async function AdminBootcampsPage() {
  await requireRole('admin');
  const bootcamps = await getAllBootcamps();

  return <BootcampsManager bootcamps={bootcamps} />;
}
```

---

## 7. Add to Sidebar Navigation

Update `app/_lib/sidebarConfig.js`:

```js
admin: [
  // ... existing items
  {
    label: 'Bootcamps',
    href: '/account/admin/bootcamps',
    icon: AcademicCapIcon,
  },
],
```

---

## 8. Update Sitemap and SEO

Add the new route to `app/sitemap.js`:

```js
// Inside the generate function, add:
const bootcamps = await getPublicBootcamps();
const bootcampEntries = bootcamps.map((b) => ({
  url: `${baseUrl}/bootcamps/${b.slug}`,
  lastModified: b.updated_at,
}));
```

---

## 9. Update Documentation

1. Add the table to `docs/database/index.md`
2. Add functions to `docs/architecture/data-service.md`
3. Add actions to `docs/architecture/server-actions.md`
4. Add the feature to `docs/product/features.md`
5. Add routes to `docs/product/roles-and-pages.md`

---

## Summary Checklist

```
✓ Database table created with RLS
✓ data-service.js functions added
✓ Public fetcher cached in public-actions.js
✓ Server actions created with requireRole() + validation
✓ Public page created (server component + client component)
✓ Admin management page created
✓ Sidebar navigation updated
✓ Sitemap updated
✓ Documentation updated
✓ npm run lint && npm run build → clean
```
