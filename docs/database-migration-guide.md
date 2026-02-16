# Database Migration Guide

Step-by-step guide for implementing the NEUPC database schema in phases.

## Overview

The complete schema has 45+ tables. For easier implementation and testing, we'll break it down into 5 phases, building complexity gradually.

## Migration Phases

### Phase 1: Core Authentication & Users (Week 1)

**Priority: CRITICAL** - Foundation for entire system

#### Tables to Create

1. `users` - Base authentication
2. `roles` - Role definitions
3. `user_roles` - User-role assignments
4. `permissions` - Permission definitions
5. `role_permissions` - Role-permission mappings
6. `member_profiles` - Extended user profiles

#### Implementation Steps

```sql
-- 1. Create users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar TEXT,
  email_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create roles and seed data
CREATE TABLE roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  priority INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO roles (name, description, priority) VALUES
('guest', 'Guest visitor', 1),
('member', 'Club member', 2),
('mentor', 'Member mentor', 3),
('executive', 'Club executive', 4),
('advisor', 'Faculty advisor', 5),
('admin', 'System admin', 6);

-- 3. Continue with other authentication tables...
```

#### Testing Checklist

- [ ] User registration works
- [ ] User login works
- [ ] Role assignment works
- [ ] Member profile creation works
- [ ] Email verification flow works

#### API Endpoints to Implement

```javascript
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
POST   /api/auth/verify-email
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
```

---

### Phase 2: Committee & Public Content (Week 2)

**Priority: HIGH** - Public-facing features

#### Tables to Create

1. `committee_positions`
2. `committee_members`
3. `blog_posts`
4. `blog_comments`
5. `gallery_items`
6. `website_settings`

#### Implementation Steps

