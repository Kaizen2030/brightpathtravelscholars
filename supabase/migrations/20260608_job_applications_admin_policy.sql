alter table if exists public.job_applications enable row level security;

drop policy if exists "job_applications_admin_all" on public.job_applications;
create policy "job_applications_admin_all"
on public.job_applications
for all
using (public.is_admin())
with check (public.is_admin());
