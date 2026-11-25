-- ============================================================
-- gezim — Supabase kurulum betiği
-- Yeni (veya geri yüklenen) bir Supabase projesinde
-- Dashboard → SQL Editor'da BİR KEZ çalıştır.
-- Tekrar çalıştırmak güvenlidir (var olanı bozmaz).
-- Sonra .env.local dosyasındaki NEXT_PUBLIC_SUPABASE_URL ve
-- NEXT_PUBLIC_SUPABASE_ANON_KEY değerlerini yeni projeninkilerle değiştir.
-- ============================================================

-- ---------- 1) TABLOLAR ----------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text,
  full_name text,
  bio text,
  avatar_url text,
  gezilen_yerler text[] not null default '{}',
  gidilecek_yerler text[] not null default '{}',
  puan int not null default 0,
  toplam_gezi_dk int not null default 0,
  ilgi_puanlari jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- Eski kurulumdan gelenler için eksik kolonları tamamla
alter table public.profiles add column if not exists puan int not null default 0;
alter table public.profiles add column if not exists toplam_gezi_dk int not null default 0;
alter table public.profiles add column if not exists ilgi_puanlari jsonb not null default '{}';
alter table public.profiles add column if not exists bildirimler jsonb not null default
  '{"takipci": true, "begeni": true, "haftalik_ozet": true, "rota_onerileri": true}'::jsonb;

-- İnsan rehber özelliği: rehber_mi = admin onayı sonrası herkese görünür olma bayrağı.
-- Onay şu an manuel — SQL Editor'dan: update public.profiles set rehber_mi = true,
-- rehber_basvuru_durumu = 'onaylandi' where username = '...';
alter table public.profiles add column if not exists rehber_mi boolean not null default false;
-- rehber_basvuru_durumu degerleri: null, beklemede, onaylandi, reddedildi
alter table public.profiles add column if not exists rehber_basvuru_durumu text;
alter table public.profiles add column if not exists rehber_aciklama text;
alter table public.profiles add column if not exists rehber_fiyat_bilgisi text;
alter table public.profiles add column if not exists rehber_bolgeler text[] not null default '{}';

create unique index if not exists profiles_username_unique
  on public.profiles (lower(username));

create table if not exists public.places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  district text not null,
  description text not null default '',
  duration_minutes int not null default 60,
  tags text[] not null default '{}',
  lat double precision,
  lng double precision
);

-- Eski (geri yüklenen) projede tablo unique kısıtsız olabilir:
-- önce olası mükerrer isimleri temizle, sonra unique index'i garanti et.
-- (ON CONFLICT (name) çalışabilsin diye şart — 42P10 hatasının çözümü)
delete from public.places a
  using public.places b
  where a.name = b.name and a.ctid < b.ctid;

create unique index if not exists places_name_unique
  on public.places (name);

-- Paylaşılan rotalar (sosyal akışın kaynağı)
create table if not exists public.routes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  baslik text not null,
  aciklama text,
  duraklar jsonb not null default '[]',
  bolgeler text[] not null default '{}',
  tarih date,
  hava jsonb,
  herkese_acik boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.routes add column if not exists herkese_acik boolean not null default false;

create table if not exists public.route_likes (
  route_id uuid not null references public.routes (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (route_id, user_id)
);

create table if not exists public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

-- İnsan rehber talepleri — iletişim uygulama içinde kalır, telefon/adres paylaşımı zorunlu değildir
create table if not exists public.rehber_talepleri (
  id uuid primary key default gen_random_uuid(),
  rehber_id uuid not null references public.profiles (id) on delete cascade,
  talep_eden_id uuid not null references public.profiles (id) on delete cascade,
  mesaj text not null,
  tarih date,
  -- durum degerleri: beklemede, kabul, red
  durum text not null default 'beklemede',
  created_at timestamptz not null default now(),
  check (rehber_id <> talep_eden_id)
);

-- ---------- 2) RLS POLİTİKALARI ----------

alter table public.profiles enable row level security;
alter table public.places enable row level security;
alter table public.routes enable row level security;
alter table public.route_likes enable row level security;
alter table public.follows enable row level security;
alter table public.rehber_talepleri enable row level security;

drop policy if exists "Profiller herkese gorunur" on public.profiles;
create policy "Profiller herkese gorunur"
  on public.profiles for select using (true);

