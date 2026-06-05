-- Shared internal applicant reports for the IELTS builder.

create table if not exists public.ielts_reports (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  candidate_id text,
  report_number text,
  passport_number text,
  nationality text,
  date_of_birth date,
  test_type text not null default 'Academic',
  test_date date,
  issue_date date not null default current_date,
  centre_name text not null default 'Brightpath Travel Scholars',
  centre_code text,
  location text,
  listening numeric(2,1) not null default 0,
  reading numeric(2,1) not null default 0,
  writing numeric(2,1) not null default 0,
  speaking numeric(2,1) not null default 0,
  overall numeric(2,1) not null default 0,
  verifier_name text,
  verifier_title text,
  notes text,
  template_version text not null default '2026',
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ielts_reports_test_type_check check (test_type in ('Academic', 'General Training')),
  constraint ielts_reports_band_check check (
    listening between 0 and 9
    and reading between 0 and 9
    and writing between 0 and 9
    and speaking between 0 and 9
    and overall between 0 and 9
  )
);

create index if not exists idx_ielts_reports_updated_at on public.ielts_reports (updated_at desc);
create index if not exists idx_ielts_reports_full_name on public.ielts_reports (full_name);
create index if not exists idx_ielts_reports_candidate_id on public.ielts_reports (candidate_id);
create index if not exists idx_ielts_reports_report_number on public.ielts_reports (report_number);

alter table public.ielts_reports enable row level security;

grant select, insert, update, delete on public.ielts_reports to authenticated;

drop policy if exists "ielts_reports_admin_all" on public.ielts_reports;
create policy "ielts_reports_admin_all"
on public.ielts_reports
for all
using (public.is_admin())
with check (public.is_admin());
