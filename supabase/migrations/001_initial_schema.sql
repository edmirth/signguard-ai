-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES TABLE
-- ============================================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  scans_used integer not null default 0,
  scans_limit integer not null default 2,
  scans_reset_at timestamptz not null default (date_trunc('month', now()) + interval '1 month'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- ============================================================
-- SCANS TABLE
-- ============================================================
create table public.scans (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  contract_type text not null default 'other',
  status text not null default 'processing' check (status in ('processing', 'complete', 'failed')),
  risk_score integer check (risk_score >= 0 and risk_score <= 100),
  risk_level text check (risk_level in ('low', 'medium', 'high', 'critical')),
  summary text,
  red_flags text[],
  negotiation_tips text[],
  key_terms jsonb,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.scans enable row level security;

-- ============================================================
-- CLAUSES TABLE
-- ============================================================
create table public.clauses (
  id uuid primary key default uuid_generate_v4(),
  scan_id uuid references public.scans(id) on delete cascade not null,
  title text not null,
  section_ref text,
  original_text text not null,
  explanation text not null,
  risk_level text not null check (risk_level in ('safe', 'caution', 'danger')),
  suggestion text,
  created_at timestamptz not null default now()
);

alter table public.clauses enable row level security;

-- ============================================================
-- TRIGGERS
-- ============================================================

-- handle_new_user: create profile row on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- reset_monthly_scans: reset scans_used when scans_reset_at is in the past
create or replace function public.reset_monthly_scans()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if old.scans_reset_at <= now() then
    new.scans_used := 0;
    new.scans_reset_at := date_trunc('month', now()) + interval '1 month';
  end if;
  return new;
end;
$$;

create trigger on_profile_scan_reset
  before update on public.profiles
  for each row execute procedure public.reset_monthly_scans();

-- updated_at timestamps
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger scans_updated_at
  before update on public.scans
  for each row execute procedure public.handle_updated_at();

-- ============================================================
-- RLS POLICIES — profiles
-- ============================================================
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- ============================================================
-- RLS POLICIES — scans
-- ============================================================
create policy "Users can view their own scans"
  on public.scans for select
  using (auth.uid() = user_id);

create policy "Users can insert their own scans"
  on public.scans for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own scans"
  on public.scans for update
  using (auth.uid() = user_id);

create policy "Users can delete their own scans"
  on public.scans for delete
  using (auth.uid() = user_id);

-- ============================================================
-- RLS POLICIES — clauses
-- ============================================================
create policy "Users can view clauses for their scans"
  on public.clauses for select
  using (
    exists (
      select 1 from public.scans
      where scans.id = clauses.scan_id
        and scans.user_id = auth.uid()
    )
  );

create policy "Users can insert clauses for their scans"
  on public.clauses for insert
  with check (
    exists (
      select 1 from public.scans
      where scans.id = clauses.scan_id
        and scans.user_id = auth.uid()
    )
  );

create policy "Users can delete clauses for their scans"
  on public.clauses for delete
  using (
    exists (
      select 1 from public.scans
      where scans.id = clauses.scan_id
        and scans.user_id = auth.uid()
    )
  );

-- ============================================================
-- STORAGE — contract-images bucket
-- ============================================================
insert into storage.buckets (id, name, public)
values ('contract-images', 'contract-images', false)
on conflict (id) do nothing;

-- RLS policies for storage
create policy "Users can upload their own contract images"
  on storage.objects for insert
  with check (
    bucket_id = 'contract-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can view their own contract images"
  on storage.objects for select
  using (
    bucket_id = 'contract-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own contract images"
  on storage.objects for delete
  using (
    bucket_id = 'contract-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