drop policy if exists "Kullanici kendi profilini ekleyebilir" on public.profiles;
create policy "Kullanici kendi profilini ekleyebilir"
  on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "Kullanici kendi profilini guncelleyebilir" on public.profiles;
create policy "Kullanici kendi profilini guncelleyebilir"
  on public.profiles for update using (auth.uid() = id);

drop policy if exists "Mekanlar herkese gorunur" on public.places;
create policy "Mekanlar herkese gorunur"
  on public.places for select using (true);

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

drop policy if exists "Kullanici kendi rotasini paylasabilir" on public.routes;
create policy "Kullanici kendi rotasini paylasabilir"
  on public.routes for insert with check (auth.uid() = user_id);

drop policy if exists "Kullanici kendi rotasini silebilir" on public.routes;
create policy "Kullanici kendi rotasini silebilir"
  on public.routes for delete using (auth.uid() = user_id);

drop policy if exists "Begeniler herkese gorunur" on public.route_likes;
create policy "Begeniler herkese gorunur"
  on public.route_likes for select using (true);

drop policy if exists "Kullanici begeni ekleyebilir" on public.route_likes;
create policy "Kullanici begeni ekleyebilir"
  on public.route_likes for insert with check (auth.uid() = user_id);

drop policy if exists "Kullanici begenisini kaldirabilir" on public.route_likes;
create policy "Kullanici begenisini kaldirabilir"
  on public.route_likes for delete using (auth.uid() = user_id);

drop policy if exists "Takipler herkese gorunur" on public.follows;
create policy "Takipler herkese gorunur"
  on public.follows for select using (true);

drop policy if exists "Kullanici takip edebilir" on public.follows;
create policy "Kullanici takip edebilir"
  on public.follows for insert with check (auth.uid() = follower_id);

drop policy if exists "Kullanici takibi birakabilir" on public.follows;
create policy "Kullanici takibi birakabilir"
  on public.follows for delete using (auth.uid() = follower_id);

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

-- ---------- 3) YENİ KULLANICIDA OTOMATİK PROFİL ----------
-- E-posta kaydında signUp metadata'sındaki username kullanılır;
-- Google girişinde username boş kalır ve /hosgeldin sayfası tamamlar.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'username', ''),
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'picture'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- 4) İSTANBUL MEKAN VERİSİ ----------

