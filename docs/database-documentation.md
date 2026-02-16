# NEUPC Database Schema Documentation

## Overview

This document describes the comprehensive database schema for the Netrokona University Programming Club (NEUPC) website. The schema supports a full-featured club management system with role-based access control, event management, competitive programming tracking, mentorship programs, and content management.

## Database Architecture

### Design Principles

1. **Role-Based Access Control (RBAC)**: Flexible permission system supporting 6 user roles
2. **Relational Integrity**: Proper foreign key constraints and cascading deletes
3. **Audit Trail**: Activity logging for important operations
4. **Performance**: Indexed columns for frequently queried data
5. **Security**: Row-level security (RLS) policies for data protection
6. **Extensibility**: JSONB columns for flexible data storage

## Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     USERS       │──────▶│   USER_ROLES    │◀──────│     ROLES       │
└─────────────────┘       └─────────────────┘       └─────────────────┘
         │                                                    │
         │                                                    ▼
         │                                          ┌─────────────────┐
         │                                          │ ROLE_PERMISSIONS│
         ├────────────────────────────────┐         └─────────────────┘
         │                                │                  │
         ▼                                ▼                  ▼
┌─────────────────┐              ┌─────────────────┐ ┌─────────────────┐
│ MEMBER_PROFILES │              │COMMITTEE_MEMBERS│ │   PERMISSIONS   │
└─────────────────┘              └─────────────────┘ └─────────────────┘
         │                                │
         ▼                                │
┌─────────────────┐                      │
│ MEMBER_STATISTICS│                     │
└─────────────────┘                      │
                                          │
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     EVENTS      │──────▶│EVENT_REGISTRATIONS    ├─▶│  EVENT_GALLERY  │
└─────────────────┘       └─────────────────┘       └─────────────────┘
         │
         │
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│    CONTESTS     │──────▶│CONTEST_PARTICIPANTS    │  WEEKLY_TASKS   │
└─────────────────┘       └─────────────────┘       └─────────────────┘
                                                              │
                                                              ▼
                                                     ┌─────────────────┐
                                                     │TASK_SUBMISSIONS │
                                                     └─────────────────┘

┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│  ACHIEVEMENTS   │──────▶│MEMBER_ACHIEVEMENTS    │  CERTIFICATES   │
└─────────────────┘       └─────────────────┘       └─────────────────┘

┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   BLOG_POSTS    │──────▶│  BLOG_COMMENTS  │       │    ROADMAPS     │
└─────────────────┘       └─────────────────┘       └─────────────────┘

┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   MENTORSHIPS   │──────▶│MENTORSHIP_SESSIONS    │ MEMBER_PROGRESS │
└─────────────────┘       └─────────────────┘       └─────────────────┘

┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│DISCUSSION_THREADS──────▶│DISCUSSION_REPLIES     │ DISCUSSION_VOTES│
└─────────────────┘       └─────────────────┘       └─────────────────┘

┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│CONTACT_SUBMISSIONS    │  JOIN_REQUESTS  │       │ NOTIFICATIONS   │
└─────────────────┘       └─────────────────┘       └─────────────────┘
```

## Table Categories

### 1. Authentication & User Management (6 tables)

#### `users`

Core authentication table storing user credentials and basic information.

**Key Fields:**

- `email`: Unique email for authentication
- `password_hash`: Bcrypt/Argon2 hashed password
- `email_verified`: Email verification status
- `is_active`: Account status (for soft deletes)

**Use Cases:**

- User registration and login
- Password reset functionality
- Session management

#### `roles`

Defines the 6 user roles in the system.

**Roles:**

1. **Guest** (Priority 1): Public visitors
2. **Member** (Priority 2): Registered club members
3. **Mentor** (Priority 3): Guides and mentors members
4. **Executive** (Priority 4): Club executives with management access
5. **Advisor** (Priority 5): Faculty advisors with oversight
6. **Admin** (Priority 6): System administrators

#### `user_roles`

Many-to-many relationship between users and roles.

**Features:**

- Users can have multiple roles (e.g., member + executive)
- Temporary role assignment via `expires_at`
- Audit trail via `assigned_by`

#### `permissions`

Granular permissions for fine-grained access control.

**Categories:**

- Content permissions (create, edit, delete, publish)
- User permissions (view, edit, delete, manage roles)
- System permissions (settings, logs, backup)

#### `role_permissions`

Maps permissions to roles for RBAC implementation.

---

### 2. Member Profile & Academic Data (2 tables)

#### `member_profiles`

Extended profile for registered members (students).

**Key Fields:**

- `student_id`: University student ID
- `batch`, `department`, `semester`: Academic info
- `codeforces_handle`, `vjudge_handle`, etc.: Competitive programming profiles
- `approved`: Membership approval status
- `skills`, `interests`: Arrays for flexible data

**Workflow:**

1. Student submits join request
2. Admin/Executive reviews
3. Approved → member profile created
4. Member gains access to member features

#### `member_statistics`

Competitive programming statistics synced from external platforms.

**Tracked Metrics:**

- Total contests participated
- Problems solved across platforms
- Ratings (Codeforces, AtCoder, LeetCode)
- Last sync timestamp for data freshness

**Integration:**

- API calls to CF/VJudge/AtCoder/LeetCode
- Cron job for periodic syncing
- Displayed in member dashboard

---

### 3. Committee & Team Structure (2 tables)

#### `committee_positions`

Defines organizational structure (President, VP, Developer Lead, etc.)

**Categories:**

- Executive: Club management team
- Mentor: Senior members guiding juniors
- Advisor: Faculty members

#### `committee_members`

Maps users to positions with term tracking.

**Features:**

- Term start/end dates for historical records
- `is_current` flag for active committee
- Display order for team page
- Bio for showcasing members

---

### 4. Events & Activities (4 tables)

#### `events`

Central table for all club events.

**Event Types:**

- Workshop: Skill-building sessions
- Contest: Programming competitions
- Seminar: Guest lectures
- Bootcamp: Intensive training programs
- Hackathon: Innovation challenges
- Meetup: Casual networking

**Status Flow:**
`draft` → `upcoming` → `ongoing` → `completed` (or `cancelled`)

**Features:**

- Multi-organizer support via `event_organizers` junction table
- Approval workflow via `approved_by`
- Registration management
- Rich media (cover, banner images)

#### `event_organizers`

Many-to-many relationship between events and organizers.

**Features:**

- Multiple organizers per event
- Organizer role tracking (lead, coordinator, volunteer)
- Referential integrity with foreign keys
- Historical tracking of who organized each event

#### `event_registrations`

Tracks who registered for events.

**Features:**

- Team registration support
- Flexible registration data (JSONB)
- Attendance tracking
- Certificate issuance tracking

#### `event_gallery`

Event photos/videos for post-event showcase.

---

### 5. Contests & Competitions (4 tables)

#### `contests`

Programming contests (internal or external).

**Platforms:**

- Codeforces
- VJudge
- Internal custom platform
- Other online judges

**Types:**

- Individual
- Team

#### `contest_participants`

Performance tracking for each participant.

**Metrics:**

- Rank
- Score
- Problems solved
- Detailed performance (JSONB)

#### `weekly_tasks`

Regular practice tasks assigned by mentors/executives.

**Features:**

- Difficulty levels (easy, medium, hard)
- Multiple problem links
- Target audience filtering
- Deadline tracking

#### `task_submissions`

Member submissions for weekly tasks.

**Workflow:**

1. Member submits solution
2. Mentor reviews
3. Feedback provided
4. Status updated (pending → completed/late)

---

### 6. Achievements & Certifications (3 tables)

#### `achievements`

Club achievements in contests/competitions.

**Types:**

- ICPC
- National contests
- International competitions
- Online contests

**Features:**

- Team or individual achievements
- Multiple participants support
- Year-based filtering
- Rich details and links

#### `member_achievements`

Links members to team achievements.

**Use Case:**

- Team wins ICPC → 3 members linked to achievement
- Individual profile shows all achievements

#### `certificates`

Digital certificates issued to members.

**Types:**

- Participation certificates
- Completion certificates (bootcamps, courses)
- Achievement certificates (contest winners)
- Appreciation certificates

**Features:**

- Unique certificate numbers
- Linked to events/contests/achievements
- PDF/image URL storage
- Verification system

---

### 7. Content Management (5 tables)

#### `blog_posts`

Technical articles, tutorials, news.

**Categories:**

- CP: Competitive Programming
- WebDev: Web Development
- AI-ML: Artificial Intelligence & Machine Learning
- Career: Career guidance
- News: Club news
- Tutorial: Educational content

**Features:**

- Draft/Published/Archived workflow
- Featured posts
- View counter
- Like system
- Reading time estimation

#### `blog_comments`

Nested comments on blog posts.

**Features:**

- Reply to comments (via `parent_id`)
- Moderation via `is_approved`
- User engagement

#### `roadmaps`

Learning path guides for different tech domains.

**Structure (JSONB):**

```json
{
  "nodes": [
    { "id": 1, "title": "Learn C++", "duration": "2 weeks" },
    { "id": 2, "title": "Basic Data Structures", "duration": "3 weeks" }
  ],
  "connections": [[1, 2]]
}
```

**Use Case:**

- CP Roadmap: C++ → DS → Algorithms → Practice
- Web Dev Roadmap: HTML/CSS → JavaScript → React
- ML Roadmap: Python → Math → ML Libraries

#### `resources`

Curated learning resources.

**Types:**

- Articles
- Videos
- Courses
- Books
- Tools
- Documentation

**Features:**

- Difficulty-based filtering
- Upvote system
- Free/Paid indicator
- Featured resources

#### `notices`

Announcements and important updates.

**Types:**

- General: Regular announcements
- Urgent: Time-sensitive info
- Event: Event-related notices
- Deadline: Submission deadlines
- Achievement: Success stories

**Features:**

- Priority levels (low → critical)
- Target audience (members, executives, all)
- Pinning for visibility
- Expiration dates
- Attachments support

---

### 8. Mentorship Program (3 tables)

#### `mentorships`

Mentor-mentee pairings.

**Workflow:**

1. Member requests mentorship
2. Admin assigns mentor
3. Active mentorship begins
4. Regular sessions tracked
5. Completed when goals achieved

**Fields:**

- `focus_area`: What to learn (CP, Web Dev, etc.)
- `status`: active, completed, paused, cancelled

#### `mentorship_sessions`

Individual mentoring sessions.

**Tracked Data:**

- Date and duration
- Topic covered
- Attendance
- Session notes
- Feedback

#### `member_progress`

Periodic progress reports.

**Metrics:**

- Problems solved
- Contests participated
- Rating changes
- Mentor observations
- Self-assessment

**Periods:**

- Weekly snapshots
- Monthly summaries

---

### 9. Discussions & Community (4 tables)

#### `discussion_categories`

Forum-style discussion organization.

**Default Categories:**

- General
- Problem Solving
- Career Guidance
- Technology
- Help & Support

#### `discussion_threads`

Discussion topics initiated by members.

**Features:**

- Tags for organization
- Pinning important threads
- Locking (no new replies)
- Solved marking (for Q&A)
- View counter

#### `discussion_replies`

Responses to threads (supports nesting).

**Features:**

- Reply to thread or another reply
- Solution marking
- Upvote system

#### `discussion_votes`

Upvote/downvote system for quality content.

---

### 10. Forms & Submissions (2 tables)

#### `contact_submissions`

Public contact form messages.

**Workflow:**

1. Visitor submits message
2. Admin sees in dashboard
3. Status: new → read → replied
4. Response tracked

**Security:**

- IP and user agent logging
- Rate limiting (application layer)

#### `join_requests`

Membership applications.

**Workflow:**

1. Student fills join form
2. Request status: pending
3. Executive/Admin reviews
4. Approved → user account created
5. Rejected → reason provided

---

### 11. System & Settings (4 tables)

#### `website_settings`

Key-value configuration store.

**Categories:**

- General: site name, description
- Social: social media links
- Email: SMTP settings
- Features: feature flags

**Example:**

```json
{
  "key": "registration_open",
  "value": true,
  "category": "features"
}
```

#### `activity_logs`

Audit trail for important actions.

**Logged Actions:**

- User login/logout
- Content creation/edit/delete
- Role assignments
- Settings changes

**Fields:**

- User who performed action
- What was done (action + entity)
- When it happened
- IP and user agent

#### `notifications`

In-app notification system.

**Types:**

- Info, Success, Warning, Error
- Event reminders
- Mentions in discussions
- Achievement unlocked

**Features:**

- Read/unread tracking
- Links to related content
- Real-time via WebSockets (optional)

#### `budget_entries`

Financial tracking for advisor oversight.

**Entry Types:**

- Income: Sponsorships, grants
- Expense: Event costs, equipment, prizes

**Features:**

- Category-based organization
- Receipt attachments
- Approval workflow
- Event linking

---

## Row-Level Security (RLS) Policies

### Public Access

- Published blog posts
- Upcoming/completed events
- Achievements
- Gallery
- Resources
- Current committee members

### Member Access

- Own profile (read/write)
- Other member profiles (read only for executives/admin)
- Registered events
- Member-only resources

### Executive Access

- All member profiles
- Event management
- Content management
- Analytics

### Admin Access

- Full system access
- User management
- System settings
- Security logs

---

## Database Functions & Triggers

### Auto-Update Timestamps

```sql
CREATE TRIGGER update_users_updated_at 
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

