# Data Service

`app/_lib/data-service.js` — the central data access layer.  
**262 exported async functions**, ~3,700 lines.

All components and server actions call functions from this file.  
No raw Supabase queries exist outside this module.

Both `supabase` (RLS-enforced) and `supabaseAdmin` (bypasses RLS) are used internally depending on the operation.

---

## Users

| Function | Description |
|---|---|
| `getUserByEmail(email)` | Find user by email |
| `getUserById(id)` | Find user by UUID |
| `createUser(data)` | Create new user record |
| `updateUser(email, updates)` | Update user fields |
| `deleteUser(id)` | Delete user |
| `getAllUsers(filters?)` | All users with optional role/status filters |
| `getUsersBasic()` | Minimal user list (id, name, email, role) |
| `getUsersForSelector()` | Dropdown-friendly list |
| `getUserStats()` | Aggregate user counts by role/status |
| `updateUserAccountStatus(id, status)` | Set account_status directly |
| `suspendUser(id)` | account_status → suspended |
| `activateUser(id)` | account_status → active |
| `banUser(id)` | account_status → banned |
| `approveMember(id)` | account_status → active + assign member role |
| `createAdminUser(data)` | Create user with admin role |
| `updateAdminUser(id, data)` | Admin-level user update |
| `getUserRoles(email)` | Array of roles for a user |
| `searchUsers(query)` | Full-text search on name/email |

---

## Roles & Permissions

| Function | Description |
|---|---|
| `getAllRoles()` | All roles |
| `getRoleByName(name)` | Single role by name |
| `getAllPermissions()` | All permission definitions |
| `getRolesWithStats()` | Roles with user count per role |
| `getPermissionsByCategory(category)` | Permissions filtered by category |
| `getRolePermissions(roleId)` | Permissions assigned to a role |
| `assignPermissionToRole(roleId, permId)` | Add permission to role |
| `removePermissionFromRole(roleId, permId)` | Remove permission |
| `assignRoleToUser(userId, roleId)` | Give user a role |
| `removeRoleFromUser(userId, roleId)` | Remove role from user |
| `updateUserRole(userId, roleId)` | Replace primary role |

---

## Member Profiles

| Function | Description |
|---|---|
| `getAllMemberProfiles(filters?)` | All profiles, optional filters |
| `getMemberProfileByUserId(userId)` | Profile by user UUID |
| `getMemberProfileByStudentId(studentId)` | Profile by student ID |
| `getApprovedMembers()` | Members with approved profiles |
| `getPendingMemberProfiles()` | Profiles awaiting approval |
| `getMembersByBatch(batch)` | Filter by admission batch |
| `createMemberProfile(data)` | Create member profile |
| `updateMemberProfile(userId, data)` | Update profile fields |
| `approveMemberProfile(userId)` | Mark profile approved |
| `getMemberStatistics(userId)` | Single member stats |
| `getAllMemberStatistics()` | All member stats |
| `upsertMemberStatistics(userId, data)` | Create or update stats |
| `getLeaderboard(limit?)` | Members ranked by points/activity |
| `getMemberProgress(userId)` | Progress records for a member |
| `createMemberProgress(data)` | Add progress entry |
| `updateMemberProgress(id, data)` | Update progress entry |
| `deleteMemberProgress(id)` | Delete progress entry |

---

## Events

| Function | Description |
|---|---|
| `getAllEvents()` | All events (admin) |
| `getPublishedEvents()` | Published events only |
| `getUpcomingEvents(limit?)` | Events in the future |
| `getPastEvents(limit?)` | Events in the past |
| `getFeaturedEvents()` | Featured events |
| `getEventBySlug(slug)` | Single event by slug |
| `getEventById(id)` | Single event by UUID |
| `getEventsByCategory(category)` | Filter by category |
| `createEvent(data)` | Create event |
| `updateEvent(id, data)` | Update event |
| `deleteEvent(id)` | Delete event |
| `getEventsWithStats()` | Events with registration counts |
| `getEventRegistrationCount(eventId)` | Count registrations |

---

## Event Registrations & Attendance