insert into public.places (name, category, district, description, duration_minutes, tags, lat, lng) values
-- Fatih
('Ayasofya', 'tarihi', 'Fatih', 'Bin beş yüz yıllık kubbesiyle dünyanın en etkileyici yapılarından; Bizans ve Osmanlı katmanları iç içe.', 90, '{tarihi,fotoğraf}', 41.0086, 28.9802),
('Sultanahmet Camii', 'tarihi', 'Fatih', 'Altı minaresi ve mavi İznik çinileriyle ünlü; Sultanahmet Meydanı''nın kalbi.', 60, '{tarihi,fotoğraf}', 41.0054, 28.9768),
('Topkapı Sarayı', 'müze', 'Fatih', 'Osmanlı padişahlarının 400 yıllık evi; hazine dairesi ve Boğaz manzaralı avlular. Pazartesi kapalı.', 150, '{tarihi,sanat}', 41.0115, 28.9834),
('Yerebatan Sarnıcı', 'tarihi', 'Fatih', 'Yüzlerce sütunlu yeraltı sarnıcı; loş ışığı ve Medusa başlarıyla mistik bir atmosfer.', 45, '{tarihi,fotoğraf}', 41.0084, 28.9779),
('Kapalıçarşı', 'alışveriş', 'Fatih', 'Dünyanın en eski kapalı çarşılarından; 4000 dükkân, kuyumcular ve halıcılar. Pazar kapalı.', 90, '{alışveriş,tarihi}', 41.0106, 28.9680),
('Mısır Çarşısı', 'alışveriş', 'Fatih', 'Baharat kokulu tarihi çarşı; lokum ve kahve almak için ideal.', 45, '{alışveriş,yeme-içme}', 41.0166, 28.9704),
('İstanbul Arkeoloji Müzesi', 'müze', 'Fatih', 'İskender Lahdi dahil binlerce antik eser. Pazartesi kapalı.', 90, '{tarihi,sanat}', 41.0117, 28.9813),
('Süleymaniye Camii', 'tarihi', 'Fatih', 'Mimar Sinan''ın ustalık eseri; avlusundan Haliç manzarası büyüleyici.', 60, '{tarihi,fotoğraf}', 41.0161, 28.9639),
('Balat Renkli Sokaklar', 'sokak', 'Fatih', 'Rengarenk cumbalı evler, üçüncü nesil kahveciler ve antikacılar; fotoğrafçıların gözdesi.', 90, '{fotoğraf,sanat,yeme-içme}', 41.0294, 28.9489),
('Fener Rum Patrikhanesi', 'tarihi', 'Fatih', 'Ortodoks dünyasının merkezi; Balat gezisiyle birleştirilebilecek tarihi durak.', 30, '{tarihi}', 41.0292, 28.9518),
('Boğazda Tekne Turu', 'tur', 'Fatih', 'Eminönü''nden kalkan vapurla iki kıta arasında Boğaz keyfi; gün batımı seferleri popüler.', 120, '{doğa,fotoğraf}', 41.0175, 28.9709),
-- Beyoğlu
('Galata Kulesi', 'tarihi', 'Beyoğlu', 'Şehrin 360 derece en iyi manzarası; Ceneviz döneminden kalma simge kule.', 45, '{tarihi,fotoğraf}', 41.0256, 28.9744),
('İstiklal Caddesi', 'yürüyüş', 'Beyoğlu', 'Nostaljik tramvayı, pasajları ve sokak müzisyenleriyle şehrin en canlı caddesi.', 90, '{alışveriş,yeme-içme}', 41.0335, 28.9779),
('Taksim Meydanı', 'meydan', 'Beyoğlu', 'Şehrin buluşma noktası; Cumhuriyet Anıtı ve İstiklal''in başlangıcı.', 30, '{fotoğraf}', 41.0370, 28.9850),
('Pera Müzesi', 'müze', 'Beyoğlu', 'Kaplumbağa Terbiyecisi''nin evi; oryantalist resim ve modern sergiler.', 75, '{sanat}', 41.0316, 28.9750),
('SALT Galata', 'kültür', 'Beyoğlu', 'Eski Osmanlı Bankası binasında çağdaş sanat, kütüphane ve teraslı kafe; giriş ücretsiz.', 60, '{sanat,yeme-içme}', 41.0233, 28.9741),
('Karaköy Sahili', 'sokak', 'Beyoğlu', 'Üçüncü nesil kahveciler, tatlıcılar ve grafitili sokaklar; kahve molası için birebir.', 60, '{yeme-içme,fotoğraf}', 41.0225, 28.9769),
('Çukurcuma Antikacılar', 'sokak', 'Beyoğlu', 'Antikacı dükkânları ve Masumiyet Müzesi''nin sokakları; keşif hissi yüksek.', 45, '{sanat,alışveriş}', 41.0308, 28.9800),
('Galataport', 'alışveriş', 'Beyoğlu', 'Sahil boyunca modern alışveriş ve yeme-içme; İstanbul Modern''e komşu.', 90, '{alışveriş,yeme-içme}', 41.0155, 28.9819),
('İstanbul Modern', 'müze', 'Beyoğlu', 'Türkiye''nin ilk modern sanat müzesi; Renzo Piano imzalı yeni binası ve Boğaz terası. Pazartesi kapalı.', 90, '{sanat}', 41.0221, 28.9789),
-- Beşiktaş
('Dolmabahçe Sarayı', 'müze', 'Beşiktaş', 'Osmanlı''nın Avrupai yüzü; kristal merdiven ve 4.5 tonluk avize. Pazartesi kapalı.', 120, '{tarihi,sanat}', 41.0392, 29.0004),
('Ortaköy Meydanı', 'meydan', 'Beşiktaş', 'Boğaz Köprüsü manzaralı camisi ve meşhur kumpircileriyle keyifli sahil meydanı.', 60, '{fotoğraf,yeme-içme}', 41.0472, 29.0269),
('Yıldız Parkı', 'park', 'Beşiktaş', 'Asırlık ağaçlar ve köşkler arasında şehirden kaçış; ilkbaharda lale, sonbaharda yaprak.', 90, '{doğa}', 41.0499, 29.0117),
('Bebek Sahili', 'yürüyüş', 'Beşiktaş', 'Boğaz''ın en şık sahil yürüyüşü; ünlü waffleci ve badem ezmecisi durak noktası.', 60, '{doğa,yeme-içme}', 41.0776, 29.0432),
('Beşiktaş Çarşı', 'sokak', 'Beşiktaş', 'Balıkçılar, kahvaltıcılar ve öğrenci enerjisi; şehrin en canlı semt çarşılarından.', 60, '{yeme-içme}', 41.0428, 29.0060),
-- Kadıköy
('Moda Sahili', 'yürüyüş', 'Kadıköy', 'Gün batımında çimlerde oturma kültürünün merkezi; adalar manzaralı sahil hattı.', 90, '{doğa,fotoğraf}', 40.9799, 29.0253),
('Kadıköy Çarşısı', 'sokak', 'Kadıköy', 'Balık pazarı, turşucular ve meyhaneler; şehrin lezzet başkenti.', 75, '{yeme-içme,alışveriş}', 40.9903, 29.0250),
('Yeldeğirmeni', 'sokak', 'Kadıköy', 'Dev duvar resimleri (mural) ve bağımsız kafeleriyle sanat mahallesi.', 60, '{sanat,fotoğraf,yeme-içme}', 40.9948, 29.0316),
('Haydarpaşa Garı', 'tarihi', 'Kadıköy', 'Denizin üstüne kurulu ikonik gar binası; nostaljik fotoğraf durağı.', 30, '{tarihi,fotoğraf}', 41.0033, 29.0186),
('Fenerbahçe Parkı', 'park', 'Kadıköy', 'Deniz feneri, kediler ve piknik alanlarıyla sakin bir yarımada parkı.', 60, '{doğa}', 40.9694, 29.0369),
-- Üsküdar
('Kız Kulesi', 'tarihi', 'Üsküdar', 'Boğaz''ın ortasındaki efsanevi kule; Salacak sahilinden gün batımıyla izlemesi de güzel.', 60, '{tarihi,fotoğraf}', 41.0211, 29.0041),
('Kuzguncuk', 'sokak', 'Üsküdar', 'Rengarenk ahşap evler, bostanı ve sakin kafeleriyle köy havasında bir Boğaz mahallesi.', 75, '{fotoğraf,yeme-içme}', 41.0343, 29.0286),
('Çamlıca Tepesi', 'park', 'Üsküdar', 'Şehrin iki yakasını kuşbakışı gören tepe; çay bahçeleri geniş.', 90, '{doğa,fotoğraf}', 41.0277, 29.0705),
('Beylerbeyi Sarayı', 'müze', 'Üsküdar', 'Sultanların yazlık sarayı; Boğaz kıyısında zarif bir Osmanlı köşkü. Pazartesi kapalı.', 90, '{tarihi,sanat}', 41.0421, 29.0400),
('Çengelköy Sahili', 'yürüyüş', 'Üsküdar', 'Tarihi çınaraltı çay bahçesi ve meşhur hıyarıyla nostaljik Boğaz köyü.', 60, '{doğa,yeme-içme}', 41.0486, 29.0510),
('Mihrimah Sultan Camii', 'tarihi', 'Üsküdar', 'Mimar Sinan''ın iskele meydanına bakan zarif eseri.', 30, '{tarihi}', 41.0269, 29.0158),
-- Adalar
('Büyükada Turu', 'ada', 'Adalar', 'Faytonsuz adada bisikletle köşk sokakları ve çam ormanları; vapur yolculuğu gezinin parçası.', 240, '{doğa,fotoğraf}', 40.8590, 29.1215),
('Aya Yorgi Tepesi', 'park', 'Adalar', 'Büyükada''nın zirvesindeki manastır; tırmanışın ödülü panoramik deniz manzarası.', 90, '{doğa,tarihi}', 40.8557, 29.1148)
on conflict (name) do nothing;

-- ---------- 5) AVATAR DEPOLAMA (profil fotoğrafı yükleme) ----------
-- Dosya yolu kuralı: avatars/<kullanicinin_user_id'si>/<dosya_adi>
-- Böylece storage.foldername(name)[1] her zaman auth.uid() ile karşılaştırılabilir.

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
