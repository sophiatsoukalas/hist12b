-- Schema migration for HIST 12B LA housing & homelessness project
-- Run this in the Supabase SQL editor before seeding data.

-- Enable required extensions (usually enabled by default in Supabase)
create extension if not exists "pgcrypto";

-- Admin table: which auth users are admins
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.admin_users enable row level security;

-- Only the user themselves (and service role) can see their admin row
create policy "admin_users_self_select"
  on public.admin_users
  for select
  using (auth.uid() = user_id);

-- Only service role (dashboard / server-side) can insert/delete admin rows
create policy "admin_users_service_insert"
  on public.admin_users
  for insert
  with check (auth.role() = 'service_role');

create policy "admin_users_service_delete"
  on public.admin_users
  for delete
  using (auth.role() = 'service_role');

-- Helper: check if current user is an admin
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
  );
$$;

-- Enum for policy jurisdiction
do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'jurisdiction_level'
  ) then
    create type public.jurisdiction_level as enum ('federal', 'state', 'city', 'county');
  end if;
end$$;

-- Locations
create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  latitude double precision not null,
  longitude double precision not null,
  geometry_json jsonb,
  neighborhood text,
  categories text[] not null default '{}'::text[],
  era text,
  short_summary text,
  narrative_md text,
  images text[] not null default '{}'::text[],
  published boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Policies
create table if not exists public.policies (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  date date,
  jurisdiction jurisdiction_level not null,
  short_summary text,
  narrative_md text,
  tags text[] not null default '{}'::text[],
  published boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Citations
create table if not exists public.citations (
  id uuid primary key default gen_random_uuid(),
  citation_key text not null unique,
  title text not null,
  author text,
  year integer,
  publication text,
  url text,
  notes text,
  created_at timestamptz not null default timezone('utc', now())
);

-- Join: locations ↔ citations
create table if not exists public.location_citations (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.locations(id) on delete cascade,
  citation_id uuid not null references public.citations(id) on delete cascade,
  context_note text
);

-- Join: policies ↔ citations
create table if not exists public.policy_citations (
  id uuid primary key default gen_random_uuid(),
  policy_id uuid not null references public.policies(id) on delete cascade,
  citation_id uuid not null references public.citations(id) on delete cascade,
  context_note text
);

-- Join: policies ↔ locations (e.g., “enforced here”, “piloted here”)
create table if not exists public.policy_locations (
  id uuid primary key default gen_random_uuid(),
  policy_id uuid not null references public.policies(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  relationship_note text
);

-- Basic indexes
create index if not exists locations_slug_idx on public.locations (slug);
create index if not exists locations_published_idx on public.locations (published);
create index if not exists locations_categories_gin_idx on public.locations using gin (categories);

create index if not exists policies_slug_idx on public.policies (slug);
create index if not exists policies_date_idx on public.policies (date);
create index if not exists policies_published_idx on public.policies (published);
create index if not exists policies_tags_gin_idx on public.policies using gin (tags);

create index if not exists citations_key_idx on public.citations (citation_key);

create index if not exists location_citations_location_idx on public.location_citations (location_id);
create index if not exists location_citations_citation_idx on public.location_citations (citation_id);

create index if not exists policy_citations_policy_idx on public.policy_citations (policy_id);
create index if not exists policy_citations_citation_idx on public.policy_citations (citation_id);

create index if not exists policy_locations_policy_idx on public.policy_locations (policy_id);
create index if not exists policy_locations_location_idx on public.policy_locations (location_id);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_locations_updated_at on public.locations;
create trigger set_locations_updated_at
before update on public.locations
for each row
execute procedure public.set_updated_at();

drop trigger if exists set_policies_updated_at on public.policies;
create trigger set_policies_updated_at
before update on public.policies
for each row
execute procedure public.set_updated_at();

-- Enable RLS
alter table public.locations enable row level security;
alter table public.policies enable row level security;
alter table public.citations enable row level security;
alter table public.location_citations enable row level security;
alter table public.policy_citations enable row level security;
alter table public.policy_locations enable row level security;

-- RLS policies

-- Locations: anyone can read published, only admins can write
create policy "locations_select_published"
  on public.locations
  for select
  using (published = true or public.is_admin());

create policy "locations_write_admin_only"
  on public.locations
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- Policies: anyone can read published, only admins can write
create policy "policies_select_published"
  on public.policies
  for select
  using (published = true or public.is_admin());

create policy "policies_write_admin_only"
  on public.policies
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- Citations: readable by everyone, writable only by admins
create policy "citations_select_all"
  on public.citations
  for select
  using (true);

create policy "citations_write_admin_only"
  on public.citations
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- location_citations: visible if related location is published or user is admin
create policy "location_citations_select_published_or_admin"
  on public.location_citations
  for select
  using (
    public.is_admin()
    or exists (
      select 1
      from public.locations l
      where l.id = location_id
        and l.published = true
    )
  );

create policy "location_citations_write_admin_only"
  on public.location_citations
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- policy_citations: visible if related policy is published or user is admin
create policy "policy_citations_select_published_or_admin"
  on public.policy_citations
  for select
  using (
    public.is_admin()
    or exists (
      select 1
      from public.policies p
      where p.id = policy_id
        and p.published = true
    )
  );

create policy "policy_citations_write_admin_only"
  on public.policy_citations
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- policy_locations: visible if related policy OR location is published, or user is admin
create policy "policy_locations_select_published_or_admin"
  on public.policy_locations
  for select
  using (
    public.is_admin()
    or exists (
      select 1
      from public.policies p
      where p.id = policy_id
        and p.published = true
    )
    or exists (
      select 1
      from public.locations l
      where l.id = location_id
        and l.published = true
    )
  );

create policy "policy_locations_write_admin_only"
  on public.policy_locations
  for all
  using (public.is_admin())
  with check (public.is_admin());