1. **Committee Structure**

   ```sql
   CREATE TABLE committee_positions (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     title TEXT NOT NULL,
     category TEXT CHECK (category IN ('executive', 'mentor', 'advisor')),
     display_order INTEGER DEFAULT 0,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

2. **Seed Committee Positions**

   ```sql
   INSERT INTO committee_positions (title, category, display_order) VALUES
   ('President', 'executive', 1),
   ('Vice President', 'executive', 2),
   ('General Secretary', 'executive', 3),
   ('Treasurer', 'executive', 4),
   ('Developer Lead', 'executive', 5),
   ('CP Lead', 'executive', 6);
   ```

3. **Blog System**

   ```sql
   CREATE TABLE blog_posts (/* full schema */);
   CREATE TABLE blog_comments (/* full schema */);
   ```

#### Testing Checklist

- [ ] Committee page displays correctly
- [ ] Blog posts can be created (draft/published)
- [ ] Blog comments work
- [ ] Gallery upload works
- [ ] Settings can be updated

#### Pages to Build

```
/about
/committee
/gallery
/blogs
/blogs/[slug]
```

---

### Phase 3: Events & Registrations (Week 3)

**Priority: HIGH** - Core club functionality

#### Tables to Create

1. `events`
2. `event_registrations`
3. `event_gallery`
4. `notices`
5. `notifications`

#### Implementation Steps

1. **Events System**

   ```sql
   CREATE TABLE events (/* full schema */);
   CREATE TABLE event_registrations (/* full schema */);
   CREATE TABLE event_gallery (/* full schema */);
   ```

2. **Event Workflow**
   - Admin creates event (draft)
   - Approval by advisor (if required)
   - Published → visible to members
   - Registration opens
   - Event occurs
   - Mark completed
   - Upload gallery

#### Testing Checklist

- [ ] Event creation works
- [ ] Event registration works
- [ ] Registration limits enforced
- [ ] Email notifications sent
- [ ] Event gallery upload works
- [ ] Event status transitions work

#### Pages to Build

```
/events
/events/[slug]
/account/panel/executive/events
/account/panel/admin/events
```

---

### Phase 4: Contests & Achievements (Week 4)

**Priority: MEDIUM** - Competitive programming features

#### Tables to Create

1. `contests`
2. `contest_participants`
3. `achievements`
4. `member_achievements`
5. `certificates`
6. `member_statistics`
7. `weekly_tasks`
8. `task_submissions`

#### Implementation Steps

1. **Contest System**

   ```sql
   CREATE TABLE contests (/* full schema */);
   CREATE TABLE contest_participants (/* full schema */);
   ```

2. **External Platform Integration**

   ```javascript
   // Codeforces API
   async function syncCodeforcesRating(handle) {
     const response = await fetch(
       `https://codeforces.com/api/user.info?handles=${handle}`
     );
     const data = await response.json();
     // Update member_statistics
   }
   ```

3. **Achievement System**

   ```sql
   CREATE TABLE achievements (/* full schema */);
   CREATE TABLE member_achievements (/* full schema */);
   ```

#### Testing Checklist

- [ ] Contest listing works
- [ ] Contest registration works
- [ ] Statistics sync from Codeforces
- [ ] Achievements can be added
- [ ] Certificates generation works
- [ ] Leaderboard displays correctly

#### Pages to Build

```
/achievements
/account/panel/member/contests
/account/panel/member/my-achievements
/account/panel/executive/achievements
```

---

### Phase 5: Mentorship & Community (Week 5)

**Priority: LOW** - Advanced features

#### Tables to Create

1. `mentorships`
2. `mentorship_sessions`
3. `member_progress`
4. `discussion_categories`
5. `discussion_threads`
6. `discussion_replies`
7. `discussion_votes`
8. `resources`
9. `roadmaps`
10. `activity_logs`
11. `budget_entries`

#### Implementation Steps

1. **Mentorship Program**

   ```sql
   CREATE TABLE mentorships (/* full schema */);
   CREATE TABLE mentorship_sessions (/* full schema */);
   CREATE TABLE member_progress (/* full schema */);
   ```

2. **Discussion Forums**

   ```sql
   CREATE TABLE discussion_categories (/* full schema */);
   CREATE TABLE discussion_threads (/* full schema */);
   CREATE TABLE discussion_replies (/* full schema */);
   ```

3. **Seed Discussion Categories**

   ```sql
   INSERT INTO discussion_categories (name, description, display_order) VALUES
   ('General', 'General discussions', 1),
   ('Problem Solving', 'CP problems discussion', 2),
   ('Career Guidance', 'Career advice', 3);
   ```

#### Testing Checklist

- [ ] Mentor assignment works
- [ ] Session scheduling works
- [ ] Progress tracking updates
- [ ] Discussion threads work
- [ ] Nested replies work
- [ ] Upvote system works
- [ ] Resources can be added
- [ ] Roadmaps display correctly

#### Pages to Build

```
/roadmaps
/account/panel/mentor/dashboard
/account/panel/member/discussions
```

---

## Phase 6: Forms & Analytics (Week 6)

**Priority: LOW** - Supporting features

#### Tables to Create

1. `contact_submissions`
2. `join_requests`

#### Implementation Steps

1. **Public Forms**

   ```sql
   CREATE TABLE contact_submissions (/* full schema */);
   CREATE TABLE join_requests (/* full schema */);
   ```

2. **Analytics Views**

   ```sql
   CREATE VIEW active_members AS /* full view */;
   CREATE VIEW event_statistics AS /* full view */;
   CREATE VIEW member_leaderboard AS /* full view */;
   ```

#### Testing Checklist

- [ ] Contact form submits
- [ ] Join requests submit
- [ ] Admin can review submissions
- [ ] Analytics dashboards load
- [ ] Reports generate correctly

---

## Migration Script Example

### Single Migration File Approach

```sql
-- migrations/001_initial_setup.sql

-- Phase 1: Authentication
CREATE TABLE users (/* ... */);
CREATE TABLE roles (/* ... */);
-- ... insert seed data

-- Phase 2: Content
CREATE TABLE blog_posts (/* ... */);
-- ...

-- Indexes
CREATE INDEX idx_users_email ON users(email);
-- ...

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON users 
  FOR SELECT USING (auth.uid() = id);
-- ...

-- Triggers
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- ...
```

### Multiple Migration Files Approach

```bash
migrations/
├── 001_create_users_and_auth.sql
├── 002_create_content_tables.sql
├── 003_create_event_tables.sql
├── 004_create_contest_tables.sql
├── 005_create_community_tables.sql
└── 006_create_analytics_views.sql
```

---

## Rollback Strategy

### Creating Down Migrations

```sql
-- migrations/001_create_users_and_auth_down.sql

-- Drop in reverse order
DROP TRIGGER IF EXISTS update_users_updated_at ON users CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS member_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
```

### Rollback Script

```bash
#!/bin/bash
# rollback.sh

MIGRATION_NUMBER=$1

psql $DATABASE_URL -f migrations/${MIGRATION_NUMBER}_down.sql
```

---

## Data Seeding

### Development Seed Data

```sql
-- seeds/dev_seed.sql

