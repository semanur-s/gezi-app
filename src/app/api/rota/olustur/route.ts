import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function mesafe(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// WMO hava kodu → Türkçe açıklama
function havaKoduAciklama(kod: number): { aciklama: string; emoji: string; kotuHava: boolean } {
  if (kod === 0) return { aciklama: "açık ve güneşli", emoji: "☀️", kotuHava: false };
  if (kod <= 2) return { aciklama: "az bulutlu", emoji: "🌤️", kotuHava: false };
  if (kod === 3) return { aciklama: "kapalı", emoji: "☁️", kotuHava: false };
  if (kod <= 48) return { aciklama: "sisli", emoji: "🌫️", kotuHava: false };
  if (kod <= 57) return { aciklama: "çiseleyen yağmur", emoji: "🌦️", kotuHava: true };
  if (kod <= 67) return { aciklama: "yağmurlu", emoji: "🌧️", kotuHava: true };
  if (kod <= 77) return { aciklama: "karlı", emoji: "❄️", kotuHava: true };
  if (kod <= 82) return { aciklama: "sağanak yağışlı", emoji: "🌧️", kotuHava: true };
  if (kod <= 86) return { aciklama: "kar sağanağı", emoji: "🌨️", kotuHava: true };
  return { aciklama: "fırtınalı", emoji: "⛈️", kotuHava: true };
}

// Open-Meteo (ücretsiz, anahtar gerektirmez) — İstanbul için günlük tahmin
async function havaDurumu(tarih: string) {
  if (!tarih) return null;
  try {
    const gun = new Date(tarih + "T00:00:00");
    const bugun = new Date();
    bugun.setHours(0, 0, 0, 0);
    const farkGun = Math.round((gun.getTime() - bugun.getTime()) / 86400000);
    if (isNaN(farkGun) || farkGun < 0 || farkGun > 15) return null;

    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=41.01&longitude=28.97` +
      `&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
      `&timezone=Europe%2FIstanbul&start_date=${tarih}&end_date=${tarih}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;

    const d = await res.json();
    const kod = d.daily?.weathercode?.[0];
    if (kod === undefined || kod === null) return null;

    const { aciklama, emoji, kotuHava } = havaKoduAciklama(kod);
    const yagisOlasilik = d.daily.precipitation_probability_max?.[0] ?? 0;
    return {
      aciklama,
      emoji,
      sicaklikMax: Math.round(d.daily.temperature_2m_max?.[0] ?? 0),
      sicaklikMin: Math.round(d.daily.temperature_2m_min?.[0] ?? 0),
      yagisOlasilik,
      icMekanOnerilir: kotuHava || yagisOlasilik >= 50,
    };
  } catch {
    return null;
  }
}

// Basit bellek-içi sayaç (10 dk pencere). Sunucusuz ortamda örnek başına çalışır;
// trafik büyürse Upstash Redis gibi paylaşımlı bir depoya taşınmalı.
const HIZ_PENCERESI_MS = 10 * 60 * 1000;
const hizSayaclari = new Map<string, { sayi: number; bitis: number }>();

function hizSiniriGecti(anahtar: string, limit: number) {
  const simdi = Date.now();
  if (hizSayaclari.size > 5000) {
    for (const [k, v] of hizSayaclari) if (v.bitis < simdi) hizSayaclari.delete(k);
  }
  const kayit = hizSayaclari.get(anahtar);
  if (!kayit || kayit.bitis < simdi) {
    hizSayaclari.set(anahtar, { sayi: 1, bitis: simdi + HIZ_PENCERESI_MS });
    return true;
  }
  kayit.sayi++;
  return kayit.sayi <= limit;
}

export async function POST(req: NextRequest) {
  try {
    const { bolgeler, bolgeAdi, sure, tarih, gunAdi, ilgiler, vibe, gezilenleriDahilEt, oncelikliYer, asamasi, secimContext } =
      await req.json();

    if (!bolgeler?.length || !sure) {
      return NextResponse.json({ error: "Semt ve süre gerekli" }, { status: 400 });
    }

    const supabase = await createClient();

    let gezilenYerler: string[] = [];
    let gidilecekYerler: string[] = [];
    let favoriEtiketler: string[] = [];
    const { data: { user } } = await supabase.auth.getUser();

    // AI çağrıları ücretli/kotalı olduğu için kötüye kullanıma karşı hız sınırı
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "bilinmiyor";
    if (!hizSiniriGecti(user ? `u:${user.id}` : `ip:${ip}`, user ? 20 : 5)) {
      return NextResponse.json(
        { error: "Çok fazla rota isteği gönderdin, birkaç dakika sonra tekrar dene." },
        { status: 429 }
      );
    }

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("gezilen_yerler, gidilecek_yerler, ilgi_puanlari")
        .eq("id", user.id)
        .single();
      if (profile) {
        gezilenYerler = profile.gezilen_yerler || [];
        gidilecekYerler = profile.gidilecek_yerler || [];
        // Gezi sonu anketlerinden biriken ilgi puanlarının en yüksek 3 etiketi
        const ilgiPuanlari: Record<string, number> = profile.ilgi_puanlari || {};
        favoriEtiketler = Object.entries(ilgiPuanlari)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([etiket]) => etiket);
      }
    }

    const { data: tumPlaces, error: dbError } = await supabase
      .from("places")
      .select("name, category, description, duration_minutes, tags, lat, lng, district")
      .limit(100);

    if (dbError || !tumPlaces || tumPlaces.length === 0) {
      return NextResponse.json({ error: "Mekân bulunamadı" }, { status: 404 });
    }

    let bolgePlaces = tumPlaces.filter((p) => bolgeler.includes(p.district));
    let oncelikliYerData: typeof tumPlaces[0] | null = null;

    if (oncelikliYer) {
      oncelikliYerData = tumPlaces.find((p) => p.name === oncelikliYer) ?? null;
      if (oncelikliYerData && !bolgeler.includes(oncelikliYerData.district)) {
        bolgePlaces = tumPlaces.filter(
          (p) => bolgeler.includes(p.district) || p.district === oncelikliYerData!.district
        );
      }
    }

    let seciliMekanlar = bolgePlaces.length > 0 ? bolgePlaces : tumPlaces.filter((p) => bolgeler.includes(p.district));

    if (!gezilenleriDahilEt) {
      seciliMekanlar = seciliMekanlar.filter((p) => !gezilenYerler.includes(p.name));
    }

    if (ilgiler && ilgiler.length > 0) {
      const eslesen = seciliMekanlar.filter((p) => p.tags.some((tag: string) => ilgiler.includes(tag)));
      if (eslesen.length >= 3) seciliMekanlar = eslesen;
    }

    seciliMekanlar.sort((a, b) => {
      const aOnce = a.name === oncelikliYer || gidilecekYerler.includes(a.name) ? -1 : 0;
      const bOnce = b.name === oncelikliYer || gidilecekYerler.includes(b.name) ? -1 : 0;
      return aOnce - bOnce;
    });

    if (oncelikliYerData?.lat && oncelikliYerData?.lng) {
      const merkez = { lat: oncelikliYerData.lat, lng: oncelikliYerData.lng };
      seciliMekanlar.sort((a, b) => {
        if (a.name === oncelikliYer) return -1;
        if (b.name === oncelikliYer) return 1;
        const dA = (a.lat && a.lng) ? mesafe(merkez.lat, merkez.lng, a.lat, a.lng) : 999;
        const dB = (b.lat && b.lng) ? mesafe(merkez.lat, merkez.lng, b.lat, b.lng) : 999;
        return dA - dB;
      });
    }

    const oncelikliLabel = oncelikliYer ? `\n ONCELIKLI: "${oncelikliYer}" MUTLAKA rotaya dahil et.` : "";
    const gidilecekLabel = gidilecekYerler.filter((g) => seciliMekanlar.some((p) => p.name === g)).join(", ");
    const gezilenLabel = gezilenYerler.length > 0 && !gezilenleriDahilEt
      ? `\nKullanici bu yerleri zaten gezdi, mumkunse tekrar secme: ${gezilenYerler.join(", ")}`
      : "";

    const mekanListesi = seciliMekanlar
      .slice(0, 20)
      .map((p) => `- ${p.name} (${p.category}, ~${p.duration_minutes} dk, ${p.district}): ${p.description}`)
      .join("\n");

    // Alternatifler aşaması: sadece seçim soruları döndür
    if (asamasi === "alternatifler") {
      const altPrompt = `Sen bir Istanbul gezi uzmanisin. Asagidaki mekanlar listesinden, birbirine COGRAFIK olarak yakin ve benzer ozellikteki mekan ciftlerini belirle. Kullanici bu ciftlerden birini secebilir.

Semtler: ${bolgeAdi}
Vibe: ${vibe || "genel"}

Mevcut mekanlar:
${mekanListesi}

KURALLAR:
- Sadece gercekten yakin olan mekanlar (ayni semtte veya komsu semtte) karsilastir
- En fazla 2 soru sor, gercek bir secim sunacaksan sun, yoksa bos liste don
- Her soru bir cift mekan karsilastirmasi olmali (A vs B)
- Yeterince fark yoksa veya yakin mekan yoksa bos liste don: {"sorular": []}
- SADECE JSON don, baska hicbir sey yazma

JSON formati:
{"sorular": [{"soru": "Sultanahmet bolgesinde hangisini tercih edersin?", "a": {"ad": "Topkapi Sarayi", "desc": "Osmanli tarihi, deniz manzarasi"}, "b": {"ad": "Arkeoloji Muzesi", "desc": "Antik donem, binlerce eser"}}]}`;

      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) return NextResponse.json({ sorular: [] });

      const altRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          messages: [{ role: "user", content: altPrompt }],
          temperature: 0.5,
          max_tokens: 2500,
          reasoning_effort: "low",
        }),
      });

      if (!altRes.ok) return NextResponse.json({ sorular: [] });

      const altData = await altRes.json();
      const altText = altData.choices?.[0]?.message?.content ?? "{}";
      try {
        const parsed = JSON.parse(altText.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim());
        return NextResponse.json(parsed);
      } catch {
        return NextResponse.json({ sorular: [] });
      }
    }

    // Gezi günü hava durumu (tahmin aralığı dışındaysa null)
    const hava = await havaDurumu(tarih);
    const havaLabel = hava
      ? `\nHava durumu: ${hava.aciklama}, ${hava.sicaklikMin}-${hava.sicaklikMax}°C, yagis olasiligi %${hava.yagisOlasilik}.${
          hava.icMekanOnerilir
            ? " HAVA KOTU: rotayi IC MEKAN agirlikli kur (muze, carsi, kapali mekan); acik hava duraklari kisa tut, duraklar arasi yuruyusleri azalt."
            : " Hava uygun: acik hava mekanlari (park, sahil, sokak gezisi) rahatca kullanilabilir."
        }`
      : "";

    // Toplam dakika hesapla
    let toplamDkStr = "";
    try {
      const [startStr, endStr] = sure.split(" - ");
      const [sh, sm] = startStr.trim().split(":").map(Number);
      const [eh, em] = endStr.trim().split(":").map(Number);
      const toplamDk = (eh * 60 + em) - (sh * 60 + sm);
      const saatKismi = Math.floor(toplamDk / 60);
      const dakikaKismi = toplamDk % 60;
      toplamDkStr = `${toplamDk} dakika (${saatKismi > 0 ? saatKismi + " saat" : ""}${dakikaKismi > 0 ? " " + dakikaKismi + " dakika" : ""})`.trim();
    } catch {
      toplamDkStr = sure;
    }

    const prompt = `Sen bir Istanbul gezi uzmanisin. Asagidaki bilgilere gore TAMAMEN kisisellestirilmis, gercekci bir gezi rotasi olustur.${oncelikliLabel}

Zaman araligi: ${sure}
Toplam sure: ${toplamDkStr} — TUM ZAMANI KULLAN, kisalt
Gezi tarihi: ${gunAdi || tarih || "belirtilmedi"}${havaLabel}
Semtler: ${bolgeAdi || bolgeler.join(", ")}
Kullanicinin vibe tercihleri: ${vibe || "genel"}${favoriEtiketler.length > 0 ? `\nKullanicinin gecmis gezilerinden ogrenilen favori temalari: ${favoriEtiketler.join(", ")} — mekan secerken bu temalara agirlik ver.` : ""}
${gidilecekLabel ? `Oncelikli gidilecek yerler: ${gidilecekLabel}` : ""}${gezilenLabel}
${secimContext ? `Kullanicinin tercih ettigi mekanlar (MUTLAKA rotaya dahil et): ${secimContext}` : ""}

Mevcut mekanlar (SADECE bunlardan sec):
${mekanListesi}

KURALLAR:
1. Toplam sure tam olarak ${toplamDkStr} olmali — ne az ne fazla
2. 3 saatten uzun rotada MUTLAKA yemek molasi (45 dk) veya kahve molasi (20 dk) ekle
3. Her durak arasinda "ulasim" alani ekle: nasil gidilecegini yaz (yuruyus kac dakika, hangi tramvay/metro/vapur hatti)
4. Mola duraklari icin "mola: true" yaz
5. ONEMLI — Kapali mekan kontrolu: Gezi tarihi "${gunAdi || tarih}" gunu. Bu gune gore:
   - Pazartesi kapali olan muzeler (Topkapi, Arkeoloji Muzesi vb.) EKLEME
   - Sali kapali olan muzeler varsa EKLEME
   - Resmi tatil veya ozel kapanma durumlarinda o mekan yerine alternatif sec
   - Secilen mekandan birinin o gun kapali oldugunu biliyorsan, duraklar listesine EKLE, "ipucu" alanina "NOT: Bu mekan ${gunAdi || tarih} gunu kapali olabilir, ziyaret oncesi kontrol et" yaz
6. SADECE JSON don, baska hicbir sey yazma

JSON formati:
{
  "baslik": "Kisa, ilgi cekici Turkce baslik",
  "aciklama": "Rotayi anlatan 1 cumle",
  "duraklar": [
    {
      "sira": 1,
      "mekan": "Mekan adi (listeden birebir)",
      "sure": "XX dakika",
      "aciklama": "Bu mekanda ne yapilir, ne gorulur",
      "ipucu": "Pratik ziyaret ipucu",
      "ulasim": "Bir sonraki duraga: Yuruyus 8 dk VEYA Tramvay T1 Sultanahmet→Eminonu 5 dk",
      "mola": false
    },
    {
      "sira": 2,
      "mekan": "Ogle yemegi - [lokanta adi veya bolge]",
      "sure": "45 dakika",
      "aciklama": "Yerel lezzetler, oturup dinlenme",
      "ipucu": "Bolgenin unlu yemekleri",
      "ulasim": "Yuruyus 3 dk",
      "mola": true
    }
  ]
}`;

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API yapılandırma hatası" }, { status: 500 });
    }

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 6000,
        reasoning_effort: "low",
      }),
    });

    if (!groqRes.ok) {
      const errData = await groqRes.json();
      console.error("Groq hatasi:", JSON.stringify(errData));
      return NextResponse.json({ error: "AI servisi şu an kullanılamıyor" }, { status: 503 });
    }

    const groqData = await groqRes.json();
    const text = groqData.choices?.[0]?.message?.content;

    if (!text) {
      return NextResponse.json({ error: "Rota oluşturulamadı" }, { status: 500 });
    }

    const jsonText = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const rota = JSON.parse(jsonText);

    return NextResponse.json({ ...rota, hava });
  } catch (err) {
    console.error("Rota olusturma hatasi:", err);
    return NextResponse.json({ error: "Beklenmedik bir hata oluştu" }, { status: 500 });
  }
}
