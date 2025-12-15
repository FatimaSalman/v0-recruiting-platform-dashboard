-- Create candidates table
create table if not exists public.candidates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  title text,
  experience_years integer,
  location text,
  skills text[], -- array of skills
  resume_url text,
  linkedin_url text,
  portfolio_url text,
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table public.candidates enable row level security;

-- Create policies for candidates
create policy "candidates_select_own"
  on public.candidates for select
  using (auth.uid() = user_id);

create policy "candidates_insert_own"
  on public.candidates for insert
  with check (auth.uid() = user_id);

create policy "candidates_update_own"
  on public.candidates for update
  using (auth.uid() = user_id);

create policy "candidates_delete_own"
  on public.candidates for delete
  using (auth.uid() = user_id);

-- Create index for faster queries
create index if not exists candidates_user_id_idx on public.candidates(user_id);
create index if not exists candidates_email_idx on public.candidates(email);
