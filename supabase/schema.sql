create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  role text not null default 'user',
  created_at timestamptz not null default now(),
  constraint profiles_role_check check (role in ('user', 'admin'))
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  dob date,
  nationality text,
  city text,
  highest_qualification text,
  year_completed text,
  institution text,
  grade text,
  english_test text,
  english_score text,
  destination text,
  intake text,
  course_type text,
  field_of_study text,
  budget_range text,
  wants_scholarship boolean not null default false,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  constraint applications_status_check check (status in ('pending', 'reviewing', 'accepted', 'rejected'))
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date timestamptz not null,
  location text,
  description text,
  image_url text,
  register_url text,
  category text,
  is_online boolean not null default false,
  is_past boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  user_email text not null,
  full_name text not null,
  phone text,
  created_at timestamptz not null default now()
);

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users (id) on delete cascade,
  author_name text not null,
  author_role text not null default 'user',
  title text not null,
  body text not null,
  category text not null default 'general',
  is_pinned boolean not null default false,
  is_closed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_posts_author_role_check check (author_role in ('user', 'admin')),
  constraint community_posts_category_check check (category in ('general', 'admissions', 'visa', 'scholarship', 'destination', 'accommodation'))
);

create table if not exists public.community_replies (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  author_name text not null,
  author_role text not null default 'user',
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_replies_author_role_check check (author_role in ('user', 'admin'))
);

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  content text,
  cover_image_url text,
  author_name text,
  category text,
  published_at timestamptz,
  is_published boolean not null default false,
  view_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  author_name text not null,
  author_title text,
  author_photo_url text,
  rating integer not null default 5,
  review_text text not null,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  constraint testimonials_rating_check check (rating between 1 and 5)
);

