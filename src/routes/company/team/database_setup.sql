-- Create team_meetings table
create table public.team_meetings (
    id uuid default gen_random_uuid() primary key,
    title text not null,
    description text,
    meeting_date timestamp with time zone not null,
    status text not null check (status in ('scheduled', 'in-progress', 'completed', 'cancelled')),
    pre_meeting_summary text,
    post_meeting_summary text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    user_id uuid references auth.users(id) default auth.uid()
);

-- Create team_meeting_participants table
create table public.team_meeting_participants (
    id uuid default gen_random_uuid() primary key,
    meeting_id uuid references public.team_meetings(id) on delete cascade,
    employee_id uuid references public.organization_employees(id) on delete cascade,
    objectives text,
    conclusions text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    user_id uuid references auth.users(id) default auth.uid()
);

-- Set up RLS policies for team_meetings
alter table public.team_meetings enable row level security;

-- Allow read access to authenticated users
create policy "Allow read access for authenticated users"
on public.team_meetings
for select
to authenticated
using (true);

-- Allow full access to owner
create policy "Allow full access to owner"
on public.team_meetings
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Set up RLS policies for team_meeting_participants
alter table public.team_meeting_participants enable row level security;

-- Allow read access to authenticated users
create policy "Allow read access for authenticated users"
on public.team_meeting_participants
for select
to authenticated
using (true);

-- Allow full access to owner
create policy "Allow full access to owner"
on public.team_meeting_participants
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Create indexes
create index team_meetings_user_id_idx on public.team_meetings(user_id);
create index team_meetings_status_idx on public.team_meetings(status);
create index team_meetings_meeting_date_idx on public.team_meetings(meeting_date);
create index team_meeting_participants_meeting_id_idx on public.team_meeting_participants(meeting_id);
create index team_meeting_participants_employee_id_idx on public.team_meeting_participants(employee_id);

-- Add trigger to update updated_at column for team_meetings
create trigger update_team_meetings_updated_at
    before update on public.team_meetings
    for each row
    execute function update_updated_at_column();

-- Add trigger to update updated_at column for team_meeting_participants
create trigger update_team_meeting_participants_updated_at
    before update on public.team_meeting_participants
    for each row
    execute function update_updated_at_column();

-- Add transcript and completed_at columns to team_meetings table
ALTER TABLE public.team_meetings ADD COLUMN IF NOT EXISTS transcript text;
ALTER TABLE public.team_meetings ADD COLUMN IF NOT EXISTS completed_at timestamp with time zone;

-- Create company_info table
CREATE TABLE IF NOT EXISTS public.company_info (
    id uuid default gen_random_uuid() primary key,
    name text,
    description text,
    mission text,
    vision text,
    values text[] default '{}',
    tech_stack text[] default '{}',
    code_context text,
    business_context text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    user_id uuid references auth.users(id) default auth.uid()
);

-- Set up RLS policies for company_info
alter table public.company_info enable row level security;

-- Allow read access to authenticated users
create policy "Allow read access for authenticated users"
on public.company_info
for select
to authenticated
using (true);

-- Allow full access to owner
create policy "Allow full access to owner"
on public.company_info
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Add trigger to update updated_at column for company_info
create trigger update_company_info_updated_at
    before update on public.company_info
    for each row
    execute function update_updated_at_column();
