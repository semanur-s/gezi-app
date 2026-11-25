-- Rota gizliliği: rotalar varsayılan olarak sadece sahibine görünür.
-- Supabase > SQL Editor'de bir kez çalıştırın (tekrar çalıştırmak güvenlidir).

-- Mevcut rotalar zaten paylaşılmıştı, herkese açık kalsın; yenilerin varsayılanı gizli.
alter table public.routes add column if not exists herkese_acik boolean not null default true;
alter table public.routes alter column herkese_acik set default false;

drop policy if exists "Rotalar herkese gorunur" on public.routes;
drop policy if exists "Rotalar gorunurluk" on public.routes;
create policy "Rotalar gorunurluk"
  on public.routes for select
  using (herkese_acik = true or auth.uid() = user_id);

drop policy if exists "Kullanici kendi rotasini guncelleyebilir" on public.routes;
create policy "Kullanici kendi rotasini guncelleyebilir"
  on public.routes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
