# 🗺️ Gezi App - Tur Planlama Uygulaması

Gezi App, kullanıcıların kişiselleştirilmiş tur rotaları oluşturabildiği, yerleri keşfedebildiği ve diğer gezginlerle paylaşabildiği bir tur planlama platformudur.

> ⚠️ **Proje Durumu**: Geliştirme aşamasında (v0.1.0) - Daha fazla özellik eklenecektir

## ✨ Özellikler

- 🔐 **Kullanıcı Yönetimi**: Supabase entegrasyonu ile güvenli oturum açma/çıkma
- 🗺️ **Rota Oluşturma**: Kişiselleştirilmiş tur rotaları oluşturma
- 📍 **Yerler Keşfi**: İlgilendiğiniz yerleri bulma ve filtreleme
- ❤️ **Favoriler**: Rotaları ve yerleri favorilerinize ekleme
- 👤 **Profil Yönetimi**: Kişisel profil oluşturma ve düzenleme
- 📱 **Responsive Tasarım**: Tailwind CSS ile modern UI

## 🛠️ Teknoloji Stack

- **Framework**: [Next.js 16](https://nextjs.org) - React 19 ile
- **Veritabanı & Auth**: [Supabase](https://supabase.com)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com)
- **Icons**: [Tabler Icons](https://tabler-icons.io)
- **Language**: TypeScript
- **Linting**: ESLint

## 📦 Kurulum

### Gereksinimler
- Node.js 18+ 
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

3. **Supabase ortam değişkenlerini ayarlayın**

`.env.local` dosyasını oluşturun:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Geliştirme sunucusunu başlatın**
```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) adresinde uygulamayı açın.

## 📁 Proje Yapısı

```
src/
├── app/
│   ├── page.tsx              # Ana sayfa
│   ├── giris/                # Giriş sayfası
│   ├── profil/               # Profil sayfası
│   │   ├── [kullanici]/      # Dinamik kullanıcı profili
│   │   └── duzenle/          # Profil düzenleme
│   ├── rota-olustur/         # Rota oluşturma sayfası
│   ├── yerler/               # Yerler sayfası
│   ├── api/                  # API rotaları
│   │   └── rota/olustur/     # Rota oluşturma API'si
│   └── auth/                 # Kimlik doğrulama
├── lib/
│   └── supabase/
│       ├── client.ts         # Supabase istemci (client-side)
│       └── server.ts         # Supabase sunucu (server-side)
└── middleware.ts             # NextAuth middleware

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
- [ ] Paylaşım ve davet sistemi
- [ ] Bildirim sistemi
- [ ] Mobil uygulama

## 🤝 Katkıda Bulunma

Bu proje halen geliştirme aşamasındadır. Geliştirmeleri sırasında düşünceleriniz ve tavsiyeleri değerlidir.

## 📄 Lisans

MIT
