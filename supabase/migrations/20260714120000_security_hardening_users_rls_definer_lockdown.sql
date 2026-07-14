-- Security hardening (from full-app audit, 2026-07-14)
--
-- CRITICAL: public.users had two always-true RLS policies:
--   * user_view_1  — role `public`, SELECT true  → anyone with the anon key
--     (which ships in the browser bundle as NEXT_PUBLIC_SUPABASE_ANON_KEY)
--     could dump every column of users, including reset_token,
--     verification_token, extension_token, email, phone. Account-takeover risk.
--   * user_crud_1  — role `authenticated`, ALL true → any Supabase JWT could
--     modify/delete any user row.
-- All application access to `users` goes through the service-role client
-- (verified in app/_lib; the last anon-client reads were switched to
-- supabaseAdmin in the same commit), so these policies can be dropped outright.

drop policy if exists "user_crud_1" on public.users;
drop policy if exists "user_view_1" on public.users;

-- Lock down SECURITY DEFINER functions: only service_role may execute.
-- (App calls claim_jobs, claim_replication_outbox, record_learning_activity_atomic,
-- etc. exclusively via supabaseAdmin — verified by grep.)
do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prosecdef
  loop
    execute format('revoke execute on function %s from anon, authenticated, public', f.sig);
  end loop;
end $$;

-- Pin search_path on all public functions missing one (advisor: function_search_path_mutable, 41 functions).
do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prokind = 'f'
      and (p.proconfig is null or not exists (
        select 1 from unnest(p.proconfig) c where c like 'search_path=%'))
  loop
    execute format('alter function %s set search_path = public', f.sig);
  end loop;
end $$;

-- Views flagged SECURITY DEFINER (advisor ERROR level) -> invoker rights.
-- Only the service-role client reads these in app code.
alter view public.bootcamp_curriculum set (security_invoker = true);
alter view public.enrollment_stats set (security_invoker = true);
alter view public.v_leaderboard set (security_invoker = true);
alter view public.v_user_activity_summary set (security_invoker = true);
alter view public.v_user_solved_problems set (security_invoker = true);
alter view public.event_statistics set (security_invoker = true);

-- Duplicate indexes (advisor: duplicate_index) — keep the uq_* constraint-backed ones.
drop index if exists public.idx_contest_history_user_platform_contest;
drop index if exists public.idx_rating_history_user_platform_date;
-- uq_user_platform_stats_user_platform is constraint-backed and a duplicate of
-- uq_user_platform_stats (both UNIQUE (user_id, platform_id)); drop the constraint.
alter table public.user_platform_stats drop constraint if exists uq_user_platform_stats_user_platform;
