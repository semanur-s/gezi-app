-- Gezi App veritabanı şeması (Supabase / PostgreSQL)
-- Supabase panelinde SQL Editor'a yapıştırıp çalıştırın.

-- ─── Kullanıcı profilleri ─────────────────────────────────────────────
create table if not exists public.profiles (
  id                uuid primary key references auth.users (id) on delete cascade,
  username          text unique,
  full_name         text,
  bio               text,
  avatar_url        text,
  gezilen_yerler    text[] not null default '{}',   -- gezilen mekan adları
  gidilecek_yerler  text[] not null default '{}'    -- gidilecek mekan adları
);

-- Yeni kullanıcı kaydolduğunda otomatik profil oluştur
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Mekanlar ─────────────────────────────────────────────────────────
create table if not exists public.places (
  id                uuid primary key default gen_random_uuid(),
  name              text not null unique,
  category          text,
  district          text,             -- semt
  description       text,
  duration_minutes  integer,          -- önerilen ziyaret süresi
  tags              text[] not null default '{}',
  lat               double precision,
  lng               double precision
);

-- ─── Row Level Security ───────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.places   enable row level security;

-- Profiller herkese açık okunur (/profil/[kullanici] sayfası), sadece sahibi günceller
create policy "profiles_select_all" on public.profiles
  for select using (true);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Mekanlar herkese açık okunur
create policy "places_select_all" on public.places
  for select using (true);