-- Create admin user
INSERT INTO users (email, password_hash, full_name, email_verified, is_active)
VALUES ('admin@neupc.edu', '$2b$10$...', 'Admin User', true, true);

-- Assign admin role
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r 
WHERE u.email = 'admin@neupc.edu' AND r.name = 'admin';

-- Create sample members
INSERT INTO users (email, password_hash, full_name, email_verified)
VALUES 
  ('member1@example.com', '$2b$10$...', 'John Doe', true),
  ('member2@example.com', '$2b$10$...', 'Jane Smith', true);

-- Create sample events
INSERT INTO events (slug, title, description, start_date, location, category, status, created_by)
VALUES (
  'intro-to-cp',
  'Introduction to Competitive Programming',
  'Learn the basics of competitive programming',
  '2024-03-15 14:00:00+00',
  'Room 301, Main Building',
  'Workshop',
  'upcoming',
  (SELECT id FROM users WHERE email = 'admin@neupc.edu')
);

-- Create sample blog posts
INSERT INTO blog_posts (slug, title, excerpt, content, author_id, category, status, published_at)
VALUES (
  'getting-started-with-cp',
  'Getting Started with Competitive Programming',
  'A beginner guide to CP',
  'Full content here...',
  (SELECT id FROM users WHERE email = 'admin@neupc.edu'),
  'CP',
  'published',
  NOW()
);
```

---

## Production Deployment Checklist

### Pre-Deployment

- [ ] Backup existing database
- [ ] Test migrations on staging
- [ ] Verify RLS policies work
- [ ] Check foreign key constraints
- [ ] Test rollback procedure
- [ ] Document any manual steps

### Deployment

- [ ] Put site in maintenance mode
- [ ] Run migrations
- [ ] Verify data integrity
- [ ] Test critical user flows
- [ ] Monitor error logs
- [ ] Remove maintenance mode

### Post-Deployment

- [ ] Verify all features work
- [ ] Check analytics
- [ ] Monitor performance
- [ ] Collect user feedback
- [ ] Document any issues

---

## Performance Monitoring

### Queries to Monitor

```sql
-- Slow queries
SELECT calls, mean_exec_time, query
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Missing indexes
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats
WHERE schemaname = 'public'
ORDER BY n_distinct DESC;
```

### Performance Optimization

1. **Add missing indexes** after analyzing query patterns
2. **Partition large tables** (events, activity_logs) by date
3. **Archive old data** (completed events, old logs)
4. **Use materialized views** for complex analytics
5. **Enable query caching** at application layer

---

## Troubleshooting

### Common Issues

**Issue: RLS policy blocks legitimate access**

```sql
-- Check current policies
SELECT * FROM pg_policies WHERE tablename = 'events';

-- Test as specific user
SET ROLE authenticated;
SELECT * FROM events;
RESET ROLE;
```

**Issue: Foreign key constraint violation**

```sql
-- Find orphaned records
SELECT e.* FROM events e
LEFT JOIN users u ON e.created_by = u.id
WHERE u.id IS NULL;

-- Fix orphaned records
UPDATE events SET created_by = (SELECT id FROM users WHERE email = 'admin@neupc.edu')
WHERE created_by NOT IN (SELECT id FROM users);
```

**Issue: Slow query performance**

```sql
-- Analyze query plan
EXPLAIN ANALYZE
SELECT * FROM events WHERE status = 'upcoming';

-- Create missing index
CREATE INDEX idx_events_status ON events(status);
```

---

## Next Steps

After completing all phases:

1. **Security Audit**
   - Review RLS policies
   - Test authentication flows
   - Verify permission checks
   - Audit sensitive data access

2. **Performance Testing**
   - Load testing with realistic data
   - Query optimization
   - Caching strategy
   - CDN setup for assets

3. **Monitoring Setup**
   - Error tracking (Sentry)
   - Performance monitoring (Supabase dashboard)
   - Uptime monitoring
   - Analytics (Google Analytics, Plausible)

4. **Documentation**
   - API documentation
   - User guides
   - Admin documentation
   - Developer onboarding

5. **Backup & Recovery**
   - Automated daily backups
   - Point-in-time recovery testing
   - Disaster recovery plan
   - Data retention policy

---

## Resources

- [Supabase CLI](https://supabase.com/docs/reference/cli) - For migrations
- [PostgreSQL Documentation](https://www.postgresql.org/docs/) - Database reference
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security) - Security
- [Database Schema](./database-schema.sql) - Complete schema
- [Quick Reference](./database-quick-reference.md) - Common queries