Applied to: users, member_profiles, events, blog_posts, roadmaps, notices, discussion_threads

### Member Statistics Sync

Auto-creates statistics record when member profile created.

### Activity Logging

Auto-logs important content creation (events, blogs, etc.)

---

## Analytics Views

### `active_members`

Quick access to active member list with statistics.

**Use Case:**

- Member directory
- Dashboard statistics
- Filtering for events

### `event_statistics`

Registration and attendance metrics per event.

**Use Case:**

- Event analytics dashboard
- ROI analysis
- Attendance reports

### `member_leaderboard`

Competitive programming leaderboard.

**Ranking Factors:**

- Codeforces rating (primary)
- Total problems solved
- Contest participation

**Use Case:**

- Public leaderboard display
- Motivation and gamification
- Performance tracking

---

## Indexes for Performance

### Critical Indexes

- Email lookups: `idx_users_email`
- Event queries: `idx_events_status`, `idx_events_start_date`
- Blog posts: `idx_blog_posts_published`, `idx_blog_posts_slug`
- Notifications: `idx_notifications_user`, `idx_notifications_read`
- Activity logs: `idx_activity_logs_created` (for log retention)

### Composite Indexes (Future)

- Events by status + date
- Blogs by category + published date
- Member profiles by batch + approved

---

