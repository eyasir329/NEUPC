# Data Service Documentation

## Overview

The `data-service.js` module is the **centralized data access layer** for the NEUPC platform. It provides functions for all database interactions through Supabase, handling CRUD operations, aggregations, searches, and bulk operations.

**Key Features:**

- ✅ Supabase integration with error handling
- ✅ Type-safe operations with proper validation
- ✅ Audit logging for critical operations
- ✅ Fallback support when Supabase is not configured
- ✅ Comprehensive error messaging
- ✅ Performance-optimized queries

**Location:** `/app/_lib/data-service.js`

---

## Table of Contents

1. [User Management](#user-management)
2. [Roles & Permissions](#roles--permissions)
3. [Member Profiles](#member-profiles)
4. [Member Statistics](#member-statistics)
5. [Events](#events)
6. [Contests](#contests)
7. [Blog Posts](#blog-posts)
8. [Achievements](#achievements)
9. [Notifications](#notifications)
10. [Discussions](#discussions)
11. [Certificates](#certificates)
12. [Committee Management](#committee-management)
13. [Mentorships](#mentorships)
14. [Weekly Tasks](#weekly-tasks)
15. [Resources](#resources)
16. [Roadmaps](#roadmaps)
17. [Gallery](#gallery)
18. [Join Requests](#join-requests)
19. [Contact Submissions](#contact-submissions)
20. [Budget Management](#budget-management)
21. [Settings](#settings)
22. [Statistics & Aggregations](#statistics--aggregations)
23. [Search & Filtering](#search--filtering)
24. [Bulk Operations](#bulk-operations)
25. [Activity Logs](#activity-logs)

---

## User Management

### `getUserByEmail(email)`

Fetch a single user record by email address.

**Parameters:**

- `email` (string): User's email address

**Returns:**

- User object with all fields or `null` if not found

**Example:**

```javascript
const user = await getUserByEmail('user@example.com');
console.log(user.id, user.full_name);
```

**Error Handling:** Throws error on database failure.

---

### `getUserById(id)`

Fetch a user by ID with role information. Includes fallback for unconfigured Supabase.

**Parameters:**

- `id` (uuid): User ID

**Returns:**

- Object with `id`, `name`, `email`, `avatar`, `status`, `role`

**Example:**

```javascript
const user = await getUserById('123e4567-e89b-12d3-a456-426614174000');
console.log(user.role); // 'Admin', 'Member', etc.
```

---

### `createUser(userData)`

Create a new user record.

**Parameters:**

- `userData` (object): User data with fields:
  - `email` (string, required)
  - `full_name` (string, required)
  - `avatar_url` (string, optional)
  - `phone` (string, optional)
  - `account_status` (string, default: 'pending')

**Returns:**

- Created user object with generated `id`

**Example:**

```javascript
const newUser = await createUser({
  email: 'john@example.com',
  full_name: 'John Doe',
  phone: '+8801712345678'
});
```

---

### `updateUser(id, updates)`

Update user record fields.

**Parameters:**

- `id` (uuid): User ID
- `updates` (object): Fields to update

**Returns:**

- Updated user object

**Example:**

```javascript
await updateUser(userId, {
  full_name: 'Jane Doe',
  avatar_url: 'https://example.com/avatar.jpg'
});
```

---

### `deleteUser(id)`

Hard-delete a user record.

**Parameters:**

- `id` (uuid): User ID

**Returns:**

- `{ success: true }`

**⚠️ Warning:** This permanently deletes the user and all related data.

---

### `getAllUsers()`

Fetch all users with complete role and profile information.

**Returns:**

- Array of user objects with fields:
  - `id`, `name`, `email`, `avatar`
  - `status`, `statusReason`, `statusChangedAt`
  - `joined`, `lastActive`
  - `role`, `roles` (array), `isApproved`
  - `studentId`, `appliedAt`, `batch`, `department`

**Example:**

```javascript
const users = await getAllUsers();
users.forEach(user => {
  console.log(`${user.name} (${user.role})`);
});
```

---

### `getUserStats()`

Get count statistics for user accounts.

**Returns:**

- Object with:
  - `total`: Total users
  - `active`: Active accounts
  - `pending`: Pending approval
  - `suspended`: Suspended accounts

**Example:**

```javascript
const stats = await getUserStats();
console.log(`Active users: ${stats.active}/${stats.total}`);
```

---

### `updateUserAccountStatus(id, status, reason, changedBy)`

Update user's account status with audit trail.

**Parameters:**

- `id` (uuid): User ID
- `status` (string): New status ('active', 'pending', 'suspended', 'banned', 'locked')
- `reason` (string): Reason for status change
- `changedBy` (uuid): Admin user ID making the change

**Returns:**

- Updated user object

**Example:**

```javascript
await updateUserAccountStatus(
  userId,
  'active',
  'Membership approved',
  adminId
);
```

---

### `suspendUser(userId, adminId, reason, expiresAt)`

Suspend a user account with optional expiry.

**Parameters:**

- `userId` (uuid): User to suspend
- `adminId` (uuid): Admin performing action
- `reason` (string): Suspension reason
- `expiresAt` (timestamp, optional): Auto-reactivation date

**Returns:**

- `{ success: true }`

**Example:**

```javascript
await suspendUser(userId, adminId, 'Violating community guidelines', '2024-04-01');
```

---

### `activateUser(userId, adminId, reason)`

Restore a user account to active status.

**Parameters:**

- `userId` (uuid): User to activate
- `adminId` (uuid): Admin performing action
- `reason` (string, default: 'Account activated'): Reactivation reason

**Returns:**

- `{ success: true }`

---

### `banUser(userId, adminId, reason)`

Permanently ban a user account.

**Parameters:**

- `userId` (uuid): User to ban
- `adminId` (uuid): Admin performing action
- `reason` (string): Ban reason

**Returns:**

- `{ success: true }`

---

### `approveMember(userId, adminId)`

Approve a pending member and activate their account.

**Parameters:**

- `userId` (uuid): Member user ID
- `adminId` (uuid): Admin approving

**Returns:**

- `{ success: true }`

---

### `createAdminUser(fullName, email, role, adminId)`

Create a new user with pre-assigned role (admin operation).

**Parameters:**

- `fullName` (string): User's full name
- `email` (string): Email address
- `role` (string): Role to assign ('guest', 'member', 'executive', 'admin', 'mentor', 'advisor')
- `adminId` (uuid): Admin creating the user

**Returns:**

- `{ success: true, userId: <uuid> }`

**Example:**

```javascript
const result = await createAdminUser(
  'Alice Smith',
  'alice@example.com',
  'executive',
  currentAdminId
);
console.log('New user ID:', result.userId);
```

---

### `updateAdminUser(userId, updates, adminId)`

Update user details and/or role assignment (admin operation).

**Parameters:**

- `userId` (uuid): User to update
- `updates` (object): Either or both:
  - `fullName` (string): New full name
  - `role` (string): New role to assign
- `adminId` (uuid): Admin performing update

**Returns:**

- `{ success: true }`

**Example:**

```javascript
await updateAdminUser(userId, { role: 'mentor' }, adminId);
```

---

## Roles & Permissions

### `getUserRoles(email)`

Get all role names for a user by email. Returns ['guest'] fallback on error.

**Parameters:**

- `email` (string): User's email

**Returns:**

- Array of role names ['member', 'executive', 'admin', ...]

**Example:**

```javascript
const roles = await getUserRoles('user@example.com');
if (roles.includes('admin')) {
  // Show admin features
}
```

---

### `getAllRoles()`

Fetch all available roles ordered by priority.

**Returns:**

- Array of role objects with `id`, `name`, `priority`, `description`

---

### `getRoleByName(name)`

Fetch a single role by name.

**Parameters:**

- `name` (string): Role name ('admin', 'member', etc.)

**Returns:**

- Role object

---

### `getAllPermissions()`

Fetch all permissions in the system.

**Returns:**

- Array of permission objects with `id`, `name`, `category`, `description`

---

### `getPermissionsByCategory(category)`

Fetch permissions in a specific category.

**Parameters:**

- `category` (string): Category name

**Returns:**

- Array of permissions

---

### `getRolePermissions(roleId)`

Fetch all permissions assigned to a role.

**Parameters:**

- `roleId` (uuid): Role ID

**Returns:**

- Array of permission objects linked to this role

---

### `assignPermissionToRole(roleId, permissionId)`

Add a permission to a role.

**Parameters:**

- `roleId` (uuid): Role ID
- `permissionId` (uuid): Permission ID

**Returns:**

- Created role_permission record

---

### `removePermissionFromRole(roleId, permissionId)`

Remove a permission from a role.

**Parameters:**

- `roleId` (uuid): Role ID
- `permissionId` (uuid): Permission ID

**Returns:**

- `{ success: true }`

---

### `assignRoleToUser(userId, roleId, assignedBy)`

Assign a role to a user.

**Parameters:**

- `userId` (uuid): User ID
- `roleId` (uuid): Role ID
- `assignedBy` (uuid): Admin assigning

**Returns:**

- Created user_role record

---

### `removeRoleFromUser(userId, roleId)`

Remove a role from a user.

**Parameters:**

- `userId` (uuid): User ID
- `roleId` (uuid): Role ID

**Returns:**

- `{ success: true }`

---

### `updateUserRole(userId, roleId, assignedBy, expiresAt)`

Update user's role assignment with optional expiry.

**Parameters:**

- `userId` (uuid): User ID
- `roleId` (uuid): New role ID
- `assignedBy` (uuid): Admin updating
- `expiresAt` (timestamp, optional): Role expiration date

**Returns:**

- Updated user_role record

---

## Member Profiles

### `getAllMemberProfiles()`

Fetch all member profiles with user data.

**Returns:**

- Array of member profile objects with nested user info

---

### `getMemberProfileByUserId(userId)`

Fetch a member profile by user ID.

**Parameters:**

- `userId` (uuid): User ID

**Returns:**

- Member profile object with user data

---

### `getMemberProfileByStudentId(studentId)`

Fetch a member profile by student ID.

**Parameters:**

- `studentId` (string): Student ID

**Returns:**

- Member profile object

---

### `getApprovedMembers()`

Fetch only approved member profiles.

**Returns:**

- Array of approved member profiles

---

### `getPendingMemberProfiles()`

Fetch unapproved (pending) member profiles.

**Returns:**

- Array of pending member profiles

---

### `getMembersByBatch(batch)`

Fetch approved members by batch year.

**Parameters:**

- `batch` (string): Batch year (e.g., '2024')

**Returns:**

- Array of member profiles from that batch

---

### `createMemberProfile(profileData)`

Create a new member profile.

**Parameters:**

- `profileData` (object): Profile data with fields:
  - `user_id` (uuid, required)
  - `student_id` (string, required)
  - `batch` (string, required)
  - `department` (string, required)
  - `cgpa`, `interests`, `skills` (optional arrays)
  - `linkedin`, `github`, `codeforces_handle` (optional strings)
  - `bio`, `join_reason` (optional text)

**Returns:**

- Created profile object

**Example:**

```javascript
const profile = await createMemberProfile({
  user_id: userId,
  student_id: '190104001',
  batch: '2024',
  department: 'CSE',
  interests: ['CP', 'WebDev'],
  skills: ['C++', 'JavaScript']
});
```

---

### `updateMemberProfile(userId, updates)`

Update a member profile by user ID.

**Parameters:**

- `userId` (uuid): User ID
- `updates` (object): Fields to update

**Returns:**

- Updated profile object

---

### `approveMemberProfile(userId, approvedBy)`

Mark a member profile as approved.

**Parameters:**

- `userId` (uuid): Member user ID
- `approvedBy` (uuid): Admin approving

**Returns:**

- Updated profile with `approved: true`

---

## Member Statistics

### `getMemberStatistics(memberId)`

Fetch statistics for a single member.

**Parameters:**

- `memberId` (uuid): Member profile ID

**Returns:**

- Object with competitive programming statistics:
  - `total_contests`, `total_problems_solved`
  - `codeforces_rating`, `vjudge_solved`
  - `atcoder_rating`, `leetcode_rating`

---

### `getAllMemberStatistics()`

Fetch all member statistics ordered by ranking.

**Returns:**

- Array of member stats with nested member profile and user info

---

### `upsertMemberStatistics(memberId, stats)`

Insert or update member statistics.

**Parameters:**

- `memberId` (uuid): Member profile ID
- `stats` (object): Statistics object

**Returns:**

- Upserted stats object

---

### `getLeaderboard(limit)`

Fetch top members by Codeforces rating.

**Parameters:**

- `limit` (number, default: 20): Number of top members

**Returns:**

- Array of top members with full details

**Example:**

```javascript
const topMembers = await getLeaderboard(10);
topMembers.forEach((member, idx) => {
  console.log(`${idx + 1}. ${member.full_name} - Rating: ${member.codeforces_rating}`);
});
```

---

### `getMemberProgress(userId)`

Fetch progress entries for a member, newest first.

**Parameters:**

- `userId` (uuid): User ID

**Returns:**

- Array of progress records

---

### `createMemberProgress(progressData)`

Create a new member progress entry.

**Parameters:**

- `progressData` (object): Progress data with:
  - `user_id` (uuid)
  - `period` (string): Time period
  - `start_date`, `end_date` (dates)
  - `problems_solved`, `contests_participated` (numbers)
  - `mentor_notes`, `self_assessment` (optional text)

**Returns:**

- Created progress object

---

### `updateMemberProgress(id, updates)`

Update a progress entry.

**Parameters:**

- `id` (uuid): Progress record ID
- `updates` (object): Fields to update

**Returns:**

- Updated progress object

---

### `deleteMemberProgress(id)`

Delete a progress entry.

**Parameters:**

- `id` (uuid): Progress record ID

**Returns:**

- `{ success: true }`

---

## Events

### `getAllEvents()`

Fetch all events with creator info, newest first.

**Returns:**

- Array of event objects

---

### `getPublishedEvents()`

Fetch published events (status: 'upcoming', 'ongoing', 'completed').

**Returns:**

- Array of published events

---

### `getUpcomingEvents(limit)`

Fetch next upcoming events with future start dates.

**Parameters:**

- `limit` (number, default: 10): Number of events

**Returns:**

- Array of upcoming events

---

### `getFeaturedEvents()`

Fetch featured upcoming/ongoing events.

**Returns:**

- Array of featured events

---

### `getPastEvents(limit)`

Fetch completed past events, newest first.

**Parameters:**

- `limit` (number, default: 10): Number of events

**Returns:**

- Array of past events

---

### `getEventBySlug(slug)`

Fetch a single event by slug.

**Parameters:**

- `slug` (string): URL slug

**Returns:**

- Event object with creator info

---

### `getEventById(id)`

Fetch a single event by ID.

**Parameters:**

- `id` (uuid): Event ID

**Returns:**

- Event object

---

### `getEventsByCategory(category)`

Fetch non-draft events by category.

**Parameters:**

- `category` (string): Event category

**Returns:**

- Array of events in that category

---

### `createEvent(eventData)`

Create a new event.

**Parameters:**

- `eventData` (object): Event data with:
  - `slug`, `title`, `description` (required strings)
  - `start_date`, `location` (required)
  - `end_date`, `cover_image`, `banner_image` (optional)
  - `status` (default: 'draft')
  - `max_participants`, `registration_required` (optional)

**Returns:**

- Created event object

---

### `updateEvent(id, updates)`

Update an event.

**Parameters:**

- `id` (uuid): Event ID
- `updates` (object): Fields to update

**Returns:**

- Updated event object

---

### `deleteEvent(id)`

Delete an event.

**Parameters:**

- `id` (uuid): Event ID

**Returns:**

- `{ success: true }`

---

### `getEventRegistration(eventId, userId)`

Check if user is registered for an event.

**Parameters:**

- `eventId` (uuid): Event ID
- `userId` (uuid): User ID

**Returns:**

- Registration object or `null`

---

### `getEventRegistrations(eventId)`

Fetch all registrations for an event.

**Parameters:**

- `eventId` (uuid): Event ID

**Returns:**

- Array of registration objects with user info

---

### `getUserEventRegistrations(userId)`

Fetch all events a user has registered for.

**Parameters:**

- `userId` (uuid): User ID

**Returns:**

- Array of registration objects with event summaries

---

### `createEventRegistration(registrationData)`

Register a user for an event.

**Parameters:**

- `registrationData` (object): Registration data with:
  - `event_id`, `user_id` (required)
  - `team_name`, `team_members` (optional for team events)
  - `registration_data` (optional JSONB)

**Returns:**

- Created registration object

**Example:**

```javascript
await createEventRegistration({
  event_id: eventId,
  user_id: userId,
  status: 'registered'
});
```

---

### `updateEventRegistration(id, updates)`

Update a registration record.

**Parameters:**

- `id` (uuid): Registration ID
- `updates` (object): Fields to update

**Returns:**

- Updated registration object

---

### `markAttendance(eventId, userId, attended)`

Toggle attendance for a registered user.

**Parameters:**

- `eventId` (uuid): Event ID
- `userId` (uuid): User ID
- `attended` (boolean, default: true): Attendance status

**Returns:**

- Updated registration object

---

### `cancelEventRegistration(eventId, userId)`

Cancel a user's event registration.

**Parameters:**

- `eventId` (uuid): Event ID
- `userId` (uuid): User ID

**Returns:**

- Updated registration with `status: 'cancelled'`

---

### `getEventRegistrationCount(eventId)`

Get number of registered participants for an event.

**Parameters:**

- `eventId` (uuid): Event ID

**Returns:**

- Count as number

---

### `getEventOrganizers(eventId)`

Fetch all organizers for an event.

**Parameters:**

- `eventId` (uuid): Event ID

**Returns:**

- Array of organizer objects with user info

---

### `addEventOrganizer(eventId, userId, role)`

Add a user as an event organizer.

**Parameters:**

- `eventId` (uuid): Event ID
- `userId` (uuid): User ID
- `role` (string, optional): Organizer role

**Returns:**

- Created organizer record

---

### `removeEventOrganizer(eventId, userId)`

Remove an event organizer.

**Parameters:**

- `eventId` (uuid): Event ID
- `userId` (uuid): User ID

**Returns:**

- `{ success: true }`

---

### `getEventGallery(eventId)`

Fetch gallery images for an event.

**Parameters:**

- `eventId` (uuid): Event ID

**Returns:**

- Array of gallery items ordered by display_order

---

### `addEventGalleryItem(galleryData)`

Add an image/video to event gallery.

**Parameters:**

- `galleryData` (object): Gallery item data with:
  - `event_id` (uuid, required)
  - `url` (string, required)
  - `type` ('image' or 'video', default: 'image')
  - `caption`, `display_order` (optional)

**Returns:**

- Created gallery item

---

### `deleteEventGalleryItem(id)`

Delete a gallery item.

**Parameters:**

- `id` (uuid): Gallery item ID

**Returns:**

- `{ success: true }`

---

## Contests

### `getAllContests()`

Fetch all contests, newest first.

**Returns:**

- Array of contest objects

---

### `getContestBySlug(slug)`

Fetch a contest by slug.

**Parameters:**

- `slug` (string): URL slug

**Returns:**

- Contest object

---

### `getContestById(id)`

Fetch a contest by ID.

**Parameters:**

- `id` (uuid): Contest ID

**Returns:**

- Contest object

---

### `getUpcomingContests(limit)`

Fetch next upcoming contests.

**Parameters:**

- `limit` (number, default: 10): Number of contests

**Returns:**

- Array of upcoming contests

---

### `getPastContests(limit)`

Fetch finished past contests.

**Parameters:**

- `limit` (number, default: 10): Number of contests

**Returns:**

- Array of past contests

---

### `getOfficialContests()`

Fetch all officially-marked contests.

**Returns:**

- Array of official contests

---

### `getContestsByPlatform(platform)`

Fetch contests on a specific platform.

**Parameters:**

- `platform` (string): Platform name ('Codeforces', 'AtCoder', etc.)

**Returns:**

- Array of contests on that platform

---

### `createContest(contestData)`

Create a new contest record.

**Parameters:**

- `contestData` (object): Contest data with:
  - `slug`, `title`, `platform` (required)
  - `start_time`, `duration` (required)
  - `description`, `contest_url` (optional)
  - `type` ('individual' or 'team'), `status` (optional)

**Returns:**

- Created contest object

---

### `updateContest(id, updates)`

Update a contest.

**Parameters:**

- `id` (uuid): Contest ID
- `updates` (object): Fields to update

**Returns:**

- Updated contest object

---

### `deleteContest(id)`

Delete a contest.

**Parameters:**

- `id` (uuid): Contest ID

**Returns:**

- `{ success: true }`

---

### `getContestParticipants(contestId)`

Fetch participants of a contest.

**Parameters:**

- `contestId` (uuid): Contest ID

**Returns:**

- Array of participant objects with user info, ordered by rank

---

### `getUserContestParticipations(userId)`

Fetch a user's contest participation history.

**Parameters:**

- `userId` (uuid): User ID

**Returns:**

- Array of participation records with contest summaries

---

### `addContestParticipant(participantData)`

Register a participant in a contest.

**Parameters:**

- `participantData` (object): Participation data with:
  - `contest_id`, `user_id` (required)
  - `rank`, `score`, `problems_solved` (optional)

**Returns:**

- Created participant record

---

### `updateContestParticipant(contestId, userId, updates)`

Update a participant's contest performance.

**Parameters:**

- `contestId` (uuid): Contest ID
- `userId` (uuid): User ID
- `updates` (object): Performance data

**Returns:**

- Updated participant record

---

### `getContestParticipantCount(contestId)`

Get number of participants in a contest.

**Parameters:**

- `contestId` (uuid): Contest ID

**Returns:**

- Count as number

---

## Blog Posts

### `getAllBlogPosts()`

Fetch all blog posts with author info, newest first.

**Returns:**

- Array of blog post objects

---

### `getPublishedBlogPosts(limit)`

Fetch published posts with summary fields.

**Parameters:**

- `limit` (number, default: 20): Number of posts

**Returns:**

- Array of published posts

---

### `getFeaturedBlogPosts()`

Fetch featured published posts.

**Returns:**

- Array of featured posts

---

### `getTrendingBlogPosts(limit)`

Fetch trending posts by views and likes.

**Parameters:**

- `limit` (number, default: 10): Number of posts

**Returns:**

- Array of trending posts

---

### `getBlogPostBySlug(slug)`

Fetch a full blog post by slug.

**Parameters:**

- `slug` (string): URL slug

**Returns:**

- Full blog post object with author info

---

### `getBlogPostsByCategory(category)`

Fetch published posts in a category.

**Parameters:**

- `category` (string): Category name

**Returns:**

- Array of posts in that category

---

### `getBlogPostsByAuthor(authorId)`

Fetch all posts by an author.

**Parameters:**

- `authorId` (uuid): Author user ID

**Returns:**

- Array of author's posts

---

### `createBlogPost(postData)`

Create a new blog post.

**Parameters:**

- `postData` (object): Post data with:
  - `slug`, `title`, `content`, `author_id` (required)
  - `excerpt`, `thumbnail` (optional)
  - `category` (default: 'Other')
  - `status` (default: 'draft')

**Returns:**

- Created post object

**Example:**

```javascript
const post = await createBlogPost({
  slug: 'my-first-post',
  title: 'My First Post',
  content: '# Content here',
  author_id: userId,
  category: 'Tutorial'
});
```

---

### `updateBlogPost(id, updates)`

Update a blog post.

**Parameters:**

- `id` (uuid): Post ID
- `updates` (object): Fields to update

**Returns:**

- Updated post object

---

### `publishBlogPost(id)`

Publish a blog post (sets status to 'published' and timestamp).

**Parameters:**

- `id` (uuid): Post ID

**Returns:**

- Updated post object with `status: 'published'`

---

### `incrementBlogPostViews(id)`

Increment view count for a post.

**Parameters:**

- `id` (uuid): Post ID

**Returns:**

- `{ success: true }`

**Note:** Call this when post is viewed to track engagement.

---

### `toggleBlogPostLike(id)`

Increment like count for a post.

**Parameters:**

- `id` (uuid): Post ID

**Returns:**

- Object with `{ likes: <new_count> }`

---

### `deleteBlogPost(id)`

Delete a blog post.

**Parameters:**

- `id` (uuid): Post ID

**Returns:**

- `{ success: true }`

---

### `getBlogComments(blogId)`

Fetch approved comments for a post.

**Parameters:**

- `blogId` (uuid): Blog post ID

**Returns:**

- Array of approved comments with user info

---

### `getAllBlogComments(blogId)`

Fetch all comments for a post (including unapproved).

**Parameters:**

- `blogId` (uuid): Blog post ID

**Returns:**

- Array of all comments

---

### `createBlogComment(commentData)`

Submit a new blog comment.

**Parameters:**

- `commentData` (object): Comment data with:
  - `blog_id`, `user_id`, `content` (required)
  - `parent_id` (optional, for nested replies)

**Returns:**

- Created comment object with user info

---

### `updateBlogComment(id, userId, content)`

Edit a comment (only author can edit).

**Parameters:**

- `id` (uuid): Comment ID
- `userId` (uuid): Comment author's user ID
- `content` (string): New comment text

**Returns:**

- Updated comment object

---

### `approveBlogComment(id)`

Approve a comment for display.

**Parameters:**

- `id` (uuid): Comment ID

**Returns:**

- Updated comment with `is_approved: true`

---

### `deleteBlogComment(id)`

Delete a blog comment.

**Parameters:**

- `id` (uuid): Comment ID

**Returns:**

- `{ success: true }`

---

## Achievements

### `getAllAchievements()`

Fetch all achievements, newest year first.

**Returns:**

- Array of achievement objects

---

### `getAchievementById(id)`

Fetch a single achievement with linked members.

**Parameters:**

- `id` (uuid): Achievement ID

**Returns:**

- Achievement object with member associations

---

### `getAchievementsByYear(year)`

Fetch achievements from a specific year.

**Parameters:**

- `year` (number): Year (e.g., 2024)

**Returns:**

- Array of achievements from that year

---

### `getAchievementsByCategory(category)`

Fetch achievements by category.

**Parameters:**

- `category` (string): Achievement category

**Returns:**

- Array of achievements in that category

---

### `getMostEarnedAchievements(limit)`

Fetch achievements with highest member count.

**Parameters:**

- `limit` (number, default: 10): Number of achievements

**Returns:**

- Array of popular achievements with `memberCount` field

---

### `createAchievement(achievementData)`

Create a new achievement record.

**Parameters:**

- `achievementData` (object): Achievement data with:
  - `title`, `contest_name`, `result`, `year` (required)
  - `category`, `description`, `achievement_date` (optional)
  - `is_team`, `team_name`, `participants` (optional)

**Returns:**

- Created achievement object

---

### `updateAchievement(id, updates)`

Update an achievement.

**Parameters:**

- `id` (uuid): Achievement ID
- `updates` (object): Fields to update

**Returns:**

- Updated achievement object

---

### `deleteAchievement(id)`

Delete an achievement.

**Parameters:**

- `id` (uuid): Achievement ID

**Returns:**

- `{ success: true }`

---

### `getMemberAchievements(userId)`

Fetch achievements earned by a member.

**Parameters:**

- `userId` (uuid): User ID

**Returns:**

- Array of achievements with details

---

### `getAchievementMembers(achievementId)`

Fetch all members associated with an achievement.

**Parameters:**

- `achievementId` (uuid): Achievement ID

**Returns:**

- Array of member objects

---

### `getAchievementMemberCount(achievementId)`

Get count of members with an achievement.

**Parameters:**

- `achievementId` (uuid): Achievement ID

**Returns:**

- Count as number

---

### `addMemberAchievement(achievementId, userId, position)`

Link a member to an achievement.

**Parameters:**

- `achievementId` (uuid): Achievement ID
- `userId` (uuid): User ID
- `position` (string, optional): Position/rank (e.g., '1st', '2nd')

**Returns:**

- Created association object

---

### `removeMemberAchievement(achievementId, userId)`

Remove member-achievement link.

**Parameters:**

- `achievementId` (uuid): Achievement ID
- `userId` (uuid): User ID

**Returns:**

- `{ success: true }`

---

## Notifications

### `getUserNotifications(userId, limit)`

Fetch a user's notifications newest first.

**Parameters:**

- `userId` (uuid): User ID
- `limit` (number, default: 20): Number of notifications

**Returns:**

- Array of notification objects

---

### `getUnreadNotifications(userId)`

Fetch all unread notifications for a user.

**Parameters:**

- `userId` (uuid): User ID

**Returns:**

- Array of unread notifications

---

### `getUnreadNotificationsCount(userId)`

Get count of unread notifications.

**Parameters:**

- `userId` (uuid): User ID

**Returns:**

- Count as number

---

### `createNotification(notificationData)`

Send a notification to a user.

**Parameters:**

- `notificationData` (object): Notification with:
  - `user_id`, `title`, `message` (required)
  - `notification_type` ('info', 'success', 'warning', 'error', 'event', 'mention', 'achievement')
  - `link` (optional): URL to navigate to

**Returns:**

- Created notification object

**Example:**

```javascript
await createNotification({
  user_id: userId,
  title: 'Event Registered',
  message: 'You registered for the Coding Contest',
  notification_type: 'success',
  link: '/events/coding-contest'
});
```

---

### `markNotificationAsRead(id, userId)`

Mark a notification as read.

**Parameters:**

- `id` (uuid): Notification ID
- `userId` (uuid): User ID (scope check)

**Returns:**

- Updated notification with `is_read: true`

---

### `markAllNotificationsAsRead(userId)`

Mark all unread notifications as read.

**Parameters:**

- `userId` (uuid): User ID

**Returns:**

- `{ success: true }`

---

### `deleteNotification(id, userId)`

Delete a notification.

**Parameters:**

- `id` (uuid): Notification ID
- `userId` (uuid): User ID (scope check)

**Returns:**

- `{ success: true }`

---

## Discussions

### `getDiscussionCategories()`

Fetch all discussion categories.

**Returns:**

- Array of category objects ordered by display_order

---

### `createDiscussionCategory(categoryData)`

Create a new discussion category.

**Parameters:**

- `categoryData` (object): Category data with:
  - `name` (required, unique)
  - `description`, `icon` (optional)
  - `display_order` (optional)

**Returns:**

- Created category object

---

### `updateDiscussionCategory(id, updates)`

Update a discussion category.

**Parameters:**

- `id` (uuid): Category ID
- `updates` (object): Fields to update

**Returns:**

- Updated category object

---

### `deleteDiscussionCategory(id)`

Delete a discussion category.

**Parameters:**

- `id` (uuid): Category ID

**Returns:**

- `{ success: true }`

---

### `getAllDiscussionThreads(limit, offset)`

Fetch paginated discussion threads.

**Parameters:**

- `limit` (number, default: 20): Number of threads per page
- `offset` (number, default: 0): Pagination offset

**Returns:**

- Array of thread objects (pinned threads first)

---

### `getDiscussionThreadsByCategory(categoryId, limit)`

Fetch threads in a specific category.

**Parameters:**

- `categoryId` (uuid): Category ID
- `limit` (number, default: 20): Number of threads

**Returns:**

- Array of threads in that category

---

### `getDiscussionThreadById(id)`

Fetch a single thread with full detail.

**Parameters:**

- `id` (uuid): Thread ID

**Returns:**

- Thread object with author and category info

---

### `createDiscussionThread(threadData)`

Create a new discussion thread.

**Parameters:**

- `threadData` (object): Thread data with:
  - `category_id`, `title`, `content`, `author_id` (required)
  - `tags` (optional array)

**Returns:**

- Created thread object

---

### `updateDiscussionThread(id, authorId, updates)`

Update a thread (only author can edit).

**Parameters:**

- `id` (uuid): Thread ID
- `authorId` (uuid): Thread author's ID
- `updates` (object): Fields to update

**Returns:**

- Updated thread object

---

### `pinDiscussionThread(id, pinned)`

Pin/unpin a thread to top.

**Parameters:**

- `id` (uuid): Thread ID
- `pinned` (boolean, default: true): Pin status

**Returns:**

- Updated thread object

---

### `lockDiscussionThread(id, locked)`

Lock/unlock a thread from new replies.

**Parameters:**

- `id` (uuid): Thread ID
- `locked` (boolean, default: true): Lock status

**Returns:**

- Updated thread object

---

### `markThreadSolved(id, solved)`

Mark thread as solved (for Q&A format).

**Parameters:**

- `id` (uuid): Thread ID
- `solved` (boolean, default: true): Solved status

**Returns:**

- Updated thread object

---

### `incrementThreadViews(id)`

Increment view count for a thread.

**Parameters:**

- `id` (uuid): Thread ID

**Returns:**

- `{ success: true }`

---

### `deleteDiscussionThread(id)`

Delete a discussion thread.

**Parameters:**

- `id` (uuid): Thread ID

**Returns:**

- `{ success: true }`

---

### `getThreadReplies(threadId)`

Fetch all replies to a thread.

**Parameters:**

- `threadId` (uuid): Thread ID

**Returns:**

- Array of reply objects oldest first

---

### `createDiscussionReply(replyData)`

Add a reply to a thread.

**Parameters:**

- `replyData` (object): Reply data with:
  - `thread_id`, `author_id`, `content` (required)
  - `parent_id` (optional, for nested replies)

**Returns:**

- Created reply object with user info

**Notes:**

- Automatically updates thread's `updated_at` timestamp
- Call this for thread activity tracking

---

### `updateDiscussionReply(id, authorId, content)`

Edit a reply (only author can edit).

**Parameters:**

- `id` (uuid): Reply ID
- `authorId` (uuid): Reply author's ID
- `content` (string): New reply text

**Returns:**

- Updated reply object

---

### `markReplyAsSolution(id, isSolution)`

Mark a reply as solution to a thread.

**Parameters:**

- `id` (uuid): Reply ID
- `isSolution` (boolean, default: true): Solution status

**Returns:**

- Updated reply object

---

### `deleteDiscussionReply(id)`

Delete a discussion reply.

**Parameters:**

- `id` (uuid): Reply ID

**Returns:**

- `{ success: true }`

---

### `voteOnThread(userId, threadId, voteType)`

Vote on a discussion thread.

**Parameters:**

- `userId` (uuid): Voting user ID
- `threadId` (uuid): Thread ID
- `voteType` (string): 'up' or 'down'

**Returns:**

- Created/updated vote object

---

### `voteOnReply(userId, replyId, voteType)`

Vote on a reply.

**Parameters:**

- `userId` (uuid): Voting user ID
- `replyId` (uuid): Reply ID
- `voteType` (string): 'up' or 'down'

**Returns:**

- Created/updated vote object

---

### `removeVote(userId, threadId, replyId)`

Remove a user's vote.

**Parameters:**

- `userId` (uuid): Voting user ID
- `threadId` (uuid, optional): Thread ID
- `replyId` (uuid, optional): Reply ID

**Returns:**

- `{ success: true }`

---

### `getUserVotes(userId)`

Fetch all votes cast by a user.

**Parameters:**

- `userId` (uuid): User ID

**Returns:**

- Array of vote records

---

## Certificates

### `getUserCertificates(userId)`

Fetch all certificates earned by a user.

**Parameters:**

- `userId` (uuid): User ID

**Returns:**

- Array of certificate objects with event/contest links

---

### `getCertificateByNumber(certificateNumber)`

Fetch a certificate by its unique number.

**Parameters:**

- `certificateNumber` (string): Certificate number

**Returns:**

- Certificate object with full recipient details

---

### `getEventCertificates(eventId)`

Fetch all certificates issued for an event.

**Parameters:**

- `eventId` (uuid): Event ID

**Returns:**

- Array of certificate objects with recipient info

---

### `issueCertificate(certificateData)`

Issue a new certificate.

**Parameters:**

- `certificateData` (object): Certificate data with:
  - `certificate_number`, `recipient_id`, `title` (required)
  - `issue_date` (required date)
  - `event_id` or `contest_id` (optional)
  - `certificate_type` ('participation', 'completion', 'achievement', 'appreciation')
  - `certificate_url` (optional URL to certificate image)

**Returns:**

- Created certificate object

**Example:**

```javascript
const cert = await issueCertificate({
  certificate_number: 'NEUPC-2024-001',
  recipient_id: userId,
  title: 'Coding Contest Winner',
  certificate_type: 'achievement',
  issue_date: '2024-02-21',
  event_id: eventId
});
```

---

### `verifyCertificate(certificateNumber)`

Verify a certificate's authenticity.

**Parameters:**

- `certificateNumber` (string): Certificate number

**Returns:**

- Certificate object if valid and verified, else `null`

---

### `deleteCertificate(id)`

Delete a certificate.

**Parameters:**

- `id` (uuid): Certificate ID

**Returns:**

- `{ success: true }`

---

## Committee Management

### `getCommitteePositions()`

Fetch all committee positions.

**Returns:**

- Array of position objects ordered by display_order

---

### `getPositionsByCategory(category)`

Fetch positions by category.

**Parameters:**

- `category` (string): 'executive', 'mentor', or 'advisor'

**Returns:**

- Array of positions in that category

---

### `createCommitteePosition(positionData)`

Create a new committee position.

**Parameters:**

- `positionData` (object): Position data with:
  - `title` (required)
  - `category` (required)
  - `responsibilities`, `display_order` (optional)

**Returns:**

- Created position object

---

### `updateCommitteePosition(id, updates)`

Update a committee position.

**Parameters:**

- `id` (uuid): Position ID
- `updates` (object): Fields to update

**Returns:**

- Updated position object

---

### `deleteCommitteePosition(id)`

Delete a committee position.

**Parameters:**

- `id` (uuid): Position ID

**Returns:**

- `{ success: true }`

---

### `getCurrentCommittee()`

Fetch current committee members.

**Returns:**

- Array of current committee member objects with user and position info

---

### `getAllCommitteeMembers()`

Fetch all committee members (historical).

**Parameters:**

- None

**Returns:**

- Array of all committee members sorted by term start

---

### `addCommitteeMember(memberData)`

Add a member to the committee.

**Parameters:**

- `memberData` (object): Member data with:
  - `user_id`, `position_id`, `term_start` (required)
  - `term_end`, `bio`, `display_order` (optional)
  - `is_current` (default: true)

**Returns:**

- Created committee member object

---

### `updateCommitteeMember(id, updates)`

Update a committee member record.

**Parameters:**

- `id` (uuid): Member record ID
- `updates` (object): Fields to update

**Returns:**

- Updated member object

---

### `removeCommitteeMember(id)`

Remove a committee member.

**Parameters:**

- `id` (uuid): Member record ID

**Returns:**

- `{ success: true }`

---

## Mentorships

### `getAllMentorships()`

Fetch all mentorship pairs.

**Returns:**

- Array of mentorship objects with mentor and mentee info

---

### `getActiveMentorships()`

Fetch currently active mentorships.

**Returns:**

- Array of active mentorship objects

---

### `getMentorshipsByMentor(mentorId)`

Fetch all mentees for a mentor.

**Parameters:**

- `mentorId` (uuid): Mentor user ID

**Returns:**

- Array of mentorship objects with mentee profiles

---

### `getMentorshipsByMentee(menteeId)`

Fetch all mentors for a mentee.

**Parameters:**

- `menteeId` (uuid): Mentee user ID

**Returns:**

- Array of mentorship objects with mentor info

---

### `createMentorship(mentorshipData)`

Create a new mentorship relationship.

**Parameters:**

- `mentorshipData` (object): Mentorship data with:
  - `mentor_id`, `mentee_id` (required)
  - `start_date` (required date)
  - `focus_area`, `notes` (optional)
  - `status` (default: 'active')

**Returns:**

- Created mentorship object

---

### `updateMentorship(id, updates)`

Update a mentorship record.

**Parameters:**

- `id` (uuid): Mentorship ID
- `updates` (object): Fields to update

**Returns:**

- Updated mentorship object

---

### `deleteMentorship(id)`

Delete a mentorship relationship.

**Parameters:**

- `id` (uuid): Mentorship ID

**Returns:**

- `{ success: true }`

---

### `getMentorshipSessions(mentorshipId)`

Fetch session logs for a mentorship.

**Parameters:**

- `mentorshipId` (uuid): Mentorship ID

**Returns:**

- Array of session objects newest first

---

### `createMentorshipSession(sessionData)`

Log a mentorship session.

**Parameters:**

- `sessionData` (object): Session data with:
  - `mentorship_id`, `session_date` (required)
  - `topic`, `duration`, `notes` (optional)
  - `attended` (default: false)

**Returns:**

- Created session object

---

### `updateMentorshipSession(id, updates)`

Update a mentorship session.

**Parameters:**

- `id` (uuid): Session ID
- `updates` (object): Fields to update

**Returns:**

- Updated session object

---

### `deleteMentorshipSession(id)`

Delete a mentorship session.

**Parameters:**

- `id` (uuid): Session ID

**Returns:**

- `{ success: true }`

---

## Weekly Tasks

### `getAllWeeklyTasks()`

Fetch all weekly tasks.

**Returns:**

- Array of task objects with creator info, ordered by deadline

---

### `getActiveWeeklyTasks()`

Fetch tasks with deadline not yet passed.

**Returns:**

- Array of active tasks ordered by deadline

---

### `getWeeklyTaskById(id)`

Fetch a single task.

**Parameters:**

- `id` (uuid): Task ID

**Returns:**

- Task object with creator info

---

### `createWeeklyTask(taskData)`

Create a new weekly task.

**Parameters:**

- `taskData` (object): Task data with:
  - `title`, `deadline`, `assigned_by` (required)
  - `description`, `difficulty` (optional)
  - `problem_links`, `target_audience` (optional arrays)

**Returns:**

- Created task object

---

### `updateWeeklyTask(id, updates)`

Update a task.

**Parameters:**

- `id` (uuid): Task ID
- `updates` (object): Fields to update

**Returns:**

- Updated task object

---

### `deleteWeeklyTask(id)`

Delete a task.

**Parameters:**

- `id`(uuid): Task ID

**Returns:**

- `{ success: true }`

---

### `getTaskSubmissions(taskId)`

Fetch all submissions for a task.

**Parameters:**

- `taskId` (uuid): Task ID

**Returns:**

- Array of submission objects with user and profile info

---

### `getUserTaskSubmissions(userId)`

Fetch a user's submission history.

**Parameters:**

- `userId` (uuid): User ID

**Returns:**

- Array of submission objects with task summaries

---

### `getUserTaskSubmission(taskId, userId)`

Fetch a user's submission for a specific task.

**Parameters:**

- `taskId` (uuid): Task ID
- `userId` (uuid): User ID

**Returns:**

- Submission object or `null`

---

### `createTaskSubmission(submissionData)`

Submit a task solution.

**Parameters:**

- `submissionData` (object): Submission data with:
  - `task_id`, `user_id` (required)
  - `submission_url`, `code`, `notes` (optional)
  - `status` (default: 'pending')

**Returns:**

- Created submission object

---

### `updateTaskSubmission(id, userId, updates)`

Update a submission (scope checked to user).

**Parameters:**

- `id` (uuid): Submission ID
- `userId` (uuid): Submitter's user ID
- `updates` (object): Fields to update

**Returns:**

- Updated submission object

---

### `reviewTaskSubmission(id, reviewedBy, status, feedback)`

Review and provide feedback on a submission.

**Parameters:**

- `id` (uuid): Submission ID
- `reviewedBy` (uuid): Reviewer user ID
- `status` (string): 'pending', 'completed', 'late', or 'missed'
- `feedback` (string): Review feedback

**Returns:**

- Updated submission object

---

### `deleteTaskSubmission(id)`

Delete a submission.

**Parameters:**

- `id` (uuid): Submission ID

**Returns:**

- `{ success: true }`

---

### `bulkUpdateSubmissionStatus(taskId, ids, newStatus)`

Bulk update submission statuses for a task.

**Parameters:**

- `taskId` (uuid): Task ID
- `ids` (array): Array of submission IDs
- `newStatus` (string): New status to assign

**Returns:**

- `{ success: true }`

---

## Resources

### `getAllResources()`

Fetch all resources, newest first.

**Returns:**

- Array of resource objects

---

### `getResourcesByCategory(category)`

Fetch resources by category.

**Parameters:**

- `category` (string): Category name

**Returns:**

- Array of resources sorted by upvotes

---

### `getResourcesByDifficulty(difficulty)`

Fetch resources by difficulty level.

**Parameters:**

- `difficulty` (string): 'beginner', 'intermediate', or 'advanced'

**Returns:**

- Array of resources sorted by upvotes

---

### `getFeaturedResources()`

Fetch featured resources.

**Returns:**

- Array of featured resources sorted by upvotes

---

### `getFreeResources()`

Fetch free resources.

**Returns:**

- Array of free resources sorted by upvotes

---

### `searchResources(query)`

Search resources by title or description.

**Parameters:**

- `query` (string): Search query

**Returns:**

- Array of matching resources (case-insensitive)

---

### `createResource(resourceData)`

Create a new resource.

**Parameters:**

- `resourceData` (object): Resource data with:
  - `title`, `url`, `category` (required)
  - `resource_type` ('article', 'video', 'course', 'book', 'tool', etc.)
  - `description`, `thumbnail`, `difficulty` (optional)
  - `is_free`, `is_featured` (optional booleans)

**Returns:**

- Created resource object

---

### `updateResource(id, updates)`

Update a resource.

**Parameters:**

- `id` (uuid): Resource ID
- `updates` (object): Fields to update

**Returns:**

- Updated resource object

---

### `upvoteResource(id)`

Increment upvote count for a resource.

**Parameters:**

- `id` (uuid): Resource ID

**Returns:**

- `{ success: true }`

---

### `deleteResource(id)`

Delete a resource.

**Parameters:**

- `id` (uuid): Resource ID

**Returns:**

- `{ success: true }`

---

## Roadmaps

### `getAllRoadmaps()`

Fetch all roadmaps, newest first.

**Returns:**

- Array of roadmap objects

---

### `getPublishedRoadmaps()`

Fetch published roadmaps, most viewed first.

**Returns:**

- Array of published roadmaps

---

### `getRoadmapBySlug(slug)`

Fetch a roadmap by slug with creator info.

**Parameters:**

- `slug` (string): URL slug

**Returns:**

- Roadmap object with full content and creator

---

### `getRoadmapsByCategory(category)`

Fetch published roadmaps in a category.

**Parameters:**

- `category` (string): Category name

**Returns:**

- Array of roadmaps in that category

---

### `getFeaturedRoadmapsByCategory(category)`

Fetch featured roadmaps in a category.

**Parameters:**

- `category` (string): Category name

**Returns:**

- Array of featured roadmaps in that category

---

### `createRoadmap(roadmapData)`

Create a new roadmap.

**Parameters:**

- `roadmapData` (object): Roadmap data with:
  - `slug`, `title`, `category` (required)
  - `content` (JSONB, required - typically array of steps)
  - `description`, `thumbnail`, `estimated_duration` (optional)
  - `difficulty` (default: 'beginner')
  - `status` (default: 'draft')

**Returns:**

- Created roadmap object

---

### `updateRoadmap(id, updates)`

Update a roadmap.

**Parameters:**

- `id` (uuid): Roadmap ID
- `updates` (object): Fields to update

**Returns:**

- Updated roadmap object

---

### `incrementRoadmapViews(id)`

Increment view count for a roadmap.

**Parameters:**

- `id` (uuid): Roadmap ID

**Returns:**

- `{ success: true }`

---

### `deleteRoadmap(id)`

Delete a roadmap.

**Parameters:**

- `id` (uuid): Roadmap ID

**Returns:**

- `{ success: true }`

---

## Gallery

### `getAllGalleryItems()`

Fetch all gallery items ordered by display order.

**Returns:**

- Array of gallery item objects

---

### `getFeaturedGalleryItems()`

Fetch featured gallery items.

**Returns:**

- Array of featured items

---

### `getGalleryItemsByEvent(eventId)`

Fetch gallery items for an event.

**Parameters:**

- `eventId` (uuid): Event ID

**Returns:**

- Array of gallery items ordered by display order

---

### `getGalleryItemsByCategory(category)`

Fetch gallery items by category.

**Parameters:**

- `category` (string): Category name

**Returns:**

- Array of items in that category

---

### `addGalleryItem(itemData)`

Add a gallery item.

**Parameters:**

- `itemData` (object): Item data with:
  - `url` (required)
  - `type` ('image' or 'video', default: 'image')
  - `caption`, `category`, `event_id` (optional)
  - `display_order`, `is_featured` (optional)

**Returns:**

- Created gallery item

---

### `updateGalleryItem(id, updates)`

Update a gallery item.

**Parameters:**

- `id` (uuid): Item ID
- `updates` (object): Fields to update

**Returns:**

- Updated item object

---

### `deleteGalleryItem(id)`

Delete a gallery item.

**Parameters:**

- `id` (uuid): Item ID

**Returns:**

- `{ success: true }`

---

## Join Requests

### `getAllJoinRequests()`

Fetch all join requests, newest first.

**Returns:**

- Array of join request objects

---

### `getPendingJoinRequests()`

Fetch unreviewed join requests.

**Returns:**

- Array of pending requests

---

### `getJoinRequestById(id)`

Fetch a single join request.

**Parameters:**

- `id` (uuid): Request ID

**Returns:**

- Join request object

---

### `getJoinRequestByEmail(email)`

Fetch all requests from an email.

**Parameters:**

- `email` (string): Email address

**Returns:**

- Array of requests from that email

---

### `createJoinRequest(requestData)`

Submit a membership application.

**Parameters:**

- `requestData` (object): Application data with:
  - `name`, `email`, `student_id`, `batch`, `department` (required)
  - `phone`, `interests`, `reason` (optional)
  - `codeforces_handle`, `github` (optional)

**Returns:**

- Created join request object

---

### `approveJoinRequest(id, reviewedBy)`

Approve a join request.

**Parameters:**

- `id` (uuid): Request ID
- `reviewedBy` (uuid): Approving admin ID

**Returns:**

- Updated request with `status: 'approved'`

---

### `rejectJoinRequest(id, reviewedBy, rejectionReason)`

Reject a join request.

**Parameters:**

- `id` (uuid): Request ID
- `reviewedBy` (uuid): Admin rejecting
- `rejectionReason` (string): Reason for rejection

**Returns:**

- Updated request with `status: 'rejected'`

---

## Contact Submissions

### `getAllContactSubmissions()`

Fetch all contact form submissions, newest first.

**Returns:**

- Array of submission objects

---

### `getNewContactSubmissions()`

Fetch unprocessed (new) contact submissions.

**Returns:**

- Array of new submissions

---

### `getContactSubmissionById(id)`

Fetch a single submission.

**Parameters:**

- `id` (uuid): Submission ID

**Returns:**

- Submission object

---

### `createContactSubmission(submissionData)`

Create a contact form submission.

**Parameters:**

- `submissionData` (object): Submission with:
  - `name`, `email`, `message` (required)
  - `subject` (optional)

**Returns:**

- Created submission object

---

### `updateContactSubmissionStatus(id, status, repliedBy)`

Update submission status.

**Parameters:**

- `id` (uuid): Submission ID
- `status` (string): New status ('new', 'read', 'replied', 'archived')
- `repliedBy` (uuid, optional): Admin replying

**Returns:**

- Updated submission object

---

## Budget Management

### `getAllBudgetEntries()`

Fetch all budget entries with event and creator info.

**Returns:**

- Array of budget entry objects

---

### `getBudgetEntriesByEvent(eventId)`

Fetch budget entries for an event.

**Parameters:**

- `eventId` (uuid): Event ID

**Returns:**

- Array of entries for that event

---

### `getBudgetEntriesByType(type)`

Fetch budget entries by type.

**Parameters:**

- `type` (string): 'income' or 'expense'

**Returns:**

- Array of entries of that type

---

### `getBudgetSummary()`

Calculate budget summary statistics.

**Returns:**

- Object with:
  - `totalIncome`: Sum of all income
  - `totalExpenses`: Sum of all expenses
  - `balance`: Net balance (income - expenses)

---

### `createBudgetEntry(entryData)`

Record a budget transaction.

**Parameters:**

- `entryData` (object): Entry data with:
  - `title`, `amount`, `entry_type`, `transaction_date` (required)
  - `description`, `category`, `event_id` (optional)
  - `receipt_url` (optional)

**Returns:**

- Created entry object

---

### `approveBudgetEntry(id, approvedBy)`

Approve a budget entry.

**Parameters:**

- `id` (uuid): Entry ID
- `approvedBy` (uuid): Approving admin ID

**Returns:**

- Updated entry with approval details

---

### `deleteBudgetEntry(id)`

Delete a budget entry.

**Parameters:**

- `id` (uuid): Entry ID

**Returns:**

- `{ success: true }`

---

## Settings

### `getAllSettings()`

Fetch all website settings.

**Returns:**

- Array of setting objects

---

### `getSettingsByCategory(category)`

Fetch settings in a category.

**Parameters:**

- `category` (string): Category name

**Returns:**

- Array of settings in that category

---

### `getSetting(key)`

Fetch a single setting value.

**Parameters:**

- `key` (string): Setting key

**Returns:**

- Setting value or `null`

---

### `upsertSetting(key, value, updatedBy, category, description)`

Insert or update a setting.

**Parameters:**

- `key` (string): Unique setting key
- `value` (any): Setting value (will be stored as JSONB)
- `updatedBy` (uuid): Admin updating
- `category` (string, optional): Category name
- `description` (string, optional): Description

**Returns:**

- Created/updated setting object

---

### `deleteSetting(key)`

Delete a setting.

**Parameters:**

- `key` (string): Setting key

**Returns:**

- `{ success: true }`

---

## Statistics & Aggregations

### `getPlatformStatistics()`

Get comprehensive platform statistics.

**Returns:**

- Object with:
  - `totalUsers`: Total registered users
  - `approvedMembers`: Approved members count
  - `totalEvents`: Published events count
  - `totalContests`: All contests count

**Example:**

```javascript
const stats = await getPlatformStatistics();
console.log(`Platform: ${stats.totalUsers} users, ${stats.approvedMembers} members`);
```

---

### `getDashboardMetrics()`

Get quick metrics for admin dashboard.

**Returns:**

- Object with:
  - `pendingMemberApprovals`: Count of pending members
  - `pendingJoinRequests`: Count of pending applications
  - `upcomingEvents`: Count of upcoming events
  - `unreadContacts`: Count of new contact submissions

---

## Search & Filtering

### `searchUsers(query)`

Search users by name or email.

**Parameters:**

- `query` (string): Search query

**Returns:**

- Array of matching users (max 20)

**Example:**

```javascript
const results = await searchUsers('john');
```

---

### `searchBlogPosts(query)`

Search blog posts by title or content.

**Parameters:**

- `query` (string): Search query

**Returns:**

- Array of matching published posts (max 20)

---

### `searchResources(query)`

Search resources by title or description.

**Parameters:**

- `query` (string): Search query

**Returns:**

- Array of matching resources (max 20)

---

## Bulk Operations

### `bulkUpdateSubmissionStatus(taskId, ids, newStatus)`

Update multiple submission statuses at once.

**Parameters:**

- `taskId` (uuid): Task ID
- `ids` (array): Array of submission IDs to update
- `newStatus` (string): Status to assign to all

**Returns:**

- `{ success: true }`

---

### `bulkIssueCertificates(eventId, certificateData)`

Issue multiple certificates at once.

**Parameters:**

- `eventId` (uuid): Event ID (for context)
- `certificateData` (array): Array of certificate objects

**Returns:**

- Array of created certificate objects

---

## Activity Logs

### `getActivityLogs(limit)`

Fetch recent activity logs.

**Parameters:**

- `limit` (number, default: 50): Number of logs

**Returns:**

- Array of activity log objects with user info

---

### `getUserActivityLogs(userId, limit)`

Fetch activity logs for a user.

**Parameters:**

- `userId` (uuid): User ID
- `limit` (number, default: 50): Number of logs

**Returns:**

- Array of user's activity logs

---

### `getActivityLogsByAction(action, limit)`

Fetch activity logs by action type.

**Parameters:**

- `action` (string): Action name
- `limit` (number, default: 50): Number of logs

**Returns:**

- Array of logs for that action

---

### `createActivityLog(userId, action, entityType, entityId, details)`

Create an activity log entry.

**Parameters:**

- `userId` (uuid): User performing action
- `action` (string): Action name
- `entityType` (string): Type of entity affected
- `entityId` (uuid): ID of affected entity
- `details` (object, optional): Additional details

**Returns:**

- Created log object or `null` on failure (non-critical)

**Example:**

```javascript
await createActivityLog(
  userId,
  'update_event',
  'event',
  eventId,
  { title_changed: true }
);
```

---

## Error Handling

All functions follow consistent error handling:

```javascript
try {
  const result = await getUserById(userId);
  console.log(result);
} catch (error) {
  console.error('Error:', error.message);
  // Handle error appropriately
}
```

**Common errors:**

- `Database error messages` - Supabase query failures
- Timeout errors - Network issues
- Authentication errors - Permission denied

---

## Best Practices

1. **Always handle errors** in try-catch blocks
2. **Batch related queries** using `Promise.all()` for efficiency
3. **Use aggregation functions** where applicable instead of fetching all data
4. **Call search functions** with proper query strings (case-insensitive)
5. **Scope-check user operations** when needed (e.g., editing own comment)
6. **Use pagination** for large datasets
7. **Filter by status** when fetching published/active items
8. **Log important actions** using`createActivityLog()`

---

## Integration Examples

### Complete Event Registration Flow

```javascript
// 1. Fetch event
const event = await getEventBySlug('coding-contest-2024');

// 2. Check if user already registered
const existing = await getEventRegistration(event.id, userId);
if (existing) throw new Error('Already registered');

// 3. Register user
const registration = await createEventRegistration({
  event_id: event.id,
  user_id: userId,
  status: 'registered'
});

// 4. Send notification
await createNotification({
  user_id: userId,
  title: 'Event Registered',
  message: `You're registered for ${event.title}`,
  notification_type: 'success',
  link: `/events/${event.slug}`
});

// 5. Log activity
await createActivityLog(
  userId,
  'register_event',
  'event',
  event.id
);
```

### Member Approval Workflow

```javascript
// 1. Get pending applications
const pending = await getPendingJoinRequests();

// 2. Approve one
const request = await approveJoinRequest(requestId, adminId);

// 3. Fetch or create user...
const user = await getUserByEmail(request.email);

// 4. Create member profile
await createMemberProfile({
  user_id: user.id,
  student_id: request.student_id,
  batch: request.batch,
  department: request.department
});

// 5. Approve profile
await approveMemberProfile(user.id, adminId);

// 6. Activate account
await activateUser(user.id, adminId, 'Application approved');

// 7. Log and notify
await createActivityLog(adminId, 'approve_member', 'user', user.id);
await createNotification({
  user_id: user.id,
  title: 'Welcome to NEUPC!',
  message: 'Your membership application has been approved!',
  notification_type: 'success'
});
```

---

## Version History

- **v1.0.0** (2024-02-21) - Initial comprehensive documentation
- Complete function documentation with parameters and examples
- Error handling guidelines and best practices
- Integration examples for common workflows

---

## Support

For issues or questions:

- Check the database schema in `docs/database-documentation.md`
- Review function examples in this guide
- Check Supabase documentation for query limitations
- Log issues with detailed error messages
