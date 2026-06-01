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

export async function POST(req: NextRequest) {
  try {
    const { bolgeler, bolgeAdi, sure, tarih, gunAdi, ilgiler, vibe, gezilenleriDahilEt, oncelikliYer, asamasi, secimContext } =
      await req.json();

    if (!bolgeler?.length || !sure) {
      return NextResponse.json({ error: "Semt ve sure gerekli" }, { status: 400 });
    }

    const supabase = await createClient();

    let gezilenYerler: string[] = [];
    let gidilecekYerler: string[] = [];
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("gezilen_yerler, gidilecek_yerler")
        .eq("id", user.id)
        .single();
      if (profile) {
        gezilenYerler = profile.gezilen_yerler || [];
        gidilecekYerler = profile.gidilecek_yerler || [];
      }
    }

    const { data: tumPlaces, error: dbError } = await supabase
      .from("places")
      .select("name, category, description, duration_minutes, tags, lat, lng, district")
      .limit(100);

    if (dbError || !tumPlaces || tumPlaces.length === 0) {
      return NextResponse.json({ error: "Mekan bulunamadi" }, { status: 404 });
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
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: altPrompt }],
          temperature: 0.5,
          max_tokens: 500,
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
Gezi tarihi: ${gunAdi || tarih || "belirtilmedi"}
Semtler: ${bolgeAdi || bolgeler.join(", ")}
Kullanicinin vibe tercihleri: ${vibe || "genel"}
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
      return NextResponse.json({ error: "API yapilandirma hatasi" }, { status: 500 });
    }

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!groqRes.ok) {
      const errData = await groqRes.json();
      console.error("Groq hatasi:", JSON.stringify(errData));
      return NextResponse.json({ error: "AI servisi su an kullanilamiyor" }, { status: 503 });
    }

    const groqData = await groqRes.json();
    const text = groqData.choices?.[0]?.message?.content;

    if (!text) {
      return NextResponse.json({ error: "Rota olusturulamadi" }, { status: 500 });
    }

    const jsonText = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const rota = JSON.parse(jsonText);

    return NextResponse.json(rota);
  } catch (err) {
    console.error("Rota olusturma hatasi:", err);
    return NextResponse.json({ error: "Beklenmedik bir hata olustu" }, { status: 500 });
  }
}
