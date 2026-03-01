# Server Actions

All mutations in the app are handled by `"use server"` functions in `app/_lib/*-actions.js` files.

**Pattern every action follows:**

```js
'use server';

export async function doSomethingAction(formData) {
  // 1. Verify auth + role
  await requireRole('admin');

  // 2. Validate input
  const parsed = schema.parse(Object.fromEntries(formData));

  // 3. Sanitize if needed
  const safeContent = sanitizeRichText(parsed.content);

  // 4. Rate limit if applicable
  const { limited } = rateLimit(userId, { limit: 10, windowMs: 60_000 });
  if (limited) throw new Error('Too many requests');

  // 5. Mutate via data-service
  await createSomething(safeContent);

  // 6. Revalidate or redirect
  revalidatePath('/account/admin/something');
}
```

---

## Action Files

### `actions.js` — Auth

| Function | Description |
|---|---|
| `signInAction` | Trigger Google OAuth sign-in |
| `signOutAction` | Sign out, clear session |
| `switchRoleAction(role, path)` | Switch active role + redirect |
| `setRoleAction(role)` | Update active role in session |

---

### `blog-actions.js` — Blog CMS (Admin/Executive)

| Function | Description |
|---|---|
| `createBlogAction` | Create blog post with TipTap content |
| `updateBlogAction` | Update post fields |
| `deleteBlogAction` | Permanently delete a post |
| `updateBlogStatusAction` | Toggle draft ↔ published |
| `toggleBlogFeaturedAction` | Pin/unpin from homepage |
| `uploadBlogImageAction` | Upload thumbnail to Supabase Storage |
| `toggleCommentApprovalAction` | Approve or unapprove a comment |
| `deleteCommentAction` | Delete a blog comment |

---

### `event-actions.js` — Event Admin (Admin)

| Function | Description |
|---|---|
| `createEventAction` | Create a new event |
| `updateEventAction` | Edit event details |
| `deleteEventAction` | Delete event |
| `updateEventStatusAction` | Set status: draft / published / archived |
| `toggleEventFeaturedAction` | Feature on homepage |

---

### `executive-actions.js` — Executive Operations

| Domain | Functions |
|---|---|
| Events | `execCreateEventAction`, `execUpdateEventAction`, `execDeleteEventAction`, `execUpdateRegistrationAction`, `execMarkAttendedAction` |
| Contests | `execCreateContestAction`, `execUpdateContestAction`, `execDeleteContestAction` |
| Blogs | `execCreateBlogAction`, `execUpdateBlogAction`, `execDeleteBlogAction`, `execUploadBlogImageAction` |
| Gallery | `execAddGalleryAction`, `execBulkAddGalleryAction`, `execUpdateGalleryAction`, `execDeleteGalleryAction` |
| Notices | `execCreateNoticeAction`, `execUpdateNoticeAction`, `execDeleteNoticeAction` |
| Join Requests | `execApproveJoinRequestAction`, `execRejectJoinRequestAction` |
| Certificates | `execCreateCertificateAction`, `execBulkCreateCertificatesAction` |
| Profile | `execUpdateProfileAction` |

---

### `user-actions.js` — User Management (Admin)

| Function | Description |
|---|---|
| `suspendUserAction` | Suspend account (no login) |
| `activateUserAction` | Re-activate suspended account |
| `banUserAction` | Ban user permanently |
| `lockUserAction` | Lock account temporarily |
| `deleteUserAction` | Delete user record |
| `changeUserRoleAction` | Assign new primary role |
| `updateUserAction` | Update user fields |
| `approveMemberAction` | Approve pending member |
| `approveMembershipAction` | Approve membership application |
| `rejectGuestAction` | Reject guest application |
| `rejectMemberAction` | Reject member profile |
| `submitMembershipApplicationAction` | Guest submits join request |

---

### `application-actions.js` — Membership Applications (Admin)

| Function | Description |
|---|---|
| `approveApplicationAction` | Approve with optional note |
| `rejectApplicationAction` | Reject with reason |
| `resetApplicationAction` | Reset to pending |
| `deleteApplicationAction` | Delete record |
| `bulkApproveApplicationsAction` | Approve multiple |
| `bulkRejectApplicationsAction` | Reject multiple |
| `bulkDeleteApplicationsAction` | Delete multiple |

---

### `member-events-actions.js` — Event Registration (Member)

| Function | Description |
|---|---|
| `registerForEventAction` | Register for an event |
| `cancelEventRegistrationAction` | Cancel registration |

---

### `member-contests-actions.js` — Contests (Member)

| Function | Description |
|---|---|
| `joinContestAction` | Join a contest |
| `leaveContestAction` | Leave a contest |

---

### `member-discussions-actions.js` — Forum (Member)

| Function | Description |
|---|---|
| `createThreadAction` | Create a discussion thread |
| `deleteThreadAction` | Delete own thread |
| `markThreadSolvedAction` | Mark thread as solved |
| `createReplyAction` | Add a reply |
| `deleteReplyAction` | Delete own reply |
| `markSolutionAction` | Mark reply as accepted solution |
| `voteThreadAction` | Upvote/downvote a thread |
| `voteReplyAction` | Upvote/downvote a reply |
| `fetchThreadDetailAction` | Fetch thread + replies |

---

### `member-tasks-actions.js` — Task Submissions (Member)

| Function | Description |
|---|---|
| `submitTaskAction` | Submit a weekly task (URL, code, notes) |

---

### `member-profile-actions.js` — Profile (Member)

| Function | Description |
|---|---|
| `updateMemberInfoAction` | Update basic user info |
| `updateMemberProfileAction` | Update extended member profile |

---

### `member-resources-actions.js` — Resources (Member)

