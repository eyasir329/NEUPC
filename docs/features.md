# Features

Every feature module, the user roles that access it, and the server actions that power it.

---

## Public Site

Seventeen server-rendered public pages, all with ISR caching via `public-actions.js`.

| Route | Description |
|---|---|
| `/` | Homepage — featured events, trending blogs, achievements, club stats |
| `/events` + `/events/[slug]` | Published events list and detail |
| `/blogs` + `/blogs/[slug]` | Blog posts with Giscus comments |
| `/achievements` | All-time results — filter by year, category |
| `/committee` | Current committee positions |
| `/gallery` | Photo albums — filter by event, category |
| `/roadmaps` + `/roadmaps/[slug]` | Learning path roadmaps |
| `/join` | Join request form → email notification |
| `/contact` | Contact form → Nodemailer email |
| `/about` `/developers` `/privacy` `/terms` | Static pages |

---

## Blog & Content Management

**Access:** Executive (create/manage own), Admin (all posts)

**Editor:** TipTap v3 — 12 extensions including StarterKit, TextAlign, Highlight, Color, Link, Image, CodeBlockLowlight (syntax highlighting via lowlight), CharacterCount, Typography, Placeholder.

**Capabilities:**

- Title, slug (auto-generated, editable), excerpt, thumbnail upload to Supabase Storage
- Category assignment, status toggle (`draft` → `published`), featured toggle
- View count tracking, like toggle
- Ctrl+S to save, sort by newest/oldest/views/alpha, grid/table view
- Comment moderation — approve, reject, delete, bulk actions

**Server actions:** `blog-actions.js`, `executive-actions.js`

---

## Event Management

**Access:** Executive (create/manage), Member (register/cancel), Advisor (view), Admin (all)

**Capabilities:**

- Full event lifecycle: `draft` → `published` → `archived`
- Registration with capacity enforcement, cancellation
- Attendance marking per registrant
- Organizer assignment, event-linked gallery items
- Featured events surfaced on homepage

**Server actions:** `event-actions.js`, `member-events-actions.js`, `executive-actions.js`

---

## Contest Tracking

**Access:** Member (join/leave), Executive (manage), Admin

**Capabilities:**

- Link contests to platforms (Codeforces, LeetCode, AtCoder, etc.)
- Members join and leave; participant list with standings per contest
- Filter by platform, upcoming vs past, official vs unofficial

**Server actions:** `member-contests-actions.js`, `executive-actions.js`

---

## Discussion Forum

**Access:** Member (full), Admin (moderate)

**Capabilities:**

- Thread categories (admin-managed)
- Create threads with rich text, tags, category
- Nested replies with parent reference
- Mark thread solved, mark reply as accepted solution
- Upvote/downvote threads and replies (toggle, idempotent)
- Pin and lock threads (admin/executive)
- View count per thread, pagination

**Server actions:** `member-discussions-actions.js`

---

## Mentorship Program

**Access:** Mentor (manage tasks/sessions), Member (submit tasks), Advisor (view), Admin

**Capabilities:**

- Mentor assigned to one or more mentees
- Status: `active` / `completed` / `paused`
- Session logs — date, topic, duration, notes, outcome
- Weekly tasks — assign, submit (URL + code + notes), review (accept/reject + feedback)
- Bulk task submission status updates
- Private mentor notes per mentee
- Progress tracking via `member_progress` table
- Recommendation writing

**Server actions:** `mentor-actions.js`, `member-tasks-actions.js`

---

## Chat System

**Access:** All authenticated users  
**Location:** Floating panel (bottom-right corner of all `/account/*` pages)

**Architecture:** Supabase Realtime subscriptions for live delivery. Server Actions handle all writes via `supabaseAdmin`.

**Conversation types:**

- **Direct (1:1)** — any user to any other user
- **Support** — guest/member raises a ticket; executive/admin claims it from the support inbox

**Capabilities:**

- Send text messages, file attachments
- Edit and delete own messages
- Unread badge across conversations, mark-as-read
- User search to start new conversations
- Close conversations