create table if not exists public.analytics_sessions (
  session_id text primary key,
  user_id uuid references auth.users (id) on delete set null,
  email text,
  country_code text,
  country_name text,
  device_type text not null default 'desktop',
  current_path text not null default '/',
  current_title text,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now()
);

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  session_id text not null references public.analytics_sessions (session_id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  path text not null,
  page_title text,
  referrer text,
  country_code text,
  country_name text,
  device_type text not null default 'desktop',
  event_type text not null default 'page_view',
  created_at timestamptz not null default now()
);

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null,
  bio text,
  photo_url text,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  subject text,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.scholarships (
  id uuid primary key default gen_random_uuid(),
  university text not null,
  name text not null,
  amount text,
  deadline date,
  eligibility text,
  apply_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.homepage_content (
  id uuid primary key default gen_random_uuid(),
  section_key text not null unique,
  heading text,
  subheading text,
  badge_text text,
  primary_btn_text text,
  primary_btn_url text,
  secondary_btn_text text,
  secondary_btn_url text,
  enabled boolean not null default true,
  order_index integer not null default 0
);

create table if not exists public.page_sections (
  id uuid primary key default gen_random_uuid(),
  page_key text not null,
  section_key text not null,
  label text not null,
  heading text,
  subheading text,
  body_text text,
  badge_text text,
  primary_btn_text text,
  primary_btn_url text,
  secondary_btn_text text,
  secondary_btn_url text,
  media_url text,
  media_secondary_url text,
  enabled boolean not null default true,
  order_index integer not null default 0,
  items_json jsonb not null default '[]'::jsonb,
  settings_json jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint page_sections_page_key_section_key_key unique (page_key, section_key)
);

create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value text,
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_role on public.profiles (role);
create index if not exists idx_analytics_sessions_last_seen on public.analytics_sessions (last_seen desc);
create index if not exists idx_analytics_sessions_user_id on public.analytics_sessions (user_id);
create index if not exists idx_analytics_sessions_country on public.analytics_sessions (country_code, country_name);
create index if not exists idx_analytics_events_created_at on public.analytics_events (created_at desc);
create index if not exists idx_analytics_events_path on public.analytics_events (path);
create index if not exists idx_analytics_events_session_id on public.analytics_events (session_id);
create index if not exists idx_applications_email on public.applications (email);
create index if not exists idx_applications_status on public.applications (status);
create index if not exists idx_events_date on public.events (date);
create index if not exists idx_events_category on public.events (category);
create index if not exists idx_event_registrations_event_id on public.event_registrations (event_id);
create index if not exists idx_event_registrations_user_email on public.event_registrations (user_email);
create index if not exists idx_community_posts_created_at on public.community_posts (created_at desc);
create index if not exists idx_community_posts_category on public.community_posts (category);
create index if not exists idx_community_posts_pinned on public.community_posts (is_pinned, created_at desc);
create index if not exists idx_community_replies_post_id on public.community_replies (post_id, created_at asc);
create index if not exists idx_blog_posts_slug on public.blog_posts (slug);
create index if not exists idx_blog_posts_published on public.blog_posts (is_published, published_at desc);
create index if not exists idx_testimonials_published on public.testimonials (is_published);
create index if not exists idx_team_members_order on public.team_members (order_index);
create index if not exists idx_contact_messages_read on public.contact_messages (is_read);
create index if not exists idx_homepage_content_section_key on public.homepage_content (section_key);
create index if not exists idx_page_sections_page_key on public.page_sections (page_key);
create index if not exists idx_page_sections_page_key_order on public.page_sections (page_key, order_index);

alter table public.profiles enable row level security;
alter table public.applications enable row level security;
alter table public.events enable row level security;
alter table public.event_registrations enable row level security;
alter table public.community_posts enable row level security;
alter table public.community_replies enable row level security;
alter table public.blog_posts enable row level security;
alter table public.testimonials enable row level security;
alter table public.team_members enable row level security;
alter table public.contact_messages enable row level security;
alter table public.scholarships enable row level security;
alter table public.homepage_content enable row level security;
alter table public.page_sections enable row level security;
alter table public.site_settings enable row level security;
alter table public.analytics_sessions enable row level security;
alter table public.analytics_events enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles
for select
using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_insert_own_or_admin" on public.profiles;
create policy "profiles_insert_own_or_admin"
on public.profiles
for insert
with check (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
on public.profiles
for update
using (auth.uid() = id or public.is_admin())
with check (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_delete_admin_only" on public.profiles;
create policy "profiles_delete_admin_only"
on public.profiles
for delete
using (public.is_admin());

drop policy if exists "analytics_sessions_admin_select" on public.analytics_sessions;
create policy "analytics_sessions_admin_select"
on public.analytics_sessions
for select
using (public.is_admin());

drop policy if exists "analytics_sessions_public_insert" on public.analytics_sessions;
create policy "analytics_sessions_public_insert"
on public.analytics_sessions
for insert
with check (true);

drop policy if exists "analytics_sessions_public_update" on public.analytics_sessions;
create policy "analytics_sessions_public_update"
on public.analytics_sessions
for update
using (true)
with check (true);

drop policy if exists "analytics_sessions_admin_delete" on public.analytics_sessions;
create policy "analytics_sessions_admin_delete"
on public.analytics_sessions
for delete
using (public.is_admin());

drop policy if exists "analytics_events_admin_select" on public.analytics_events;
create policy "analytics_events_admin_select"
on public.analytics_events
for select
using (public.is_admin());

drop policy if exists "analytics_events_public_insert" on public.analytics_events;
create policy "analytics_events_public_insert"
on public.analytics_events
for insert
with check (true);

drop policy if exists "analytics_events_admin_delete" on public.analytics_events;
create policy "analytics_events_admin_delete"
on public.analytics_events
for delete
using (public.is_admin());

drop policy if exists "applications_insert_authenticated" on public.applications;
create policy "applications_insert_authenticated"
on public.applications
for insert
to authenticated
with check (true);

drop policy if exists "applications_select_own_or_admin" on public.applications;
create policy "applications_select_own_or_admin"
on public.applications
for select
using (
  public.is_admin()
  or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

drop policy if exists "applications_admin_all" on public.applications;
create policy "applications_admin_all"
on public.applications
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "events_public_read" on public.events;
create policy "events_public_read"
on public.events
for select
using (true);

drop policy if exists "events_admin_all" on public.events;
create policy "events_admin_all"
on public.events
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "event_registrations_insert_authenticated" on public.event_registrations;
create policy "event_registrations_insert_authenticated"
on public.event_registrations
for insert
to authenticated
with check (true);

drop policy if exists "event_registrations_select_own_or_admin" on public.event_registrations;
create policy "event_registrations_select_own_or_admin"
on public.event_registrations
for select
using (
  public.is_admin()
  or lower(user_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

drop policy if exists "event_registrations_admin_all" on public.event_registrations;
create policy "event_registrations_admin_all"
on public.event_registrations
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "community_posts_public_read" on public.community_posts;
create policy "community_posts_public_read"
on public.community_posts
for select
using (true);

drop policy if exists "community_posts_insert_authenticated" on public.community_posts;
create policy "community_posts_insert_authenticated"
on public.community_posts
for insert
to authenticated
with check (
  author_id = auth.uid()
  and (
    author_role = 'user'
    or public.is_admin()
  )
);

drop policy if exists "community_posts_update_own_or_admin" on public.community_posts;
create policy "community_posts_update_own_or_admin"
on public.community_posts
for update
using (public.is_admin() or author_id = auth.uid())
with check (
  public.is_admin()
  or (
    author_id = auth.uid()
    and author_role = 'user'
    and is_pinned = false
    and is_closed = false
  )
);

drop policy if exists "community_posts_delete_own_or_admin" on public.community_posts;
create policy "community_posts_delete_own_or_admin"
on public.community_posts
for delete
using (public.is_admin() or author_id = auth.uid());

drop policy if exists "community_replies_public_read" on public.community_replies;
create policy "community_replies_public_read"
on public.community_replies
for select
using (true);

drop policy if exists "community_replies_insert_authenticated" on public.community_replies;
create policy "community_replies_insert_authenticated"
on public.community_replies
for insert
to authenticated
with check (
  author_id = auth.uid()
  and (
    author_role = 'user'
    or public.is_admin()
  )
);

drop policy if exists "community_replies_update_own_or_admin" on public.community_replies;
create policy "community_replies_update_own_or_admin"
on public.community_replies
for update
using (public.is_admin() or author_id = auth.uid())
with check (
  public.is_admin()
  or (
    author_id = auth.uid()
    and author_role = 'user'
  )
);

drop policy if exists "community_replies_delete_own_or_admin" on public.community_replies;
create policy "community_replies_delete_own_or_admin"
on public.community_replies
for delete
using (public.is_admin() or author_id = auth.uid());

drop policy if exists "blog_posts_public_read_published" on public.blog_posts;
create policy "blog_posts_public_read_published"
on public.blog_posts
for select
using (is_published = true or public.is_admin());

drop policy if exists "blog_posts_admin_all" on public.blog_posts;
create policy "blog_posts_admin_all"
on public.blog_posts
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "testimonials_public_read_published" on public.testimonials;
create policy "testimonials_public_read_published"
on public.testimonials
for select
using (is_published = true or public.is_admin());

drop policy if exists "testimonials_admin_all" on public.testimonials;
create policy "testimonials_admin_all"
on public.testimonials
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "team_members_public_read" on public.team_members;
create policy "team_members_public_read"
on public.team_members
for select
using (true);

drop policy if exists "team_members_admin_all" on public.team_members;
create policy "team_members_admin_all"
on public.team_members
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "contact_messages_insert_authenticated" on public.contact_messages;
create policy "contact_messages_insert_authenticated"
on public.contact_messages
for insert
to authenticated
with check (true);

drop policy if exists "contact_messages_admin_all" on public.contact_messages;
create policy "contact_messages_admin_all"
on public.contact_messages
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "scholarships_public_read" on public.scholarships;
create policy "scholarships_public_read"
on public.scholarships
for select
using (true);

drop policy if exists "scholarships_admin_all" on public.scholarships;
create policy "scholarships_admin_all"
on public.scholarships
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "homepage_content_public_read_enabled" on public.homepage_content;
create policy "homepage_content_public_read_enabled"
on public.homepage_content
for select
using (enabled = true or public.is_admin());

drop policy if exists "homepage_content_admin_all" on public.homepage_content;
create policy "homepage_content_admin_all"
on public.homepage_content
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "page_sections_public_read_enabled" on public.page_sections;
create policy "page_sections_public_read_enabled"
on public.page_sections
for select
using (enabled = true or public.is_admin());

drop policy if exists "page_sections_admin_all" on public.page_sections;
create policy "page_sections_admin_all"
on public.page_sections
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "site_settings_admin_all" on public.site_settings;
create policy "site_settings_admin_all"
on public.site_settings
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "site_settings_public_read" on public.site_settings;
create policy "site_settings_public_read"
on public.site_settings
for select
using (true);

insert into storage.buckets (id, name, public)
values ('site-assets', 'site-assets', true)
on conflict (id) do nothing;

drop policy if exists "site_assets_public_read" on storage.objects;
create policy "site_assets_public_read"
on storage.objects
for select
using (bucket_id = 'site-assets');

drop policy if exists "site_assets_admin_insert" on storage.objects;
create policy "site_assets_admin_insert"
on storage.objects
for insert
with check (bucket_id = 'site-assets' and public.is_admin());

drop policy if exists "site_assets_admin_update" on storage.objects;
create policy "site_assets_admin_update"
on storage.objects
for update
using (bucket_id = 'site-assets' and public.is_admin())
with check (bucket_id = 'site-assets' and public.is_admin());

drop policy if exists "site_assets_admin_delete" on storage.objects;
create policy "site_assets_admin_delete"
on storage.objects
for delete
using (bucket_id = 'site-assets' and public.is_admin());
