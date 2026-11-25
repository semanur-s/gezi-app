-- ============================================================
-- gezim — sadece YENİ eklenen "İnsan Rehber" özelliği
-- (kurulum.sql'i zaten bir kez başarıyla çalıştırdıysan, bunun
-- çalışması için o dosyayı tekrar çalıştırmana gerek yok — bu
-- dosya sadece eksik olan yeni parçaları ekler.)
-- Dashboard → SQL Editor'da BİR KEZ çalıştır. Tekrar çalıştırmak güvenlidir.
-- ============================================================

alter table public.profiles add column if not exists rehber_mi boolean not null default false;
alter table public.profiles add column if not exists rehber_basvuru_durumu text;
alter table public.profiles add column if not exists rehber_aciklama text;
alter table public.profiles add column if not exists rehber_fiyat_bilgisi text;
alter table public.profiles add column if not exists rehber_bolgeler text[] not null default '{}';

create table if not exists public.rehber_talepleri (
  id uuid primary key default gen_random_uuid(),
  rehber_id uuid not null references public.profiles (id) on delete cascade,
  talep_eden_id uuid not null references public.profiles (id) on delete cascade,
  mesaj text not null,
  tarih date,
  durum text not null default 'beklemede',
  created_at timestamptz not null default now(),
  check (rehber_id <> talep_eden_id)
);

alter table public.rehber_talepleri enable row level security;

drop policy if exists "Ilgili taraflar rehber taleplerini gorur" on public.rehber_talepleri;
create policy "Ilgili taraflar rehber taleplerini gorur"
  on public.rehber_talepleri for select
  using (auth.uid() = rehber_id or auth.uid() = talep_eden_id);

drop policy if exists "Kullanici rehbere talep gonderebilir" on public.rehber_talepleri;
create policy "Kullanici rehbere talep gonderebilir"
  on public.rehber_talepleri for insert
  with check (auth.uid() = talep_eden_id);

drop policy if exists "Rehber talebi yanitlayabilir" on public.rehber_talepleri;
create policy "Rehber talebi yanitlayabilir"
  on public.rehber_talepleri for update
  using (auth.uid() = rehber_id);
