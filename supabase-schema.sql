-- Supabase Schema for Valentine's Bouquet Sharing
-- Run this in your Supabase SQL Editor

-- Create the bouquets table
create table if not exists public.bouquets (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  image_url text,
  paths jsonb default '[]'::jsonb,
  items jsonb default '[]'::jsonb,
  created_at timestamp with time zone default now()
);

-- Create index for faster slug lookups
create index if not exists bouquets_slug_idx on public.bouquets (slug);

-- Enable Row Level Security
alter table public.bouquets enable row level security;

-- Allow anyone to read bouquets (for sharing)
create policy "Anyone can view bouquets"
  on public.bouquets
  for select
  using (true);

-- Allow anyone to insert bouquets (for saving)
create policy "Anyone can create bouquets"
  on public.bouquets
  for insert
  with check (true);

-- Optional: Clean up old bouquets after 30 days
-- Uncomment if you want automatic cleanup
-- create extension if not exists pg_cron;
-- select cron.schedule(
--   'cleanup-old-bouquets',
--   '0 0 * * *', -- Run daily at midnight
--   $$delete from public.bouquets where created_at < now() - interval '30 days'$$
-- );
