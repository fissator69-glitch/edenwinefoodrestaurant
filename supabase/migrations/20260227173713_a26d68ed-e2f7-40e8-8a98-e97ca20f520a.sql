-- 1) Roles
create type public.app_role as enum ('admin');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

create policy "Users can read their own roles"
on public.user_roles
for select
to authenticated
using (auth.uid() = user_id);

create policy "Admins can manage roles"
on public.user_roles
for all
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

-- 2) Shared updated_at trigger
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 3) Site settings (key/value)
create table public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

create policy "Public can read site settings"
on public.site_settings
for select
to anon, authenticated
using (true);

create policy "Admins can write site settings"
on public.site_settings
for insert
to authenticated
with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update site settings"
on public.site_settings
for update
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete site settings"
on public.site_settings
for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create trigger trg_site_settings_updated_at
before update on public.site_settings
for each row execute function public.update_updated_at_column();

-- 4) Footer + Social links
create table public.site_footer (
  id uuid primary key default gen_random_uuid(),
  content jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint site_footer_singleton check (id is not null)
);

alter table public.site_footer enable row level security;

create policy "Public can read footer"
on public.site_footer
for select
to anon, authenticated
using (true);

create policy "Admins can write footer"
on public.site_footer
for insert
to authenticated
with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update footer"
on public.site_footer
for update
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete footer"
on public.site_footer
for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create trigger trg_site_footer_updated_at
before update on public.site_footer
for each row execute function public.update_updated_at_column();

create table public.social_links (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  url text not null,
  "order" int not null default 0,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_social_links_order on public.social_links("order");

alter table public.social_links enable row level security;

create policy "Public can read social links"
on public.social_links
for select
to anon, authenticated
using (enabled = true);

create policy "Admins can write social links"
on public.social_links
for insert
to authenticated
with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update social links"
on public.social_links
for update
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete social links"
on public.social_links
for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create trigger trg_social_links_updated_at
before update on public.social_links
for each row execute function public.update_updated_at_column();

-- 5) Page content blocks
create table public.page_content (
  id uuid primary key default gen_random_uuid(),
  page text not null,
  section text not null,
  content jsonb not null default '{}'::jsonb,
  "order" int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (page, section, "order")
);

create index idx_page_content_page_section on public.page_content(page, section);

alter table public.page_content enable row level security;

create policy "Public can read page content"
on public.page_content
for select
to anon, authenticated
using (true);

create policy "Admins can write page content"
on public.page_content
for insert
to authenticated
with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update page content"
on public.page_content
for update
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete page content"
on public.page_content
for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create trigger trg_page_content_updated_at
before update on public.page_content
for each row execute function public.update_updated_at_column();

-- 6) Media library (metadata)
create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  path text not null unique,
  bucket text not null default 'site-media',
  alt text,
  tags text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_media_assets_tags on public.media_assets using gin (tags);

alter table public.media_assets enable row level security;

create policy "Public can read media assets"
on public.media_assets
for select
to anon, authenticated
using (true);

create policy "Admins can write media assets"
on public.media_assets
for insert
to authenticated
with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update media assets"
on public.media_assets
for update
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete media assets"
on public.media_assets
for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create trigger trg_media_assets_updated_at
before update on public.media_assets
for each row execute function public.update_updated_at_column();

-- 7) Storage bucket for site media
insert into storage.buckets (id, name, public)
values ('site-media', 'site-media', true)
on conflict (id) do nothing;

-- Public read for site-media
create policy "Public can read site media"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'site-media');

-- Admin write for site-media
create policy "Admins can upload site media"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'site-media' and public.has_role(auth.uid(), 'admin'));

create policy "Admins can update site media"
on storage.objects
for update
to authenticated
using (bucket_id = 'site-media' and public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete site media"
on storage.objects
for delete
to authenticated
using (bucket_id = 'site-media' and public.has_role(auth.uid(), 'admin'));