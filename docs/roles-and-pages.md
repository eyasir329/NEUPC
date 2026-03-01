# Roles & Pages

Six user roles, each with its own protected dashboard under `/account/<role>/`.

All routes require `requireRole('<role>')` at the page level and in every server action.

---

## Role Hierarchy

```
guest → member → mentor
                 executive    ← operations management
                 advisor      ← faculty oversight
                 admin        ← full platform control
```

A user can hold multiple roles simultaneously. The active role is stored in the JWT and can be switched via `switchRoleAction()`.

---

## Guest — `/account/guest/`

New sign-ins land here. Limited access until an admin approves their membership application.

| Page | Path | Description |
|---|---|---|
| Dashboard | `/account/guest` | Welcome screen, account status banner |
| Events | `/account/guest/events` | Browse published events |
| Membership Application | `/account/guest/membership-application` | Submit join request form |
| Notifications | `/account/guest/notifications` | System notifications |
| Participation | `/account/guest/participation` | Events participated in |
| Profile | `/account/guest/profile` | Basic info |
| Settings | `/account/guest/settings` | Account preferences |

---

## Member — `/account/member/`

Full club member. Access to all community features.

| Page | Path | Description |
|---|---|---|
| Dashboard | `/account/member` | Stats, upcoming events, notices |
| Achievements | `/account/member/achievements` | Personal achievement history |
| Certificates | `/account/member/certificates` | Issued certificates |
| Contests | `/account/member/contests` | Join/leave contests, standings |
| Discussions | `/account/member/discussions` | Forum — create threads, reply, vote |
| Events | `/account/member/events` | Register for events, attendance history |
| Gallery | `/account/member/gallery` | Photo gallery |
| Notices | `/account/member/notices` | Club announcements |
| Notifications | `/account/member/notifications` | Notification center |
| Participation | `/account/member/participation` | Full participation history |
| Problem Set | `/account/member/problem-set` | Curated CP problem list |
| Profile | `/account/member/profile` | Full profile — student ID, social links, etc. |
| Resources | `/account/member/resources` | Learning materials, upvote resources |
| Roadmap | `/account/member/roadmap` | Learning path roadmaps |
| Settings | `/account/member/settings` | Account settings |

---

## Mentor — `/account/mentor/`

Assigned to guide junior members through the mentorship program.

| Page | Path | Description |
|---|---|---|
| Dashboard | `/account/mentor` | Mentee overview, session count |
| Assigned Members | `/account/mentor/assigned-members` | View and manage mentees |
| Notices | `/account/mentor/notices` | Club announcements |
| Profile | `/account/mentor/profile` | Mentor profile |
| Recommendations | `/account/mentor/recommendations` | Write member recommendations |
| Resources | `/account/mentor/resources` | Create/delete shared resources |
| Sessions | `/account/mentor/sessions` | Log mentorship sessions |
| Settings | `/account/mentor/settings` | Account settings |
| Tasks | `/account/mentor/tasks` | Assign weekly tasks, review submissions |

---

## Executive — `/account/executive/`

Elected committee members managing day-to-day club operations.

| Page | Path | Description |
|---|---|---|
| Dashboard | `/account/executive` | Operations overview |
| Blogs | `/account/executive/blogs/manage` | Create, edit, publish, delete blogs |
| Certificates | `/account/executive/certificates/generate` | Issue and bulk-issue certificates |
| Contests | `/account/executive/contests/manage` | Create and manage contests |
| Events | `/account/executive/events/manage` | Full event management |
| Gallery | `/account/executive/gallery/manage` | Upload and manage gallery items |
| Members | `/account/executive/members` | View member list |
| Notices | `/account/executive/notices/create` | Post club announcements |
| Profile | `/account/executive/profile` | Profile management |
| Registrations | `/account/executive/registrations` | Manage registrations, mark attendance |
| Reports | `/account/executive/reports` | Activity and analytics reports |

---

## Advisor — `/account/advisor/`

Faculty advisors with oversight, approval authority, and budget management.

| Page | Path | Description |
|---|---|---|
| Dashboard | `/account/advisor` | High-level club overview |
| Achievements | `/account/advisor/achievements` | Review achievements |
| Analytics | `/account/advisor/analytics` | Platform analytics |
| Approvals | `/account/advisor/approvals` | Approve join requests and member profiles |
| Budget | `/account/advisor/budget` | Review and approve budget entries |
| Club Overview | `/account/advisor/club-overview` | Full club summary |
| Committee | `/account/advisor/committee` | Committee member overview |
| Events | `/account/advisor/events` | Event oversight |
| Profile | `/account/advisor/profile` | Profile management |
| Reports | `/account/advisor/reports` | Performance and activity reports |

---

## Admin — `/account/admin/`

Complete platform control. 16 management pages plus user sub-routes.

| Page | Path | Description |
|---|---|---|
| Dashboard | `/account/admin` | Platform health, key metrics |
| Achievements | `/account/admin/achievements` | Create/edit/delete, assign to members |
| Analytics | `/account/admin/analytics` | Full platform analytics |
| Applications | `/account/admin/applications` | Membership applications — approve/reject/bulk |
| Blogs | `/account/admin/blogs` | Manage all blog posts and comments |
| Contact Submissions | `/account/admin/contact-submissions` | Contact form inbox |
| Events | `/account/admin/events` | All event management |
| Export | `/account/admin/export` | Export data for 10 domains (CSV/JSON) |
| Gallery | `/account/admin/gallery` | Full gallery management |
| Notices | `/account/admin/notices` | Notice board |
| Resources | `/account/admin/resources` | Resource library management |
| Roles | `/account/admin/roles` | Role × permission matrix, assign/remove roles |
| Security | `/account/admin/security` | Security event log |
| Settings | `/account/admin/settings` | Site-wide key-value settings |
| System Logs | `/account/admin/system-logs` | Full activity log |
| Users | `/account/admin/users` | User list — search, filter, bulk actions |
| Create user | `/account/admin/users/create` | Manually create a user |
| Edit user | `/account/admin/users/[userId]/edit` | Edit role, status, profile for any user |

---

## Adding a New Role

1. Insert a row into the `roles` table in Supabase
2. Create `app/account/<newrole>/` directory with `layout.js` + `page.js`
3. Add `requireRole('<newrole>')` at the top of each page
4. Add entries to `sidebarConfig.js` and `roleDashboardConfig.js`
5. Update `proxy.js` matcher if needed
6. Add role-specific server actions under `app/_lib/<newrole>-actions.js`
