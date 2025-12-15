-- Create jobs table
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  department text,
  location text,
  employment_type text, -- full-time, part-time, contract, internship
  experience_level text, -- entry, mid, senior, lead
  salary_min integer,
  salary_max integer,
  skills text[], -- array of required skills
  status text default 'open', -- open, closed, draft
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table public.jobs enable row level security;

-- Create policies for jobs
create policy "jobs_select_own"
  on public.jobs for select
  using (auth.uid() = user_id);

create policy "jobs_insert_own"
  on public.jobs for insert
  with check (auth.uid() = user_id);

create policy "jobs_update_own"
  on public.jobs for update
  using (auth.uid() = user_id);

create policy "jobs_delete_own"
  on public.jobs for delete
  using (auth.uid() = user_id);

-- Create index for faster queries
create index if not exists jobs_user_id_idx on public.jobs(user_id);
create index if not exists jobs_status_idx on public.jobs(status);
