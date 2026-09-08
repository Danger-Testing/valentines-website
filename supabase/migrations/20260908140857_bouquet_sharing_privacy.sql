-- Deploy the updated app first: older clients read unlisted bouquets directly.
-- The updated client uses the exact-slug RPC, with a fallback until this is applied.
create table if not exists public.bouquets (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  image_url text,
  paths jsonb default '[]'::jsonb,
  items jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);
alter table public.bouquets add column if not exists note text;
alter table public.bouquets add column if not exists bg_color text default '#ffffff';
alter table public.bouquets add column if not exists from_name text;
alter table public.bouquets add column if not exists to_name text;
alter table public.bouquets add column if not exists is_gallery boolean default false;

create schema if not exists bouquet_private;
revoke all on schema bouquet_private from public;
grant usage on schema bouquet_private to anon, authenticated;

-- Keep privileged code out of exposed API schemas. The only parameter is an
-- exact bearer link: callers cannot supply a filter or enumerate unlisted rows.
create or replace function bouquet_private.lookup_bouquet(bouquet_slug text)
returns jsonb
language sql stable security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'image_url', b.image_url, 'paths', b.paths, 'items', b.items,
    'note', b.note, 'bg_color', b.bg_color, 'from_name', b.from_name,
    'to_name', b.to_name, 'is_gallery', b.is_gallery
  ) from public.bouquets b
  where b.slug = bouquet_slug and length(bouquet_slug) between 1 and 200
  limit 1;
$$;
revoke all on function bouquet_private.lookup_bouquet(text) from public;
grant execute on function bouquet_private.lookup_bouquet(text) to anon, authenticated;

create or replace function public.get_bouquet_by_slug(bouquet_slug text)
returns jsonb
language sql stable security invoker
set search_path = ''
as $$ select bouquet_private.lookup_bouquet(bouquet_slug); $$;
revoke all on function public.get_bouquet_by_slug(text) from public;
grant execute on function public.get_bouquet_by_slug(text) to anon, authenticated;

alter table public.bouquets enable row level security;
drop policy if exists "Anyone can view bouquets" on public.bouquets;
drop policy if exists "Public gallery bouquets" on public.bouquets;
create policy "Public gallery bouquets" on public.bouquets
  for select to anon, authenticated using (is_gallery is true);

revoke all on table public.bouquets from anon, authenticated;
grant select, insert on table public.bouquets to anon, authenticated;
-- Preserve direct insert compatibility for the editor and agent integrations.
drop policy if exists "Anyone can create bouquets" on public.bouquets;
create policy "Anyone can create bouquets" on public.bouquets
  for insert to anon, authenticated with check (
    length(slug) between 1 and 200
    and jsonb_typeof(items) = 'array'
    and case when jsonb_typeof(items) = 'array' then jsonb_array_length(items) <= 200 else false end
    and octet_length(items::text) <= 1048576
    and coalesce(length(note), 0) <= 10000
    and coalesce(length(from_name), 0) <= 200
    and coalesce(length(to_name), 0) <= 200
  );

create index if not exists bouquets_gallery_created_idx
  on public.bouquets (created_at desc, slug asc) where is_gallery is true;
