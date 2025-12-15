-- Create interviews table
create table if not exists public.interviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete set null,
  title text not null,
  description text,
  interview_type text, -- phone, video, in-person, technical
  status text default 'scheduled', -- scheduled, completed, cancelled, rescheduled
  scheduled_at timestamp with time zone not null,
  duration_minutes integer default 60,
  location text, -- physical location or meeting link
  interviewer_name text,
  interviewer_email text,
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table public.interviews enable row level security;

-- Create policies for interviews
create policy "interviews_select_own"
  on public.interviews for select
  using (auth.uid() = user_id);

create policy "interviews_insert_own"
  on public.interviews for insert
  with check (auth.uid() = user_id);

create policy "interviews_update_own"
  on public.interviews for update
  using (auth.uid() = user_id);

create policy "interviews_delete_own"
  on public.interviews for delete
  using (auth.uid() = user_id);

-- Create indexes for faster queries
create index if not exists interviews_user_id_idx on public.interviews(user_id);
create index if not exists interviews_candidate_id_idx on public.interviews(candidate_id);
create index if not exists interviews_scheduled_at_idx on public.interviews(scheduled_at);
create index if not exists interviews_status_idx on public.interviews(status);
