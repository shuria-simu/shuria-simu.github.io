-- =========================================================
-- SHURIA SIMU PORTFOLIO
-- Supabase Database + RLS + Storage
-- GitHub Pages + Supabase Only
-- =========================================================

create extension if not exists pgcrypto;

-- =========================================================
-- TABLES
-- =========================================================

create table if not exists public.profiles(
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  role text not null default 'viewer'
    check(role in('admin','editor','viewer')),
  created_at timestamptz default now()
);

create table if not exists public.settings(
  id int primary key default 1 check(id=1),
  hero_text text,
  about_text text,
  profile_image text,
  resume_url text,
  email text,
  speciality text default 'Branding & Social',
  location text default 'Dhaka, Bangladesh',
  languages text default 'Bangla · English',
  status text default 'Available for Projects',
  client_count int default 18,
  years_creating int default 4
);

create table if not exists public.projects(
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text,
  year int,
  thumbnail_url text,
  description text,
  featured boolean default false,
  published boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

create table if not exists public.services(
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  published boolean default true,
  sort_order int default 0
);

create table if not exists public.experience(
  id uuid primary key default gen_random_uuid(),
  position text not null,
  company text,
  location text,
  period text,
  sort_order int default 0
);

create table if not exists public.education(
  id uuid primary key default gen_random_uuid(),
  institute text not null,
  degree text,
  subject text,
  period text,
  sort_order int default 0
);

create table if not exists public.awards(
  id uuid primary key default gen_random_uuid(),
  title text not null,
  organization text,
  year int,
  sort_order int default 0
);

create table if not exists public.testimonials(
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  company text,
  review text,
  rating int default 5
    check(rating between 1 and 5),
  published boolean default true,
  sort_order int default 0
);

create table if not exists public.messages(
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text,
  message text not null,
  created_at timestamptz default now()
);

create table if not exists public.social_links(
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  url text not null,
  sort_order int default 0
);

-- =========================================================
-- ADMIN / EDITOR CHECK FUNCTION
-- =========================================================

create or replace function public.is_manager()
returns boolean
language sql
stable
security definer
set search_path=public
as $$
  select exists(
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('admin','editor')
  );
$$;

-- =========================================================
-- ENABLE RLS
-- =========================================================

alter table public.profiles enable row level security;
alter table public.settings enable row level security;
alter table public.projects enable row level security;
alter table public.services enable row level security;
alter table public.experience enable row level security;
alter table public.education enable row level security;
alter table public.awards enable row level security;
alter table public.testimonials enable row level security;
alter table public.messages enable row level security;
alter table public.social_links enable row level security;

-- =========================================================
-- DROP OLD POLICIES FIRST
-- Makes this file safer to re-run
-- =========================================================

drop policy if exists "read settings" on public.settings;
drop policy if exists "read projects" on public.projects;
drop policy if exists "read services" on public.services;
drop policy if exists "read experience" on public.experience;
drop policy if exists "read education" on public.education;
drop policy if exists "read awards" on public.awards;
drop policy if exists "read testimonials" on public.testimonials;
drop policy if exists "read social" on public.social_links;

drop policy if exists "send message" on public.messages;

drop policy if exists "manage settings" on public.settings;
drop policy if exists "manage projects" on public.projects;
drop policy if exists "manage services" on public.services;
drop policy if exists "manage experience" on public.experience;
drop policy if exists "manage education" on public.education;
drop policy if exists "manage awards" on public.awards;
drop policy if exists "manage testimonials" on public.testimonials;
drop policy if exists "manage messages select" on public.messages;
drop policy if exists "manage messages delete" on public.messages;
drop policy if exists "manage social" on public.social_links;
drop policy if exists "read own profile" on public.profiles;
drop policy if exists "manage profiles" on public.profiles;

-- =========================================================
-- PUBLIC READ POLICIES
-- =========================================================

create policy "read settings"
on public.settings
for select
using (true);

create policy "read projects"
on public.projects
for select
using (
  published = true
  or public.is_manager()
);

create policy "read services"
on public.services
for select
using (
  published = true
  or public.is_manager()
);

create policy "read experience"
on public.experience
for select
using (true);

create policy "read education"
on public.education
for select
using (true);

create policy "read awards"
on public.awards
for select
using (true);

create policy "read testimonials"
on public.testimonials
for select
using (
  published = true
  or public.is_manager()
);

create policy "read social"
on public.social_links
for select
using (true);

-- =========================================================
-- CONTACT FORM POLICY
-- Anyone can send message
-- =========================================================

create policy "send message"
on public.messages
for insert
with check (true);

-- =========================================================
-- ADMIN / EDITOR CRUD
-- =========================================================

create policy "manage settings"
on public.settings
for all
using (public.is_manager())
with check (public.is_manager());

create policy "manage projects"
on public.projects
for all
using (public.is_manager())
with check (public.is_manager());

create policy "manage services"
on public.services
for all
using (public.is_manager())
with check (public.is_manager());

create policy "manage experience"
on public.experience
for all
using (public.is_manager())
with check (public.is_manager());

create policy "manage education"
on public.education
for all
using (public.is_manager())
with check (public.is_manager());

create policy "manage awards"
on public.awards
for all
using (public.is_manager())
with check (public.is_manager());

create policy "manage testimonials"
on public.testimonials
for all
using (public.is_manager())
with check (public.is_manager());

create policy "manage messages select"
on public.messages
for select
using (public.is_manager());

create policy "manage messages delete"
on public.messages
for delete
using (public.is_manager());

create policy "manage social"
on public.social_links
for all
using (public.is_manager())
with check (public.is_manager());

create policy "read own profile"
on public.profiles
for select
using (
  auth.uid() = id
  or public.is_manager()
);

create policy "manage profiles"
on public.profiles
for all
using (public.is_manager())
with check (public.is_manager());

-- =========================================================
-- DEFAULT WEBSITE SETTINGS
-- =========================================================

insert into public.settings(
  id,
  hero_text,
  about_text,
  email,
  speciality,
  location,
  languages,
  status,
  client_count,
  years_creating
)
values(
  1,
  'I’m Shuria Simu, creating thoughtful identities, campaigns and visual experiences that feel elegant, modern and memorable.',
  'I create visual identities and design systems for brands that want to feel modern, expressive and beautifully put together.',
  'hello@shuriasimu.com',
  'Branding & Social',
  'Dhaka, Bangladesh',
  'Bangla · English',
  'Available for Projects',
  18,
  4
)
on conflict(id) do nothing;

-- =========================================================
-- DEFAULT SERVICES
-- Prevent duplicate service titles manually if re-running
-- =========================================================

insert into public.services(title,description,sort_order)
select
  'Brand Identity',
  'Logo, visual identity systems and creative direction.',
  1
where not exists (
  select 1 from public.services where title='Brand Identity'
);

insert into public.services(title,description,sort_order)
select
  'Social Media Design',
  'Campaign posts, launch creatives and content systems.',
  2
where not exists (
  select 1 from public.services where title='Social Media Design'
);

insert into public.services(title,description,sort_order)
select
  'Packaging',
  'Clean and premium packaging for products and brands.',
  3
where not exists (
  select 1 from public.services where title='Packaging'
);

insert into public.services(title,description,sort_order)
select
  'Print Design',
  'Poster, flyer, business card and editorial design.',
  4
where not exists (
  select 1 from public.services where title='Print Design'
);

-- =========================================================
-- STORAGE BUCKET
-- Admin can upload Profile Photo, Project Image, Resume PDF
-- =========================================================

insert into storage.buckets(
  id,
  name,
  public
)
values(
  'portfolio',
  'portfolio',
  true
)
on conflict(id)
do update set public = true;

-- =========================================================
-- STORAGE POLICIES
-- =========================================================

drop policy if exists "portfolio admin upload"
on storage.objects;

drop policy if exists "portfolio admin update"
on storage.objects;

drop policy if exists "portfolio admin delete"
on storage.objects;

create policy "portfolio admin upload"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'portfolio'
  and public.is_manager()
);

create policy "portfolio admin update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'portfolio'
  and public.is_manager()
)
with check (
  bucket_id = 'portfolio'
  and public.is_manager()
);

create policy "portfolio admin delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'portfolio'
  and public.is_manager()
);

-- =========================================================
-- ADMIN ACCOUNT SETUP
-- =========================================================
-- Supabase:
-- Authentication → Users → Add User
--
-- Internal Auth Email:
-- shuria@admin.shuriasimu.site
--
-- Password:
-- Your chosen password
--
-- Then run this with the real UUID:
--
-- insert into public.profiles(id,username,role)
-- values(
--   'YOUR-AUTH-USER-UUID',
--   'shuria',
--   'admin'
-- );
--
-- Your current UUID example:
--
-- insert into public.profiles(id,username,role)
-- values(
--   'ec18867f-6efc-4890-ab0c-e938be7f749d',
--   'shuria',
--   'admin'
-- )
-- on conflict(id)
-- do update set
--   username='shuria',
--   role='admin';

-- =========================================================
-- DONE
-- =========================================================
