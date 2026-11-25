-- ============================================================
-- gezim — sadece eksik olan "profil fotoğrafı yükleme" özelliği
-- Dashboard → SQL Editor'da BİR KEZ çalıştır. Tekrar çalıştırmak güvenlidir.
-- ============================================================

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "Avatarlar herkese acik" on storage.objects;
create policy "Avatarlar herkese acik"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "Kullanici kendi avatarini yukleyebilir" on storage.objects;
create policy "Kullanici kendi avatarini yukleyebilir"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "Kullanici kendi avatarini guncelleyebilir" on storage.objects;
create policy "Kullanici kendi avatarini guncelleyebilir"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "Kullanici kendi avatarini silebilir" on storage.objects;
create policy "Kullanici kendi avatarini silebilir"
  on storage.objects for delete
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
