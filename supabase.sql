-- Run this entire file in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.profiles(
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  role text not null default 'viewer' check(role in('admin','editor','viewer')),
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
  rating int default 5,
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

create or replace function public.is_manager()
returns boolean
language sql stable security definer
set search_path=public
as $$
  select exists(
    select 1 from public.profiles
    where id=auth.uid() and role in('admin','editor')
  );
$$;

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

-- Public website can read public portfolio data.
create policy "read settings" on public.settings for select using(true);
create policy "read projects" on public.projects for select using(published=true or public.is_manager());
create policy "read services" on public.services for select using(published=true or public.is_manager());
create policy "read experience" on public.experience for select using(true);
create policy "read education" on public.education for select using(true);
create policy "read awards" on public.awards for select using(true);
create policy "read testimonials" on public.testimonials for select using(published=true or public.is_manager());
create policy "read social" on public.social_links for select using(true);

-- Anyone may send a contact message.
create policy "send message" on public.messages for insert with check(true);

-- Admin/editor CRUD.
create policy "manage settings" on public.settings for all using(public.is_manager()) with check(public.is_manager());
create policy "manage projects" on public.projects for all using(public.is_manager()) with check(public.is_manager());
create policy "manage services" on public.services for all using(public.is_manager()) with check(public.is_manager());
create policy "manage experience" on public.experience for all using(public.is_manager()) with check(public.is_manager());
create policy "manage education" on public.education for all using(public.is_manager()) with check(public.is_manager());
create policy "manage awards" on public.awards for all using(public.is_manager()) with check(public.is_manager());
create policy "manage testimonials" on public.testimonials for all using(public.is_manager()) with check(public.is_manager());
create policy "manage messages select" on public.messages for select using(public.is_manager());
create policy "manage messages delete" on public.messages for delete using(public.is_manager());
create policy "manage social" on public.social_links for all using(public.is_manager()) with check(public.is_manager());
create policy "read own profile" on public.profiles for select using(auth.uid()=id or public.is_manager());
create policy "manage profiles" on public.profiles for all using(public.is_manager()) with check(public.is_manager());

insert into public.settings(id,hero_text,about_text,email)
values(1,
'I’m Shuria Simu, creating thoughtful identities, campaigns and visual experiences that feel elegant, modern and memorable.',
'I create visual identities and design systems for brands that want to feel modern, expressive and beautifully put together.',
'hello@shuriasimu.com')
on conflict(id) do nothing;

insert into public.services(title,description,sort_order) values
('Brand Identity','Logo, visual identity systems and creative direction.',1),
('Social Media Design','Campaign posts, launch creatives and content systems.',2),
('Packaging','Clean and premium packaging for products and brands.',3),
('Print Design','Poster, flyer, business card and editorial design.',4)
on conflict do nothing;

-- IMPORTANT ADMIN SETUP
-- First create an Auth user manually:
-- Email: shuria@admin.shuriasimu.site
-- Password: choose your password
--
-- Then copy that user's UUID and run:
--
-- insert into public.profiles(id,username,role)
-- values('PASTE_USER_UUID_HERE','shuria','admin');
--
-- Admin login screen will show ONLY:
-- User ID: shuria
-- Password: your password
--
-- No Gmail/email field is shown to the admin.


-- =========================================================
-- STORAGE: Admin can upload images/PDF directly from admin.html
-- =========================================================

insert into storage.buckets (id, name, public)
values ('portfolio', 'portfolio', true)
on conflict (id) do update set public = true;

-- Public can view files in this public bucket.
-- Upload/update/delete requires logged-in admin/editor profile.

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

-- Public bucket files are served using their public URL.
