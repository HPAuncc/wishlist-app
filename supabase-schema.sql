-- ============================================
-- Wishlist App Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Households (shared workspace for a couple)
create table households (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Our Wishlist',
  invite_code text unique not null default substr(md5(random()::text), 1, 8),
  created_at timestamptz default now()
);

-- 2. Profiles (extends Supabase auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  household_id uuid references households(id),
  created_at timestamptz default now()
);

-- 3. Wishlist items, scoped to household
create table wishlist_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  description text,
  price integer,
  image_url text,
  product_url text,
  retailer text,
  added_at bigint not null default (extract(epoch from now()) * 1000)::bigint,
  elo_rating integer not null default 1000,
  comparison_count integer not null default 0,
  bundled_items jsonb default '[]'::jsonb,
  added_by uuid references auth.users(id)
);

-- 4. Comparisons, scoped to household
create table comparisons (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  item_a_id uuid not null references wishlist_items(id) on delete cascade,
  item_b_id uuid not null references wishlist_items(id) on delete cascade,
  winner_id uuid not null references wishlist_items(id) on delete cascade,
  timestamp bigint not null,
  decided_by uuid references auth.users(id)
);

-- 5. Comparison queue, scoped to household
create table comparison_queue (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  item_a_id uuid not null,
  item_b_id uuid not null,
  priority integer not null default 0,
  reason text not null check (reason in ('insertion', 'calibration', 'tiebreak')),
  insertion_state jsonb,
  position serial
);

-- ============================================
-- Row Level Security (RLS)
-- Users can only access their own household's data
-- ============================================

alter table households enable row level security;
alter table profiles enable row level security;
alter table wishlist_items enable row level security;
alter table comparisons enable row level security;
alter table comparison_queue enable row level security;

-- Profiles: users can read/update their own profile
create policy "Users can read own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

-- Households: members can read their household
create policy "Members can read household"
  on households for select using (
    id in (select household_id from profiles where profiles.id = auth.uid())
  );

-- Households: anyone authenticated can create (for new signups)
create policy "Authenticated users can create households"
  on households for insert with check (auth.uid() is not null);

-- Households: anyone authenticated can read by invite_code (for joining)
create policy "Anyone can read household by invite code"
  on households for select using (true);

-- Wishlist items: household members can CRUD
create policy "Members can read items"
  on wishlist_items for select using (
    household_id in (select household_id from profiles where profiles.id = auth.uid())
  );

create policy "Members can insert items"
  on wishlist_items for insert with check (
    household_id in (select household_id from profiles where profiles.id = auth.uid())
  );

create policy "Members can update items"
  on wishlist_items for update using (
    household_id in (select household_id from profiles where profiles.id = auth.uid())
  );

create policy "Members can delete items"
  on wishlist_items for delete using (
    household_id in (select household_id from profiles where profiles.id = auth.uid())
  );

-- Comparisons: household members can CRUD
create policy "Members can read comparisons"
  on comparisons for select using (
    household_id in (select household_id from profiles where profiles.id = auth.uid())
  );

create policy "Members can insert comparisons"
  on comparisons for insert with check (
    household_id in (select household_id from profiles where profiles.id = auth.uid())
  );

-- Comparison queue: household members can CRUD
create policy "Members can read queue"
  on comparison_queue for select using (
    household_id in (select household_id from profiles where profiles.id = auth.uid())
  );

create policy "Members can insert queue"
  on comparison_queue for insert with check (
    household_id in (select household_id from profiles where profiles.id = auth.uid())
  );

create policy "Members can update queue"
  on comparison_queue for update using (
    household_id in (select household_id from profiles where profiles.id = auth.uid())
  );

create policy "Members can delete queue"
  on comparison_queue for delete using (
    household_id in (select household_id from profiles where profiles.id = auth.uid())
  );

-- ============================================
-- Auto-create profile on signup
-- ============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- Enable Realtime on data tables
-- ============================================
alter publication supabase_realtime add table wishlist_items;
alter publication supabase_realtime add table comparisons;
alter publication supabase_realtime add table comparison_queue;