**Components:** `ChatPanel`, `ChatPanelHeader`, `ConversationItem`, `MessageThread`, `MessageBubble`, `MessageComposer`, `NewChatPicker`, `EmptyState`

**Server actions:** `chat-actions.js` (15 functions)

---

## Achievement System

**Access:** Admin (manage), Advisor (review), Member (view personal)

**Capabilities:**

- Achievements with year, category, position, platform
- Link multiple members to a single achievement record
- Filter by year and category
- Most-earned achievements view, member achievement portfolio

**Server actions:** `achievement-actions.js`

---

## Gallery

**Access:** Public (view), Executive (manage), Admin

**Capabilities:**

- Image URL, title, description, event link, category, featured flag
- Bulk upload (multiple items in one action)
- Filter by event and category
- Featured items shown on homepage

**Server actions:** `gallery-actions.js`, `executive-actions.js`

---

## Resource Library

**Access:** Public (browse), Member (upvote), Mentor (create/delete), Admin

**Fields:** title, URL, category, difficulty (beginner/intermediate/advanced), free flag, featured flag, upvote count.

**Capabilities:**

- Filter by category, difficulty, free vs paid
- Upvoting — idempotent per member
- Mentor creates resources for assigned mentees

**Server actions:** `resource-actions.js`, `mentor-actions.js`, `member-resources-actions.js`

---

## Roadmaps

**Access:** Public  
Slug-based learning path pages, category filter, view count tracking, published/draft status.

---

## Notifications

**Access:** All authenticated users

System notifications triggered by: application approved, task reviewed, message received, event registered, etc.

**Capabilities:** Paginated list, mark single read, mark all read, delete.

**Server actions:** `notification-actions.js`

---

## Certificate System

**Access:** Executive (issue), Member (view)

**Capabilities:**

- Issue per-member per-event certificates with unique certificate numbers
- Bulk issue to all event attendees
- Public verification endpoint by certificate number

**Server actions:** `executive-actions.js` (`execCreateCertificateAction`, `execBulkCreateCertificatesAction`)

---

## Budget Management

**Access:** Advisor (review/approve), Admin

**Capabilities:**

- Budget entries linked to events — income and expense types
- Budget summary with running totals
- Advisor approval per entry

**Server actions:** `advisor-actions.js` (`approveBudgetEntryAction`)

---

## Notice Board

**Access:** Executive (create), All authenticated users (view)

**Capabilities:**

- Types: announcement, event, urgent, general
- Pin notices to surface at the top
- View count tracking, expiry date
- Notices filtered pinned-first in dashboards

**Server actions:** `notice-actions.js`, `executive-actions.js`

---

## Admin — Applications

Membership applications from `/join` form. Actions: approve, reject with reason, reset, delete, bulk approve/reject/delete.

**Server actions:** `application-actions.js`

---

## Admin — Contact Submissions

Inbox for the public `/contact` form. Mark as read, update status (new / in-progress / resolved / closed), bulk status update, bulk delete.

**Server actions:** `contact-actions.js`

---

## Admin — User Management

Full user CRUD. Actions: suspend, activate, ban, lock, delete, change role, approve/reject membership.

**Server actions:** `user-actions.js`

---

## Admin — Role & Permission Matrix

Toggle individual permissions per role, assign/remove roles from users.

**Server actions:** `role-actions.js`

---

## Admin — Data Export

10 domains exportable as CSV or JSON: users, join requests, blogs, events, achievements, gallery, contacts, notices, activity logs, resources.

**Server actions:** `export-actions.js`

---

## Admin — Settings

Key-value site settings stored in the `settings` table, grouped by category. Reset per category.

**Server actions:** `settings-actions.js`

---

## SEO

| File | Purpose |
|---|---|
| `app/_lib/seo.js` | `SITE_URL`, `SITE_NAME`, OG image defaults, `BASE_KEYWORDS` |
| `app/robots.js` | Dynamic robots.txt |
| `app/sitemap.js` | Dynamic sitemap including blog + event slugs |
| `app/opengraph-image.js` | Edge-rendered OG image |
| Per-page `metadata` / `generateMetadata()` | Title, description, OG tags per route |
