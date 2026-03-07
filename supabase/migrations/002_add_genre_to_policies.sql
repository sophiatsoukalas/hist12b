-- Add genre column to policies table
-- This allows distinguishing between official policies and resistance movements
-- Default value is 'Policy' for backward compatibility with existing data

alter table public.policies add column if not exists genre text not null default 'Policy';

-- Add check constraint to ensure genre is either 'Policy' or 'Resistance'
alter table public.policies add constraint policies_genre_check 
  check (genre in ('Policy', 'Resistance'));

-- Create index for faster filtering by genre
create index if not exists policies_genre_idx on public.policies (genre);
