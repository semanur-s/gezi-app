# 🗺️ Gezi App - Tur Planlama Uygulaması

Gezi App, kullanıcıların kişiselleştirilmiş tur rotaları oluşturabildiği, yerleri keşfedebildiği ve gezdiği yerleri takip edebildiği bir tur planlama platformudur.

> ⚠️ **Proje Durumu**: Geliştirme aşamasında (v0.1.0) - Daha fazla özellik eklenecektir

## ✨ Özellikler

- 🔐 **Kullanıcı Yönetimi**: Supabase entegrasyonu ile güvenli oturum açma/çıkma
- 🗺️ **Rota Oluşturma**: Seçilen semt, saat aralığı ve ilgi alanlarına göre LLM (Llama 3.3 70B, Groq API) ile kişiselleştirilmiş rota; mekanlar veritabanından filtrelenir ve öncelikli yere uzaklığa göre sıralanır
- 📍 **Yerler Keşfi**: İlgilendiğiniz yerleri bulma ve filtreleme
- ✅ **Gezilen / Gidilecek Listeleri**: Mekanları gezildi veya gidilecek olarak işaretleme
- 👤 **Profil Yönetimi**: Kişisel profil oluşturma ve düzenleme
- 📱 **Responsive Tasarım**: Tailwind CSS ile modern UI

## 🛠️ Teknoloji Stack

- **Framework**: [Next.js 16](https://nextjs.org) - React 19 ile
- **Veritabanı & Auth**: [Supabase](https://supabase.com)
- **Rota Üretimi**: Groq API (Llama 3.3 70B)
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
GROQ_API_KEY=your_groq_api_key   # rota oluşturma için (console.groq.com)
```

4. **Veritabanını hazırlayın**

Supabase panelinde **SQL Editor**'ı açıp [`supabase/schema.sql`](supabase/schema.sql) dosyasını çalıştırın. Bu dosya `profiles` ve `places` tablolarını, yeni kullanıcılar için otomatik profil oluşturan tetikleyiciyi ve RLS kurallarını oluşturur. Ardından `places` tablosuna mekan verisi ekleyin.

5. **Geliştirme sunucusunu başlatın**
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
└── middleware.ts             # İstek middleware'i

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
- [ ] Favori rotalar
- [ ] Mobil uygulama

## 🤝 Katkıda Bulunma

Bu proje halen geliştirme aşamasındadır. Geliştirmeleri sırasında düşünceleriniz ve tavsiyeleri değerlidir.

## 📄 Lisans

MIT