| Function | Description |
|---|---|
| `getEventRegistrations(eventId)` | All registrations for event |
| `getUserEventRegistrations(userId)` | All events a user registered for |
| `getEventRegistration(eventId, userId)` | Single registration record |
| `createEventRegistration(data)` | Register a user |
| `updateEventRegistration(id, data)` | Update registration |
| `cancelEventRegistration(eventId, userId)` | Cancel registration |
| `markAttendance(registrationId, attended)` | Mark attended true/false |
| `getEventOrganizers(eventId)` | Organizers of an event |
| `addEventOrganizer(eventId, userId)` | Add organizer |
| `removeEventOrganizer(eventId, userId)` | Remove organizer |
| `getEventGallery(eventId)` | Gallery items for event |
| `addEventGalleryItem(data)` | Add item to event gallery |
| `deleteEventGalleryItem(id)` | Remove item |

---

## Contests

| Function | Description |
|---|---|
| `getAllContests()` | All contests |
| `getContestBySlug(slug)` | Single contest by slug |
| `getContestById(id)` | Single contest by UUID |
| `getUpcomingContests()` | Future contests |
| `getPastContests()` | Past contests |
| `getOfficialContests()` | Official contests only |
| `getContestsByPlatform(platform)` | Filter by platform |
| `createContest(data)` | Create contest |
| `updateContest(id, data)` | Update contest |
| `deleteContest(id)` | Delete contest |
| `getContestParticipantCount(contestId)` | Participant count |
| `getContestParticipants(contestId)` | Full participant list |
| `getUserContestParticipations(userId)` | Contests a user joined |
| `addContestParticipant(contestId, userId)` | Join contest |
| `updateContestParticipant(id, data)` | Update participation data |

---

## Blog Posts

| Function | Description |
|---|---|
| `getAllBlogPosts()` | All posts (admin) |
| `getPublishedBlogPosts()` | Published only |
| `getFeaturedBlogPosts()` | Featured posts |
| `getBlogPostBySlug(slug)` | Single post by slug |
| `getBlogPostsByCategory(category)` | Filter by category |
| `getBlogPostsByAuthor(userId)` | Posts by a specific author |
| `getTrendingBlogPosts(limit?)` | Most viewed posts |
| `getBlogsWithStats()` | Posts with view/comment/like counts |
| `createBlogPost(data)` | Create post |
| `updateBlogPost(id, data)` | Update post |
| `publishBlogPost(id)` | Set status to published |
| `deleteBlogPost(id)` | Delete post |
| `incrementBlogPostViews(id)` | Atomic view count increment |
| `toggleBlogPostLike(postId, userId)` | Toggle like |
| `searchBlogPosts(query)` | Full-text search |

---

## Blog Comments

| Function | Description |
|---|---|
| `getBlogComments(postId)` | Approved comments for post |
| `getAllBlogComments(postId)` | All comments including pending |
| `createBlogComment(data)` | Add comment |
| `updateBlogComment(id, data)` | Edit comment |
| `approveBlogComment(id)` | Approve pending comment |
| `deleteBlogComment(id)` | Delete comment |

---

## Achievements

| Function | Description |
|---|---|
| `getAllAchievements()` | All achievements (public) |
| `getAchievementsAdmin()` | All achievements (admin view) |
| `getAchievementById(id)` | Single achievement |
| `getAchievementsByYear(year)` | Filter by year |
| `getAchievementsByCategory(category)` | Filter by category |
| `createAchievement(data)` | Create achievement |
| `updateAchievement(id, data)` | Update achievement |
| `deleteAchievement(id)` | Delete achievement |
| `getMemberAchievements(userId)` | Achievements earned by a member |
| `getAchievementMembers(achievementId)` | Members linked to achievement |
| `addMemberAchievement(achievementId, userId)` | Link member |
| `removeMemberAchievement(achievementId, userId)` | Unlink member |
| `getAchievementMemberCount(achievementId)` | Member count |
| `getMostEarnedAchievements(limit?)` | Top achievements by earner count |

---

## Notices

| Function | Description |
|---|---|
| `getAllNotices()` | All active notices (public) |
| `getNoticesAdmin()` | All notices (admin) |
| `getActiveNotices()` | Active, non-expired, pinned first |
| `getPinnedNotices()` | Pinned notices only |
| `getNoticeById(id)` | Single notice |
| `getNoticesByType(type)` | Filter by type |
| `createNotice(data)` | Create notice |
| `updateNotice(id, data)` | Update notice |
| `deleteNotice(id)` | Delete notice |
| `incrementNoticeViews(id)` | Atomic view count increment |

---

## Notifications

