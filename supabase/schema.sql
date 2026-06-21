-- Run this in Supabase Dashboard → SQL Editor

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text,
  birthday text,
  bio text,
  genders text[] default '{}',
  seeking text[] default '{}',
  orientations text[] default '{}',
  looking_for text,
  clan text,
  dialect text,
  hometown_country text,
  hometown_state text,
  hometown_city text,
  work text,
  education text,
  interests text[] default '{}',
  lifestyle jsonb default '{}',
  extras jsonb default '{}',
  photos text[] default '{}',
  distance integer,
  distance_worldwide boolean default false,
  distance_us_only boolean default false,
  show_gender boolean default true,
  show_orientation boolean default true,
  photo_verified boolean default false,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table profiles enable row level security;

-- Users can read any profile (for discovery/matching)
create policy "Profiles are viewable by authenticated users"
  on profiles for select
  to authenticated
  using (true);

-- Users can only insert/update their own profile
create policy "Users can upsert their own profile"
  on profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update
  to authenticated
  using (auth.uid() = id);

-- Auto-create an empty profile row when a user signs up
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
