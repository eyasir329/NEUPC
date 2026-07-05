# Clustering Map — Every Table → Cluster

This map is **derived from the actual foreign-key graph** of the current
database (110 tables, 179 FK edges), not from intuition. The connected-component
analysis (ignoring the universal `users` hub) produced clean bounded contexts;
each context is assigned to one project.

**Legend:** 🔗 = FK to `users` only (safe to move, denormalize `user_id`).
⚠️ = has intra-cluster FKs that must stay together in the same project.

---

## CORE — cluster (the hub — nothing here may move)

> Primary: Supabase-CORE (+ read replica) · Standby: InsForge-CORE

The identity + RBAC core. Referenced by ~100 other tables.

```
users                      ← referenced by ~100 tables (THE hub)
roles, permissions, role_permissions, user_roles   ⚠️ (RBAC cluster)
admin_profiles, advisor_profiles, mentor_profiles  🔗
member_profiles, member_statistics, member_progress ⚠️
user_stats, user_goals, user_daily_activity        🔗 (see note)
account_messages, notifications, notices           🔗
join_requests, contact_submissions                 🔗
website_settings, journey_items, roadmaps          (config/leaf)
google_calendar_connections, feed_gcal_events,
personal_events                                    🔗
external_contests                                  (leaf)
badge_definitions, user_badges                     ⚠️
```

> `user_stats` / `user_daily_activity` are duplicated conceptually with ANALYTICS.
> **Rule:** the *authoritative* per-user profile counters live on CORE; the
> *raw event stream & heavy aggregates* live on ANALYTICS. Don't split a single
> table across both — pick one home per table (listed here).

---

## LEARN — cluster (Cluster 0, 22 tables)

> Primary: Supabase-LEARN · Standby: InsForge-LEARN

Bootcamp / course / discussion context. Internally FK-coupled → moves as a unit.

```
bootcamps, bootcamp_mentors, bootcamp_help_requests, batch_history   ⚠️
courses, modules, lessons, lesson_comments, enrollments              ⚠️
weekly_tasks, task_submissions, exam_submissions                     ⚠️
mentorships, mentorship_sessions                                     ⚠️
discussion_categories, discussion_threads, discussion_replies,
discussion_votes, discussion_activity, discussion_attachments        ⚠️
user_progress, learning_activity_daily                               🔗
certificates                                                         🔗
```

**Cut safety:** only outward link is `user_id`/`created_by` → CORE. ✅ Safe.

---

## ANALYTICS — cluster (write-heavy telemetry)

> Primary: Supabase-ANALYTICS · Standby: InsForge-ANALYTICS

Includes Cluster 1's *stats/sync* members + standalone log tables.

```
activity_logs                          🔗  (append-only, high volume)
user_daily_activity  (raw stream)      🔗
user_platform_stats, user_language_stats, user_tag_stats,
user_tier_stats, user_solves           ⚠️ (problem-solving stats cluster)
rating_history, contest_history        🔗
sync_jobs, sync_checkpoints            (job bookkeeping)
api_cache, leaderboard_cache           (cache tables — DB-backed cache)
```

> **Note on the problem-solving cluster (Cluster 1):** `problems`, `submissions`,
> `solutions`, `platforms`, `tags`, etc. are **tightly** coupled (21 tables, many
> intra-FKs). Decide **one** home for the whole cluster:
>
> - If the judge/submission flow is **transactional** with user identity → keep
>   `problems`/`submissions`/`solutions` on **CORE**, and move only the derived
>   **`*_stats`** aggregates to ANALYTICS (recompute from CORE).
> - If it can tolerate eventual consistency → move the whole cluster to its own
>   project. **Recommended: keep on CORE for now**, move only aggregates. Less risk.

---

## CONTENT — cluster (loosely-coupled public content)

> Primary: Supabase-CONTENT · Standby: InsForge-CONTENT

Clusters 2, 3, 4, 6, 9, 10, 11 — all `user_id`-only coupling.

```
events, event_organizers, event_registrations,
event_registration_members, event_gallery, gallery_items   ⚠️ (events cluster)
contests, contest_participants, participation_records,
achievements, member_achievements, certificates, budget_entries ⚠️
resources, resource_categories, resource_tags, resource_tag_map,
resource_bookmarks, resource_comments, resource_completions,
resource_views                                              ⚠️ (resources cluster)
blog_posts, blog_comments                                   ⚠️
chat_conversations, chat_participants, chat_messages        ⚠️ (verify Realtime!)
todos, todo_lists, todo_sections, todo_completions,
todo_labels                                                 ⚠️ (todo cluster)
faq_categories, faq_items                                   ⚠️
committee_positions, committee_members                      ⚠️
```

**Cut safety:** all outward links are `user_id`/`created_by`. ✅ Safe.
**Exception:** `chat_*` — if it relies on Supabase Realtime, host on a Supabase
project instead of InsForge (see [`01-projects.md`](01-projects.md)).

---

## The FK cut-lines (what breaks, and how we handle it)

Every arrow that crosses a project boundary is a FK the **database can no longer
enforce**. We handle each by:

1. **Denormalize** the referenced key (store `user_id` as a plain column, no FK).
2. **Resolve** user details via the router (fetch from CORE / cache), not a JOIN.
3. **Validate** referential integrity in the **app layer** on write.

| Cut boundary | Crossing FKs (denormalized) | Resolution strategy |
|---|---|---|
| CORE ↔ LEARN | `user_id`, `created_by` | app-side join + user cache |
| CORE ↔ ANALYTICS | `user_id` | write-only, aggregates recomputed |
| CORE ↔ CONTENT | `user_id`, `created_by` | app-side join + user cache |

> **No cut crosses an `⚠️` intra-cluster FK** — every tightly-coupled cluster
> lands wholly inside one project. That is the invariant that keeps this safe.

---

## Reproduce this analysis

The clustering was computed from `supabase/cloud_backup_public_20260628-092205.sql`
by extracting FK edges and running connected-components while excluding the
`users` hub. See [`05-migration-plan.md`](05-migration-plan.md) Phase 0 for the
script, so this map can be regenerated whenever the schema changes.