| Function | Description |
|---|---|
| `getUserNotifications(userId)` | All notifications for user |
| `getUnreadNotifications(userId)` | Unread only |
| `getUnreadNotificationsCount(userId)` | Unread count (for badge) |
| `createNotification(data)` | Create notification |
| `markNotificationAsRead(id)` | Mark single read |
| `markAllNotificationsAsRead(userId)` | Mark all read |
| `deleteNotification(id)` | Delete notification |

---

## Discussions

| Function | Description |
|---|---|
| `getDiscussionCategories()` | All categories |
| `createDiscussionCategory(data)` | Create category |
| `updateDiscussionCategory(id, data)` | Update category |
| `deleteDiscussionCategory(id)` | Delete category |
| `getAllDiscussionThreads(filters?)` | All threads with pagination |
| `getDiscussionThreadsByCategory(catId)` | Filter by category |
| `getDiscussionThreadById(id)` | Single thread with meta |
| `createDiscussionThread(data)` | Create thread |
| `updateDiscussionThread(id, data)` | Edit thread |
| `pinDiscussionThread(id, pinned)` | Pin/unpin |
| `lockDiscussionThread(id, locked)` | Lock/unlock |
| `markThreadSolved(id)` | Mark solved |
| `incrementThreadViews(id)` | Atomic view count |
| `deleteDiscussionThread(id)` | Delete thread |
| `getThreadReplies(threadId)` | All replies for thread |
| `createDiscussionReply(data)` | Add reply |
| `updateDiscussionReply(id, data)` | Edit reply |
| `markReplyAsSolution(id)` | Mark as accepted solution |
| `deleteDiscussionReply(id)` | Delete reply |
| `voteOnThread(threadId, userId, type)` | Vote up/down on thread |
| `voteOnReply(replyId, userId, type)` | Vote on reply |
| `removeVote(targetId, userId, targetType)` | Remove a vote |
| `getUserVotes(userId)` | All votes cast by user |

---

## Certificates

| Function | Description |
|---|---|
| `getUserCertificates(userId)` | All certificates for member |
| `getCertificateByNumber(number)` | Lookup by unique cert number |
| `getEventCertificates(eventId)` | All certs for an event |
| `issueCertificate(data)` | Issue single certificate |
| `verifyCertificate(number)` | Public verification by cert number |
| `deleteCertificate(id)` | Delete certificate |
| `bulkIssueCertificates(eventId, userIds)` | Issue certs to multiple users |

---

## Committee

| Function | Description |
|---|---|
| `getCommitteePositions()` | All positions |
| `getPositionsByCategory(category)` | Filter positions |
| `getCurrentCommittee()` | Current year's committee |
| `getAllCommitteeMembers()` | All committee records |
| `createCommitteePosition(data)` | Add position |
| `updateCommitteePosition(id, data)` | Edit position |
| `deleteCommitteePosition(id)` | Remove position |
| `addCommitteeMember(data)` | Add member to position |
| `updateCommitteeMember(id, data)` | Update assignment |
| `removeCommitteeMember(id)` | Remove from committee |

---

## Mentorships

| Function | Description |
|---|---|
| `getAllMentorships()` | All mentorships |
| `getActiveMentorships()` | Active only |
| `getMentorshipsByMentor(mentorId)` | Mentorships for a mentor |
| `getMentorshipsByMentee(menteeId)` | Mentorships for a mentee |
| `createMentorship(data)` | Create mentorship |
| `updateMentorship(id, data)` | Update mentorship |
| `deleteMentorship(id)` | Delete mentorship |
| `getMentorshipSessions(mentorshipId)` | Sessions for a mentorship |
| `createMentorshipSession(data)` | Log session |
| `updateMentorshipSession(id, data)` | Update session notes |
| `deleteMentorshipSession(id)` | Delete session |

---

## Weekly Tasks & Submissions

| Function | Description |
|---|---|
| `getAllWeeklyTasks()` | All tasks |
| `getActiveWeeklyTasks()` | Current tasks |
| `getWeeklyTaskById(id)` | Single task |
| `createWeeklyTask(data)` | Create task |
| `updateWeeklyTask(id, data)` | Update task |
| `deleteWeeklyTask(id)` | Delete task |
| `getTaskSubmissions(taskId)` | All submissions for task |
| `getUserTaskSubmissions(userId)` | All submissions by user |
| `getUserTaskSubmission(taskId, userId)` | Single submission |
| `createTaskSubmission(data)` | Submit task |
| `updateTaskSubmission(id, data)` | Update submission |
| `reviewTaskSubmission(id, result, feedback)` | Accept or reject |
| `deleteTaskSubmission(id)` | Delete submission |
| `bulkUpdateSubmissionStatus(ids, status)` | Bulk status change |

