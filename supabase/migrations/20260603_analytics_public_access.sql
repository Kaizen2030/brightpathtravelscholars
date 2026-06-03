-- Keep analytics writes public and admin reads available even when browser auth is stale.

alter table public.analytics_sessions enable row level security;
alter table public.analytics_events enable row level security;

grant select on public.analytics_sessions to authenticated;
grant insert, update on public.analytics_sessions to anon;
grant insert, update on public.analytics_sessions to authenticated;

grant select on public.analytics_events to authenticated;
grant insert on public.analytics_events to anon;
grant insert on public.analytics_events to authenticated;

drop policy if exists "analytics_sessions_admin_select" on public.analytics_sessions;
create policy "analytics_sessions_admin_select"
on public.analytics_sessions
for select
using (public.is_admin());

drop policy if exists "analytics_sessions_public_insert" on public.analytics_sessions;
create policy "analytics_sessions_public_insert"
on public.analytics_sessions
for insert
to anon
with check (true);

drop policy if exists "analytics_sessions_public_update" on public.analytics_sessions;
create policy "analytics_sessions_public_update"
on public.analytics_sessions
for update
to anon
using (true)
with check (true);

drop policy if exists "analytics_events_admin_select" on public.analytics_events;
create policy "analytics_events_admin_select"
on public.analytics_events
for select
using (public.is_admin());

drop policy if exists "analytics_events_public_insert" on public.analytics_events;
create policy "analytics_events_public_insert"
on public.analytics_events
for insert
to anon
with check (true);
