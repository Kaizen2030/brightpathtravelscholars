alter table if exists public.job_applications
  add column if not exists notes text;