---

## Resources

| Function | Description |
|---|---|
| `getAllResources()` | All resources |
| `getResourcesAdmin()` | All resources (admin view) |
| `getResourcesByCategory(category)` | Filter by category |
| `getResourcesByDifficulty(level)` | Filter by difficulty |
| `getFeaturedResources()` | Featured only |
| `getFreeResources()` | Free resources only |
| `createResource(data)` | Create resource |
| `updateResource(id, data)` | Update resource |
| `deleteResource(id)` | Delete resource |
| `upvoteResource(id, userId)` | Toggle upvote |
| `searchResources(query)` | Text search |

---

## Roadmaps

| Function | Description |
|---|---|
| `getAllRoadmaps()` | All roadmaps |
| `getPublishedRoadmaps()` | Published only |
| `getRoadmapBySlug(slug)` | Single roadmap by slug |
| `getRoadmapsByCategory(category)` | Filter by category |
| `getFeaturedRoadmapsByCategory()` | Featured per category |
| `createRoadmap(data)` | Create roadmap |
| `updateRoadmap(id, data)` | Update roadmap |
| `deleteRoadmap(id)` | Delete roadmap |
| `incrementRoadmapViews(id)` | Atomic view count |

---

## Gallery

| Function | Description |
|---|---|
| `getAllGalleryItems()` | All gallery items |
| `getGalleryAdmin()` | Gallery with admin metadata |
| `getFeaturedGalleryItems()` | Featured items |
| `getGalleryItemsByEvent(eventId)` | Items for event |
| `getGalleryItemsByCategory(category)` | Filter by category |
| `addGalleryItem(data)` | Add item |
| `updateGalleryItem(id, data)` | Update item |
| `deleteGalleryItem(id)` | Delete item |

---

## Join Requests

| Function | Description |
|---|---|
| `getAllJoinRequests()` | All requests |
| `getPendingJoinRequests()` | Pending only |
| `getJoinRequestById(id)` | Single request |
| `getJoinRequestByEmail(email)` | Request by email |
| `createJoinRequest(data)` | Submit application |
| `approveJoinRequest(id, reviewedBy)` | Approve |
| `rejectJoinRequest(id, reviewedBy, reason)` | Reject with reason |

---

## Contact Submissions

| Function | Description |
|---|---|
| `getAllContactSubmissions()` | All submissions |
| `getNewContactSubmissions()` | Unprocessed only |
| `getContactSubmissionById(id)` | Single submission |
| `createContactSubmission(data)` | Create from contact form |
| `updateContactSubmissionStatus(id, status)` | Update status |

---

## Budget

| Function | Description |
|---|---|
| `getAllBudgetEntries()` | All entries |
| `getBudgetEntriesByEvent(eventId)` | Entries for an event |
| `getBudgetEntriesByType(type)` | income or expense |
| `getBudgetSummary(eventId?)` | Totals (income, expense, net) |
| `createBudgetEntry(data)` | Add entry |
| `approveBudgetEntry(id, approvedBy)` | Advisor approval |
| `deleteBudgetEntry(id)` | Delete entry |

---

## Settings

| Function | Description |
|---|---|
| `getAllSettings()` | All site settings |
| `getSettingsByCategory(category)` | Filter by category |
| `getSetting(key)` | Single setting by key |
| `upsertSetting(key, value, category)` | Create or update |
| `deleteSetting(key)` | Delete setting |

---

## Analytics & Dashboard

| Function | Description |
|---|---|
| `getPlatformStatistics()` | Aggregate platform-wide stats |
| `getDashboardMetrics()` | Admin dashboard KPIs |
| `getLeaderboard(limit?)` | Top members by points |

---

## Search

| Function | Description |
|---|---|
| `searchUsers(query)` | Full-text on name/email |
| `searchBlogPosts(query)` | Full-text on title/content |
| `searchResources(query)` | Full-text on title/description |

---

## Activity Logs

| Function | Description |
|---|---|
| `getActivityLogs(filters?)` | All logs, optional filters |
| `getUserActivityLogs(userId)` | Logs for specific user |
| `getActivityLogsByAction(action)` | Filter by action type |
| `createActivityLog(userId, action, meta)` | Write a log entry |
