-- Create applications table to track candidate applications to jobs
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text default 'applied', -- applied, screening, interview, offer, hired, rejected
  match_score integer, -- AI-generated match score (0-100)
  notes text,
  applied_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(job_id, candidate_id)
);

-- Enable Row Level Security
alter table public.applications enable row level security;

-- Create policies for applications
create policy "applications_select_own"
  on public.applications for select
  using (auth.uid() = user_id);

create policy "applications_insert_own"
  on public.applications for insert
  with check (auth.uid() = user_id);

create policy "applications_update_own"
  on public.applications for update
  using (auth.uid() = user_id);

create policy "applications_delete_own"
  on public.applications for delete
  using (auth.uid() = user_id);

-- Create indexes for faster queries
create index if not exists applications_job_id_idx on public.applications(job_id);
create index if not exists applications_candidate_id_idx on public.applications(candidate_id);
create index if not exists applications_user_id_idx on public.applications(user_id);
create index if not exists applications_status_idx on public.applications(status);
