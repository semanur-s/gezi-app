# 🗺️ Gezi App - Tur Planlama Uygulaması

Gezi App, kullanıcıların kişiselleştirilmiş tur rotaları oluşturabildiği, yerleri keşfedebildiği ve diğer gezginlerle paylaşabildiği bir tur planlama platformudur.

> ⚠️ **Proje Durumu**: Geliştirme aşamasında (v0.1.0) - Daha fazla özellik eklenecektir

## ✨ Özellikler

- 🔐 **Kullanıcı Yönetimi**: Supabase ile Google/e-posta girişi; kayıtta kullanıcı adı seçimi (`/hosgeldin` onboarding)
- 🌦️ **Hava Durumuna Duyarlı Rota**: Open-Meteo tahminine göre yağmurlu günde iç mekan ağırlıklı plan
- 🎮 **Oyunlaştırma**: Konum doğrulamalı "Gezdim" puanları, gezgin seviyeleri (🐣→👑), animasyonlu puan çubuğu
- 🤝 **Sosyal Akış**: Rota paylaşımı, beğeni, takip sistemi; ana sayfada gerçek kullanıcı rotaları
- 🧠 **Öğrenen Kişiselleştirme**: Gezi sonu anketi ile ilgi profili birikir, sonraki rotalara yansır
- ✨ **Oyunsu Arayüz**: Tıklamalarda uçan övgü yazıları, sahneli rota yükleme animasyonu, kademeli giriş efektleri
- 🖼️ **Otomatik Görseller**: Mekan fotoğrafları Türkçe Wikipedia'dan dinamik çekilir
- 🗺️ **AI ile Rota Oluşturma**: Seçilen semt, saat aralığı ve ilgi alanlarına göre LLM (Llama 3.3 70B, Groq API) ile rota; mekanlar önce veritabanında filtrelenir, öncelikli yere uzaklığa göre sıralanır
- 📍 **Yerler Keşfi**: İlgilendiğiniz yerleri bulma ve filtreleme
- ✅ **Gezilen / Gidilecek Listeleri**: Mekanları işaretleyip sonraki rotaları buna göre şekillendirme
- 🧭 **İnsan Rehberler**: Rehber başvurusu (`/rehber-ol`) ve rehber listesi (`/rehberler`)
- 👤 **Profil Yönetimi**: Kişisel profil oluşturma ve düzenleme
- 📱 **Responsive Tasarım**: Tailwind CSS ile modern UI

## 🛠️ Teknoloji Stack

- **Framework**: [Next.js 16](https://nextjs.org) - React 19 ile
- **Veritabanı & Auth**: [Supabase](https://supabase.com)
- **Rota Üretimi**: Groq API (Llama 3.3 70B)
- **Hava Durumu**: Open-Meteo
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com)
- **Icons**: [Tabler Icons](https://tabler-icons.io)
- **Language**: TypeScript
- **Linting**: ESLint

## 📦 Kurulum

### Gereksinimler
- Node.js 20.9+
- npm veya yarn

### Adımlar

1. **Repository'yi klonlayın**
```bash
git clone <repo-url>
cd gezi-app
```

2. **Bağımlılıkları yükleyin**
```bash
npm install
```

3. **Ortam değişkenlerini ayarlayın**

`.env.local` dosyasını oluşturun:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GROQ_API_KEY=your_groq_api_key
```

Ardından Supabase Dashboard → SQL Editor'da `supabase/kurulum.sql` dosyasını bir kez çalıştırın
(tablolar, RLS politikaları, otomatik profil trigger'ı ve İstanbul mekan verisi kurulur).
Daha önce kurulmuş bir veritabanını güncelliyorsanız `kurulum_avatar_ekle.sql`, `kurulum_rehber_ekle.sql` ve `kurulum_rota_gizlilik.sql` dosyalarını da çalıştırın.

4. **Geliştirme sunucusunu başlatın**
```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) adresinde uygulamayı açın.

## 📁 Proje Yapısı

```
src/
├── app/
│   ├── page.tsx              # Ana sayfa (sosyal akış)
│   ├── giris/                # Giriş sayfası
│   ├── hosgeldin/            # Kayıt sonrası kullanıcı adı seçimi
│   ├── rehberler/            # Rehber listesi
│   ├── rehber-ol/            # Rehber başvurusu
│   ├── profil/               # Profil sayfası
│   │   ├── [kullanici]/      # Dinamik kullanıcı profili
│   │   └── duzenle/          # Profil düzenleme
│   ├── rota-olustur/         # Rota oluşturma sayfası
│   ├── yerler/               # Yerler sayfası
│   ├── api/                  # API rotaları
│   │   └── rota/olustur/     # Rota oluşturma API'si
│   └── auth/                 # Kimlik doğrulama
└── lib/
    ├── supabase/
    │   ├── client.ts         # Supabase istemci (client-side)
    │   └── server.ts         # Supabase sunucu (server-side)
    ├── seviye.ts             # Gezgin seviyeleri ve puanlar
    ├── etkilesim.ts          # Arayüz mikro-etkileşimleri
    ├── useSayac.ts           # Animasyonlu sayaç hook'u
    └── useScrollReveal.ts    # Kaydırınca görünme efekti
supabase/                     # Veritabanı kurulum SQL dosyaları
```

## 🚀 Komutlar

```bash
npm run dev      # Geliştirme sunucusunu başlat (localhost:3000)
npm run build    # Üretim derlemesi yap
npm start        # Üretim sunucusunu başlat
npm run lint     # ESLint kodunu kontrol et
```

## 🔄 API Endpoints

- `POST /api/rota/olustur` - Yeni rota oluşturma

## 📝 Planlanan Özellikler

- [ ] Rota detay ve düzenleme
- [ ] Yorum ve değerlendirme sistemi
- [ ] Gelişmiş harita entegrasyonu
- [ ] Rotaları kaydetme (favoriler)
- [ ] Davet sistemi
- [ ] Bildirim sistemi
- [ ] Mobil uygulama

## 🤝 Katkıda Bulunma

Bu proje halen geliştirme aşamasındadır. Geliştirmeleri sırasında düşünceleriniz ve tavsiyeleri değerlidir.

## 📄 Lisans

MIT