| Function | Description |
|---|---|
| `upvoteResourceAction` | Toggle upvote on a resource |

---

### `mentor-actions.js` — Mentorship Management (Mentor)

| Function | Description |
|---|---|
| `createWeeklyTaskAction` | Assign new weekly task |
| `updateWeeklyTaskAction` | Edit task details |
| `deleteWeeklyTaskAction` | Delete task |
| `reviewTaskSubmissionAction` | Accept or reject a submission with feedback |
| `createResourceAction` | Create a shared resource |
| `deleteResourceAction` | Delete a resource |
| `createMentorshipSessionAction` | Log a mentorship session |
| `updateSessionNotesAction` | Update session notes/outcome |
| `deleteSessionAction` | Delete session record |
| `saveMentorNotesAction` | Save private notes per mentee |
| `updateMentorshipStatusAction` | Change status: active/completed/paused |

---

### `advisor-actions.js` — Advisor Approvals

| Function | Description |
|---|---|
| `approveJoinRequestAction` | Approve a join request |
| `rejectJoinRequestAction` | Reject a join request |
| `approveMemberProfileAction` | Approve member profile update |
| `approveBudgetEntryAction` | Approve a budget entry |

---

### `achievement-actions.js` — Achievements (Admin)

| Function | Description |
|---|---|
| `createAchievementAction` | Create achievement record |
| `updateAchievementAction` | Edit achievement |
| `deleteAchievementAction` | Delete achievement |
| `addAchievementMemberAction` | Link a member to an achievement |
| `removeAchievementMemberAction` | Unlink member |

---

### `gallery-actions.js` — Gallery (Admin)

| Function | Description |
|---|---|
| `addGalleryItemAction` | Add single gallery item |
| `bulkAddGalleryItemsAction` | Add multiple items at once |
| `updateGalleryItemAction` | Edit item details |
| `deleteGalleryItemAction` | Delete item |
| `toggleGalleryFeaturedAction` | Feature/unfeature item |

---

### `notice-actions.js` — Notices (Executive/Admin)

| Function | Description |
|---|---|
| `createNoticeAction` | Post a notice |
| `updateNoticeAction` | Edit notice |
| `deleteNoticeAction` | Delete notice |
| `toggleNoticePinAction` | Pin/unpin notice |

---

### `contact-actions.js` — Contact Submissions (Admin)

| Function | Description |
|---|---|
| `submitContactFormAction` | Public: submit contact form |
| `updateContactStatusAction` | Update submission status |
| `markContactReadAction` | Mark as read |
| `deleteContactSubmissionAction` | Delete a submission |
| `bulkUpdateContactStatusAction` | Bulk status update |
| `bulkDeleteContactSubmissionsAction` | Bulk delete |

---

### `notification-actions.js` — Notifications

| Function | Description |
|---|---|
| `getNotificationsAction` | Fetch paginated notifications |
| `markAsReadAction` | Mark single notification read |
| `markAllAsReadAction` | Mark all read |
| `deleteNotificationAction` | Delete a notification |

---

### `role-actions.js` — Role Management (Admin)

| Function | Description |
|---|---|
| `updateRoleDescriptionAction` | Edit role description |
| `toggleRolePermissionAction` | Enable/disable permission for a role |
| `assignRoleToUserAction` | Add role to user |
| `removeRoleFromUserAction` | Remove role from user |

---

### `resource-actions.js` — Resource Library (Admin)

| Function | Description |
|---|---|
| `createResourceAction` | Create a resource |
| `updateResourceAction` | Edit resource |
| `deleteResourceAction` | Delete resource |
| `toggleResourceFeaturedAction` | Feature/unfeature |
| `toggleResourceFreeAction` | Toggle free/paid flag |

---

### `settings-actions.js` — Site Settings (Admin)

| Function | Description |
|---|---|
| `saveSettingsAction` | Save one or more settings |
| `resetCategoryAction` | Reset a settings category to defaults |

---

### `export-actions.js` — Data Export (Admin)

| Function | Exports |
|---|---|
| `exportUsersAction` | User list |
| `exportJoinRequestsAction` | Join requests |
| `exportBlogsAction` | Blog posts |
| `exportEventsAction` | Events |
| `exportAchievementsAction` | Achievements |
| `exportGalleryAction` | Gallery items |
| `exportContactsAction` | Contact submissions |
| `exportNoticesAction` | Notices |
| `exportActivityLogsAction` | Activity logs |
| `exportResourcesAction` | Resources |

---

### `chat-actions.js` — Chat System

| Function | Description |
|---|---|
| `syncGroupMembershipsAction` | Sync user group memberships |
| `getConversationsAction` | List all conversations for current user |
| `getUnreadCountAction` | Get total unread message count |
| `createDirectConversationAction` | Start a 1:1 conversation |
| `createSupportConversationAction` | Open a support ticket |
| `claimSupportConversationAction` | Claim a support ticket (executive/admin) |
| `getSupportInboxAction` | Get unclaimed support tickets |
| `getMessagesAction(id, cursor, limit)` | Paginated message history |
| `sendMessageAction` | Send a text message |
| `sendFileMessageAction` | Send a file attachment |
| `editMessageAction` | Edit own message |
| `deleteMessageAction` | Delete own message |
| `closeConversationAction` | Close and archive a conversation |
| `markConversationReadAction` | Mark conversation as read |
| `getChatableUsersAction(search)` | Search users to start a chat with |

---

### `guest-actions.js`

| Function | Description |
|---|---|
| `updateGuestInfoAction` | Update guest profile info |

---

### `public-actions.js` — SSR Caching

No `"use server"` directive. Wraps `data-service.js` read functions in `unstable_cache` for ISR-style caching on public pages. Used by `Header.js`, `Footer.js`, and homepage sections.