## Migration Strategy

### Phase 1: Core Tables

1. Users & authentication
2. Roles & permissions
3. Member profiles

### Phase 2: Content & Events

1. Events
2. Blog posts
3. Gallery
4. Resources

### Phase 3: Features

1. Contests
2. Achievements
3. Certifications

### Phase 4: Community

1. Discussions
2. Mentorship
3. Notifications

### Phase 5: Admin

1. Settings
2. Activity logs
3. Budget tracking

---

## Backup Strategy

### Daily Backups

- Full database dump
- Cloud storage (S3, Google Cloud)
- 30-day retention

### Point-in-Time Recovery

- WAL archiving enabled
- 7-day PITR window

### Critical Tables

- Users (immediate backup on changes)
- Certificates (immutable records)
- Activity logs (compliance)

---

## Data Relationships Summary

### Core Relationships

- **Users → Member Profiles**: 1:1 (optional)
- **Users → User Roles**: 1:N
- **Events → Registrations**: 1:N
- **Achievements → Member Achievements**: 1:N
- **Mentorships → Sessions**: 1:N
- **Threads → Replies**: 1:N (tree structure)

### Referential Actions

- **ON DELETE CASCADE**: Child records deleted with parent
  - Event registrations when event deleted
  - Comments when blog deleted
  - Notifications when user deleted

- **ON DELETE SET NULL**: Keep record but remove reference
  - Activity logs when user deleted
  - Created_by fields (keep content)

---

## Future Enhancements

### Planned Features

1. **AI/ML Integration**
   - Problem recommendation engine
   - Contest difficulty prediction
   - Personalized learning paths

2. **Real-Time Features**
   - Live contest standings
   - Chat system
   - Collaborative coding

3. **Advanced Analytics**
   - Predictive analytics for member performance
   - Retention analysis
   - Engagement metrics

4. **Mobile App Support**
   - Push notifications table
   - Device tokens
   - App-specific settings

5. **Gamification**
   - Badges and points system
   - Achievement milestones
   - Leaderboards

---

## Security Considerations

### Sensitive Data

- **Password Storage**: Bcrypt/Argon2 hashing
- **Email Verification**: Time-limited tokens
- **Password Reset**: Secure token generation

### Input Validation

- Email format validation
- SQL injection prevention (parameterized queries)
- XSS prevention (sanitized content)

### Rate Limiting

- Login attempts
- API calls
- Form submissions

### Privacy

- GDPR compliance
- Data export functionality
- Account deletion (anonymization)

---

## Performance Optimization

### Query Optimization

- Indexed foreign keys
- Covering indexes for common queries
- Materialized views for complex analytics

### Caching Strategy

- Redis for session data
- CDN for static assets
- Query result caching

### Pagination

- Cursor-based for infinite scroll
- Offset-based for page numbers
- Default limit: 20-50 items

---

## Conclusion

This database schema provides a solid foundation for the NEUPC website, supporting:

- ✅ Role-based access control
- ✅ Event and contest management
- ✅ Content management system
- ✅ Mentorship program
- ✅ Community discussions
- ✅ Achievement tracking
- ✅ Analytics and reporting
- ✅ Security and audit trails

The design balances **flexibility** with **performance**, using modern PostgreSQL features like JSONB, array types, and RLS policies while maintaining proper relational structure.
