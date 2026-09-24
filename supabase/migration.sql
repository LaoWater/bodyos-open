-- ReConnect MVP - Supabase Migration
-- Run this in your Supabase SQL Editor (SQL tab in dashboard)
-- after creating a free project at https://supabase.com

-- ============================================================
-- 1. User Profiles (extends auth.users)
-- ============================================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  goals text[] default '{}',
  experience_level text check (experience_level in ('beginner', 'intermediate', 'advanced')) default 'beginner',
  equipment text[] default '{}',
  injuries text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create a profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- 2. Posture Assessments
-- ============================================================
create table public.posture_assessments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  score integer check (score >= 0 and score <= 100),
  issues text[] default '{}',
  photos text[] default '{}',
  landmarks jsonb,
  recommendations text[] default '{}',
  created_at timestamptz default now()
);

create index idx_assessments_user on public.posture_assessments(user_id, created_at desc);

-- ============================================================
-- 3. Exercise Sessions
-- ============================================================
create table public.exercise_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  exercise_type text not null,
  reps integer default 0,
  avg_score integer check (avg_score >= 0 and avg_score <= 100),
  created_at timestamptz default now()
);

create index idx_sessions_user on public.exercise_sessions(user_id, created_at desc);

-- ============================================================
-- 4. Session Reps (per-rep detail)
-- ============================================================
create table public.session_reps (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.exercise_sessions on delete cascade not null,
  rep_number integer not null,
  form_score integer check (form_score >= 0 and form_score <= 100),
  issues text[] default '{}',
  created_at timestamptz default now()
);

create index idx_reps_session on public.session_reps(session_id);

-- ============================================================
-- 5. Row Level Security (RLS)
-- ============================================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.posture_assessments enable row level security;
alter table public.exercise_sessions enable row level security;
alter table public.session_reps enable row level security;

-- Profiles: users can read/update only their own
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Assessments: users can CRUD only their own
create policy "Users can view own assessments"
  on public.posture_assessments for select
  using (auth.uid() = user_id);

create policy "Users can create own assessments"
  on public.posture_assessments for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own assessments"
  on public.posture_assessments for delete
  using (auth.uid() = user_id);

-- Sessions: users can CRUD only their own
create policy "Users can view own sessions"
  on public.exercise_sessions for select
  using (auth.uid() = user_id);

create policy "Users can create own sessions"
  on public.exercise_sessions for insert
  with check (auth.uid() = user_id);

-- Session Reps: accessible if user owns the parent session
create policy "Users can view own session reps"
  on public.session_reps for select
  using (
    exists (
      select 1 from public.exercise_sessions
      where exercise_sessions.id = session_reps.session_id
      and exercise_sessions.user_id = auth.uid()
    )
  );

create policy "Users can create own session reps"
  on public.session_reps for insert
  with check (
    exists (
      select 1 from public.exercise_sessions
      where exercise_sessions.id = session_reps.session_id
      and exercise_sessions.user_id = auth.uid()
    )
  );

-- ============================================================
-- 6. Storage Buckets (for posture photos)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('posture-photos', 'posture-photos', false);

-- Users can upload to their own folder
create policy "Users can upload own photos"
  on storage.objects for insert
  with check (
    bucket_id = 'posture-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can view their own photos
create policy "Users can view own photos"
  on storage.objects for select
  using (
    bucket_id = 'posture-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
