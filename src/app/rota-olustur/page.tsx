"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { mesafeMetre } from "@/lib/etkilesim";
import {
  IconArrowLeft,
  IconMap2,
  IconRoute,
  IconMapPin,
  IconClock,
  IconBulb,
  IconSparkles,
  IconCheck,
  IconBookmarkFilled,
  IconWalk,
  IconCoffee,
  IconToolsKitchen2,
  IconX,
  IconShare,
} from "@tabler/icons-react";

const SEMTLER = [
  { label: "Taksim & İstiklal", district: "Beyoğlu" },
  { label: "Karaköy & Galata", district: "Beyoğlu" },
  { label: "Sultanahmet", district: "Fatih" },
  { label: "Balat & Fener", district: "Fatih" },
  { label: "Eminönü & Kapalıçarşı", district: "Fatih" },
  { label: "Beşiktaş", district: "Beşiktaş" },
  { label: "Ortaköy & Bebek", district: "Beşiktaş" },
  { label: "Kadıköy", district: "Kadıköy" },
  { label: "Moda & Fenerbahçe", district: "Kadıköy" },
  { label: "Üsküdar", district: "Üsküdar" },
  { label: "Çengelköy & Beylerbeyi", district: "Üsküdar" },
  { label: "Büyükada", district: "Adalar" },
];

const YAKIN_SEMTLER: Record<string, string[]> = {
  "Taksim & İstiklal": ["Karaköy & Galata", "Beşiktaş", "Ortaköy & Bebek"],
  "Karaköy & Galata": ["Taksim & İstiklal", "Eminönü & Kapalıçarşı", "Sultanahmet"],
  "Sultanahmet": ["Eminönü & Kapalıçarşı", "Karaköy & Galata", "Balat & Fener"],
  "Balat & Fener": ["Sultanahmet", "Eminönü & Kapalıçarşı"],
  "Eminönü & Kapalıçarşı": ["Sultanahmet", "Karaköy & Galata", "Balat & Fener"],
  "Beşiktaş": ["Taksim & İstiklal", "Ortaköy & Bebek"],
  "Ortaköy & Bebek": ["Beşiktaş", "Taksim & İstiklal"],
  "Kadıköy": ["Moda & Fenerbahçe", "Üsküdar"],
  "Moda & Fenerbahçe": ["Kadıköy", "Üsküdar"],
  "Üsküdar": ["Kadıköy", "Çengelköy & Beylerbeyi", "Moda & Fenerbahçe"],
  "Çengelköy & Beylerbeyi": ["Üsküdar", "Kadıköy"],
  "Büyükada": [],
};

const VIBE_SORULARI = [
  {
    id: "atmosfer",
    soru: "Nasıl bir atmosfer hayal ediyorsun?",
    a: { emoji: "🏛️", label: "Tarihi & Kültürel", desc: "Camiler, müzeler, tarihi sokaklar", ilgiler: ["tarihi", "sanat"] },
    b: { emoji: "✨", label: "Modern & Keşif", desc: "Kafeler, galeriler, sokak sanatı", ilgiler: ["sanat", "alışveriş"] },
  },
  {
    id: "oncelik",
    soru: "Önceliğin hangisi?",
    a: { emoji: "🍽️", label: "Yemek & Kafe", desc: "Lezzetler, kahve, yerel tatlar", ilgiler: ["yeme-içme"] },
    b: { emoji: "🗺️", label: "Gezi & Mekân", desc: "Manzaralar, müzeler, sokaklar", ilgiler: ["doğa", "fotoğraf"] },
  },
  {
    id: "tempo",
    soru: "Ne kadar hareketli olsun?",
    a: { emoji: "🌿", label: "Sakin & Rahat", desc: "Az yer, her birinde uzun vakit", ilgiler: [] },
    b: { emoji: "⚡", label: "Hareketli & Dolu", desc: "Çok yer, aktif tempo", ilgiler: [] },
  },
];

interface Durak {
  sira: number;
  mekan: string;
  sure: string;
  aciklama: string;
  ipucu?: string;
  ulasim?: string;
  mola?: boolean;
}

interface Rota {
  baslik: string;
  aciklama: string;
  duraklar: Durak[];
  hava?: {
    emoji: string;
    aciklama: string;
    sicaklikMin: number;
    sicaklikMax: number;
    yagisOlasilik: number;
  } | null;
}

interface AlternatifSoru {
  soru: string;
  a: { ad: string; desc: string };
  b: { ad: string; desc: string };
}

const MEKAN_GORSELLER: Record<string, string> = {
  "Galata Kulesi": "https://commons.wikimedia.org/wiki/Special:FilePath/Istanbul_asv2020-02_img48_Galata_Tower.jpg?width=480",
  "Topkapı Sarayı": "https://commons.wikimedia.org/wiki/Special:FilePath/Topkapi_Palace%2C_Istanbul_%2852115692887%29.jpg?width=480",
  "Ayasofya": "https://commons.wikimedia.org/wiki/Special:FilePath/Hagia_Sophia_and_its_faithful_tourists_%2824238189635%29.jpg?width=480",
  "Sultanahmet Camii": "https://commons.wikimedia.org/wiki/Special:FilePath/Sultan_Ahmed_Mosque_Birds_Eye.jpg?width=480",
  "Kapalıçarşı": "https://commons.wikimedia.org/wiki/Special:FilePath/Grand_Bazaar%2C_Kapali_Carsi%2C_interior%2C_Istanbul%2C_Turkey.jpg?width=480",
  "Kız Kulesi": "https://commons.wikimedia.org/wiki/Special:FilePath/K%C4%B1z_Kulesi_2024.jpg?width=480",
  "Dolmabahçe Sarayı": "https://commons.wikimedia.org/wiki/Special:FilePath/Dolmabahce_palace_retouched.jpg?width=480",
  "Mısır Çarşısı": "https://commons.wikimedia.org/wiki/Special:FilePath/Istanbul_Spice_Bazaar.jpg?width=480",
  "Büyükada": "https://commons.wikimedia.org/wiki/Special:FilePath/B%C3%BCy%C3%BCkada_-_panoramio.jpg?width=480",
  "Balat": "https://commons.wikimedia.org/wiki/Special:FilePath/Balat%2C_Istanbul_%282%29.jpg?width=480",
  "Ortaköy Camii": "https://commons.wikimedia.org/wiki/Special:FilePath/Ortakoy_mosque_in_Besiktas%2C_Istanbul%2C_Turkey.jpg?width=480",
  "Beylerbeyi Sarayı": "https://commons.wikimedia.org/wiki/Special:FilePath/Beylerbeyi_Palace_from_sea.jpg?width=480",
};

const MEKAN_OZEL_NOTLAR: Record<string, string> = {
  "Galata Kulesi": "🇹🇷 Türk vatandaşlarına ve TC kimlik kartı sahiplerine giriş ücretsizdir.",
  "Topkapı Sarayı": "Pazartesi günleri kapalıdır. Harem için ayrı bilet gerekmektedir.",
  "Ayasofya": "Günde 5 vakit namaz saatlerinde turist girişi geçici olarak durabilir.",
  "Boğazda Tekne Turu": "Sezonluk çalışır; sabah tur satın alımını önceden yapmak önerilir.",
  "Kız Kulesi": "Adaya gidiş için Salıpazarı iskelesinden ücretli vapur kalkar.",
  "Kapalıçarşı": "Pazar günleri kapalıdır.",
  "Arkeoloji Müzesi": "Pazartesi günleri kapalıdır. 18 yaş altı ve Türk vatandaşlarına ücretsizdir.",
};

const BEKLEME_MESAJLARI = [
  "Şehri senin gözünden geziyoruz...",
  "Duraklar arası en keyifli yollar seçiliyor...",
  "Çay molası için köşe başları kolaçan ediliyor...",
  "Manzarası güzel olanlar öne alınıyor...",
  "O gün kapalı olan kapılar listeden düşülüyor...",
  "Son rötuşlar: sıralama ve zamanlama...",
];

function YuklemeSahnesi() {
  const [mesaj, setMesaj] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setMesaj((m) => (m + 1) % BEKLEME_MESAJLARI.length), 2400);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="fixed inset-0 z-50 bg-navy-deep/95 backdrop-blur-md flex items-center justify-center px-6">
      <div className="w-full max-w-sm text-center anim-pop-in">
        {/* Kendini çizen rota — noktalı yol akar, duraklar nabız atar */}
        <svg viewBox="0 0 280 130" className="w-full max-w-[280px] mx-auto mb-8" fill="none">
          <path
            className="rota-cizgi"
            d="M18 104 C 60 104, 60 40, 118 44 C 168 48, 150 100, 200 96 C 240 92, 250 50, 262 34"
            stroke="#f4512c"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle className="durak-noktasi" cx="18" cy="104" r="7" fill="#f4512c" />
          <circle cx="18" cy="104" r="3" fill="#fff" />
          <circle className="durak-noktasi" cx="118" cy="44" r="7" fill="#3c6a9e" style={{ animationDelay: "-0.6s" }} />
          <circle cx="118" cy="44" r="3" fill="#fff" />
          <circle className="durak-noktasi" cx="200" cy="96" r="7" fill="#f4512c" style={{ animationDelay: "-1.2s" }} />
          <circle cx="200" cy="96" r="3" fill="#fff" />
          {/* Hedef bayrağı */}
          <circle className="durak-noktasi" cx="262" cy="34" r="9" fill="#fff" style={{ animationDelay: "-0.3s" }} />
          <text x="262" y="39" textAnchor="middle" fontSize="11">🏁</text>
        </svg>

        <p className="font-display text-xl font-bold text-white mb-2">Rotan hazırlanıyor</p>

        {/* Dönen mesaj — her seferinde tazelenen tek satır */}
        <p key={mesaj} className="anim-mesaj text-sm text-white/65 h-6">
          {BEKLEME_MESAJLARI[mesaj]}
        </p>

        <div className="mt-8 flex items-center justify-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-coral flex items-center justify-center">
            <IconMap2 size={13} color="white" />
          </div>
          <span className="text-xs font-semibold text-white/80">
            Gezi <span className="text-coral">App</span>
          </span>
        </div>
      </div>
    </div>
  );
}

function RotaOlusturInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const oncelikliYerParam = searchParams.get("yer") || "";

  const [selectedSemtler, setSelectedSemtler] = useState<string[]>([]);
  const [tarih, setTarih] = useState("");
  const [baslangic, setBaslangic] = useState("");
  const [bitis, setBitis] = useState("");
  const [vibeSecim, setVibeSecim] = useState<Record<string, string>>({});
  const [gezilenleriDahilEt, setGezilenleriDahilEt] = useState(false);
  const [gidilecekYerler, setGidilecekYerler] = useState<string[]>([]);
  const [gezilenYerler, setGezilenYerler] = useState<string[]>([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [rota, setRota] = useState<Rota | null>(null);
  const [hata, setHata] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [placesMap, setPlacesMap] = useState<Record<string, { description: string; category: string; tags: string[]; duration_minutes: number; lat: number | null; lng: number | null }>>({});
  const [acikDurak, setAcikDurak] = useState<Durak | null>(null);
  const [asamasi, setAsamasi] = useState<"form" | "secim">("form");
  const [alternatifler, setAlternatifler] = useState<AlternatifSoru[]>([]);
  const [secimler, setSecimler] = useState<Record<number, "a" | "b">>({});
  const [paylasDurum, setPaylasDurum] = useState<"yok" | "kaydediliyor" | "paylasildi">("yok");
  const [kayitliRotaId, setKayitliRotaId] = useState<string | null>(null);
  const [anketAcik, setAnketAcik] = useState(false);
  const [anketTamam, setAnketTamam] = useState(false);
  const [wikiGorsel, setWikiGorsel] = useState<Record<string, string | null>>({});

  useEffect(() => {
    const supabase = createClient();
    async function fetchUserPrefs() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data: profile } = await supabase
        .from("profiles")
        .select("gezilen_yerler, gidilecek_yerler")
        .eq("id", user.id)
        .single();
      if (profile) {
        setGidilecekYerler(profile.gidilecek_yerler || []);
        setGezilenYerler(profile.gezilen_yerler || []);
      }
    }
    async function fetchPlaces() {
      const { data } = await supabase
        .from("places")
        .select("name, description, category, tags, duration_minutes, lat, lng");
      if (data) {
        const m: Record<string, typeof data[0]> = {};
        data.forEach((p) => { m[p.name] = p; });
        setPlacesMap(m);
      }
    }
    fetchUserPrefs();
    fetchPlaces();
  }, []);

  // Mekan görseli elle eklenmemişse Türkçe Wikipedia'dan otomatik çek
  useEffect(() => {
    const ad = acikDurak?.mekan;
    if (!ad || MEKAN_GORSELLER[ad] || wikiGorsel[ad] !== undefined) return;
    fetch(
      `https://tr.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(ad)}&prop=pageimages&format=json&pithumbsize=640&redirects=1&origin=*`
    )
      .then((r) => r.json())
      .then((d) => {
        const sayfalar = d?.query?.pages || {};
        const ilk = Object.values(sayfalar)[0] as { thumbnail?: { source?: string } } | undefined;
        setWikiGorsel((prev) => ({ ...prev, [ad]: ilk?.thumbnail?.source || null }));
      })
      .catch(() => setWikiGorsel((prev) => ({ ...prev, [ad]: null })));
  }, [acikDurak, wikiGorsel]);

  function toggleSemt(label: string) {
    setSelectedSemtler((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  }

  function selectVibe(soruId: string, secenek: "a" | "b") {
    setVibeSecim((prev) => ({ ...prev, [soruId]: secenek }));
  }

  async function toggleGezdim(mekanAdi: string) {
    if (!userId) { router.push("/giris"); return; }
    const supabase = createClient();
    const zatenGezilmis = gezilenYerler.includes(mekanAdi);
    const yeni = zatenGezilmis
      ? gezilenYerler.filter((n) => n !== mekanAdi)
      : [...gezilenYerler, mekanAdi];
    setGezilenYerler(yeni);

    if (zatenGezilmis) {
      await supabase.from("profiles").update({ gezilen_yerler: yeni }).eq("id", userId);
      return;
    }

    // Puan: konum gerçekten mekanın yakınındaysa (600 m) mekan süresi kadar,
    // konum yoksa/uzaktaysa küçük katılım puanı
    const place = placesMap[mekanAdi];
    let kazanilan = 10;
    let dogrulandi = false;
    if (place?.lat && place?.lng && typeof navigator !== "undefined" && navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000, maximumAge: 60000 })
        );
        if (mesafeMetre(pos.coords.latitude, pos.coords.longitude, place.lat, place.lng) < 600) {
          kazanilan = place.duration_minutes || 30;
          dogrulandi = true;
        }
      } catch { /* konum izni verilmediyse katılım puanıyla devam */ }
    }

    const { data: p } = await supabase
      .from("profiles")
      .select("puan, toplam_gezi_dk")
      .eq("id", userId)
      .single();
    await supabase
      .from("profiles")
      .update({
        gezilen_yerler: yeni,
        puan: (p?.puan || 0) + kazanilan,
        toplam_gezi_dk: (p?.toplam_gezi_dk || 0) + (dogrulandi ? place?.duration_minutes || 0 : 0),
      })
      .eq("id", userId);
  }

  // Oluşturulan her rota giriş yapmış kullanıcının profiline GİZLİ olarak kaydedilir;
  // akışta ancak "Rotayı Paylaş" ile herkese açılır.
  async function rotayiOtomatikKaydet(yeniRota: Rota) {
    if (!userId) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("routes")
      .insert({
        user_id: userId,
        baslik: yeniRota.baslik,
        aciklama: yeniRota.aciklama,
        duraklar: yeniRota.duraklar,
        bolgeler: selectedSemtler,
        tarih: tarih || null,
        hava: yeniRota.hava ?? null,
        herkese_acik: false,
      })
      .select("id")
      .single();
    setKayitliRotaId(data?.id ?? null);
  }

  async function rotayiPaylas() {
    if (!rota) return;
    if (!userId) { router.push("/giris"); return; }
    setPaylasDurum("kaydediliyor");
    const supabase = createClient();
    const icerik = {
      baslik: rota.baslik,
      aciklama: rota.aciklama,
      duraklar: rota.duraklar,
      herkese_acik: true,
    };
    const { error } = kayitliRotaId
      ? await supabase.from("routes").update(icerik).eq("id", kayitliRotaId)
      : await supabase.from("routes").insert({
          ...icerik,
          user_id: userId,
          bolgeler: selectedSemtler,
          tarih: tarih || null,
          hava: rota.hava ?? null,
        });
    if (error) {
      setPaylasDurum("yok");
      setHata("Rota paylaşılamadı, tekrar dene.");
    } else {
      setPaylasDurum("paylasildi");
    }
  }

  async function anketCevapla(mekan: string) {
    setAnketAcik(false);
    setAnketTamam(true);
    if (!userId) return;
    const supabase = createClient();
    const tags = placesMap[mekan]?.tags || [];
    const { data: p } = await supabase
      .from("profiles")
      .select("ilgi_puanlari, puan")
      .eq("id", userId)
      .single();
    const ilgi: Record<string, number> = { ...((p?.ilgi_puanlari as Record<string, number>) || {}) };
    tags.forEach((t) => { ilgi[t] = (ilgi[t] || 0) + 1; });
    await supabase
      .from("profiles")
      .update({ ilgi_puanlari: ilgi, puan: (p?.puan || 0) + 50 })
      .eq("id", userId);
  }

  function durakAtla(sira: number) {
    if (!rota) return;
    setRota({ ...rota, duraklar: rota.duraklar.filter((d) => d.sira !== sira) });
  }

  function buildParams() {
    return {
      bolgeler: [...new Set(selectedSemtler.map((l) => SEMTLER.find((s) => s.label === l)!.district))],
      bolgeAdi: selectedSemtler.join(", "),
      sure: `${baslangic} - ${bitis}`,
      tarih,
      gunAdi: tarih ? new Date(tarih).toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" }) : "",
      ilgiler: [...new Set(VIBE_SORULARI.flatMap((s) => {
        const sec = vibeSecim[s.id];
        return sec === "a" ? s.a.ilgiler : sec === "b" ? s.b.ilgiler : [];
      }))],
      vibe: [
        vibeSecim.atmosfer === "a" ? "tarihi ve kültürel atmosfer" : "modern ve keşif odaklı atmosfer",
        vibeSecim.oncelik === "a" ? "yeme-içme öncelikli" : "gezi ve mekânlar öncelikli",
        vibeSecim.tempo === "a" ? "sakin tempo - az yer, her birinde uzun vakit" : "hareketli tempo - çok yer, aktif program",
      ].join("; "),
      gezilenleriDahilEt,
      oncelikliYer: oncelikliYerParam || null,
    };
  }

  async function rotaOlustur() {
    setHata("");
    setYukleniyor(true);
    setRota(null);
    setAsamasi("form");

    try {
      const res = await fetch("/api/rota/olustur", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...buildParams(), asamasi: "alternatifler" }),
      });

      const data = await res.json();

      if (!res.ok) {
        setHata(data.error || "Rota oluşturulamadı, tekrar dene.");
      } else if (data.sorular?.length) {
        setAlternatifler(data.sorular);
        setSecimler({});
        setAsamasi("secim");
      } else {
        setRota(data);
        setKayitliRotaId(null);
        setPaylasDurum("yok");
        rotayiOtomatikKaydet(data);
      }
    } catch {
      setHata("Bağlantı hatası, tekrar dene.");
    } finally {
      setYukleniyor(false);
    }
  }

  async function rotaFinalOlustur() {
    setHata("");
    setYukleniyor(true);

    const secimContext = alternatifler
      .map((alt, i) => {
        const sec = secimler[i];
        if (!sec) return null;
        return `"${alt.soru}" → ${sec === "a" ? alt.a.ad : alt.b.ad}`;
      })
      .filter(Boolean)
      .join("; ");

    try {
      const res = await fetch("/api/rota/olustur", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...buildParams(), asamasi: "rota", secimContext }),
      });

      const data = await res.json();

      if (!res.ok) {
        setHata(data.error || "Rota oluşturulamadı, tekrar dene.");
      } else {
        setRota(data);
        setAsamasi("form");
        setKayitliRotaId(null);
        setPaylasDurum("yok");
        rotayiOtomatikKaydet(data);
      }
    } catch {
      setHata("Bağlantı hatası, tekrar dene.");
    } finally {
      setYukleniyor(false);
    }
  }

  const vibeHazir = VIBE_SORULARI.every((s) => vibeSecim[s.id]);
  const hazir = selectedSemtler.length > 0 && tarih !== "" && baslangic !== "" && bitis !== "" && bitis > baslangic && vibeHazir;

  return (
    <div className="min-h-screen bg-navy-tint">
      {/* Topbar */}
      <header className="border-b border-white/10 sticky top-0 bg-navy/90 backdrop-blur-md z-20"><div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-3.5">
        <Link href="/" className="text-white/70 hover:text-white transition-colors">
          <IconArrowLeft size={20} />
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-coral flex items-center justify-center">
            <IconMap2 size={14} color="white" />
          </div>
          <span className="font-brand text-base text-white">
            Gezi <span className="text-coral">App</span>
          </span>
        </div>
        <div className="w-5" />
      </div></header>

      {/* Sahneli yükleme animasyonu */}
      {yukleniyor && <YuklemeSahnesi />}

      {!rota && asamasi === "secim" ? (
        /* Seçim ekranı — adım 2 */
        <div className="mx-auto w-full max-w-3xl px-5 pt-6 pb-10">
          <div className="mb-5">
            <p className="text-[11px] font-semibold text-coral mb-1">Adım 2 / 2</p>
            <h1 className="font-display text-xl font-bold text-navy">Sen Seç, AI Uygulasın</h1>
            <p className="text-xs text-gray-400 mt-1">Birbirine yakın bu yerlerden hangisini tercih ettiğini söyle.</p>
          </div>

          <div className="flex flex-col gap-5 mb-6">
            {alternatifler.map((alt, i) => (
              <div key={i}>
                <p className="text-xs font-medium text-gray-700 mb-2.5">{alt.soru}</p>
                <div className="grid grid-cols-2 gap-2">
                  {(["a", "b"] as const).map((sec) => {
                    const opt = alt[sec];
                    const selected = secimler[i] === sec;
                    return (
                      <button
                        key={sec}
                        onClick={() => setSecimler((prev) => ({ ...prev, [i]: sec }))}
                        className={`anim-secim p-3.5 rounded-xl border text-left transition-all ${
                          selected ? "bg-coral border-coral" : "border-gray-200 bg-white hover:border-coral"
                        }`}
                      >
                        <p className={`text-xs font-semibold leading-tight ${selected ? "text-white" : "text-gray-800"}`}>{opt.ad}</p>
                        <p className={`text-[10px] mt-1 leading-tight ${selected ? "text-orange-100" : "text-gray-400"}`}>{opt.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {hata && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 mb-4">
              {hata}
            </p>
          )}

          <button
            onClick={rotaFinalOlustur}
            disabled={alternatifler.some((_, i) => !secimler[i]) || yukleniyor}
            className="w-full bg-coral hover:bg-coral-dark disabled:opacity-40 text-white rounded-full py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            {yukleniyor ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Rota hazırlanıyor...
              </>
            ) : (
              <>
                <IconSparkles size={16} />
                Rotayı Oluştur
              </>
            )}
          </button>
          <button
            onClick={() => setAsamasi("form")}
            className="w-full mt-2 text-center text-xs text-gray-400 py-2 hover:text-gray-600 transition-colors"
          >
            ← Formu değiştir
          </button>
        </div>
      ) : !rota ? (
        <div className="mx-auto w-full max-w-3xl px-5 pt-6 pb-10">
          {/* Başlık */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-1">
              <IconRoute size={18} className="text-coral" />
              <h1 className="font-display text-xl font-bold text-navy">Rota Oluştur</h1>
            </div>
            <p className="text-xs text-gray-400">Sana özel İstanbul rotanı yapay zeka oluştursun.</p>
          </div>

          {/* Öncelikli yer */}
          {oncelikliYerParam && (
            <div className="mb-5 flex items-center gap-2 bg-coral-tint border border-coral-line rounded-xl px-4 py-2.5">
              <IconBookmarkFilled size={14} className="text-coral flex-shrink-0" />
              <p className="text-xs text-coral-deep">
                <span className="font-medium">{oncelikliYerParam}</span> rotaya dahil edilecek
              </p>
            </div>
          )}

          {/* Gidilecek yerler */}
          {gidilecekYerler.length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-medium text-gray-600 mb-2">Listendeki yerler öncelikli dahil edilir</p>
              <div className="flex flex-wrap gap-1.5">
                {gidilecekYerler.map((yer) => (
                  <span key={yer} className="inline-flex items-center gap-1 text-[11px] bg-coral-tint text-coral-deep border border-coral-line px-2.5 py-1 rounded-full">
                    <IconBookmarkFilled size={10} />
                    {yer}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Semt */}
          <div className="mb-5">
            <p className="text-xs font-medium text-gray-600 mb-1">Hangi semtler?</p>
            <p className="text-[11px] text-gray-400 mb-2.5">Birden fazla seçebilirsin.</p>
            <div className="flex flex-wrap gap-2">
              {(() => {
                const yakinSet = new Set(
                  selectedSemtler.flatMap((l) => YAKIN_SEMTLER[l] || [])
                );
                const sorted = [...SEMTLER].sort((a, b) => {
                  const aSeçili = selectedSemtler.includes(a.label);
                  const bSeçili = selectedSemtler.includes(b.label);
                  if (aSeçili && !bSeçili) return -1;
                  if (!aSeçili && bSeçili) return 1;
                  const aYakin = yakinSet.has(a.label) && !aSeçili;
                  const bYakin = yakinSet.has(b.label) && !bSeçili;
                  if (aYakin && !bYakin) return -1;
                  if (!aYakin && bYakin) return 1;
                  return 0;
                });
                return sorted.map((s) => {
                  const secili = selectedSemtler.includes(s.label);
                  const yakin = yakinSet.has(s.label) && !secili && selectedSemtler.length > 0;
                  return (
                    <button
                      key={s.label}
                      onClick={() => toggleSemt(s.label)}
                      className={`anim-secim px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1 ${
                        secili
                          ? "bg-coral border-coral text-white"
                          : yakin
                          ? "border-coral text-coral bg-coral-tint"
                          : "border-gray-200 bg-white text-gray-600 hover:border-coral hover:text-coral"
                      }`}
                    >
                      {secili && <IconCheck size={10} strokeWidth={3} />}
                      {s.label}
                      {yakin && <span className="text-[9px] font-bold opacity-70">yakın</span>}
                    </button>
                  );
                });
              })()}
            </div>
          </div>

          {/* Tarih & Saat aralığı */}
          <div className="mb-5">
            <p className="text-xs font-medium text-gray-600 mb-1">Ne zaman gidiyorsun?</p>
            <p className="text-[11px] text-navy-soft mb-2.5">
              🌤️ Tarihini seç — o günün hava durumuna senin için bakacağız, yağmur varsa iç mekan ağırlıklı planlarız.
            </p>
            {/* Tarih */}
            <input
              type="date"
              value={tarih}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setTarih(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 focus:outline-none focus:border-coral transition-colors mb-3"
            />
            {/* Saat aralığı */}
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <p className="text-[10px] text-gray-400 mb-1">Başlangıç</p>
                <input
                  type="time"
                  value={baslangic}
                  onChange={(e) => setBaslangic(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 focus:outline-none focus:border-coral transition-colors"
                />
              </div>
              <div className="text-gray-300 text-sm mt-4">→</div>
              <div className="flex-1">
                <p className="text-[10px] text-gray-400 mb-1">Bitiş</p>
                <input
                  type="time"
                  value={bitis}
                  onChange={(e) => setBitis(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 focus:outline-none focus:border-coral transition-colors"
                />
              </div>
            </div>
            {baslangic && bitis && bitis > baslangic && (
              <p className="text-[11px] text-coral mt-1.5">
                {(() => {
                  const [bh, bm] = baslangic.split(":").map(Number);
                  const [eh, em] = bitis.split(":").map(Number);
                  const dk = (eh * 60 + em) - (bh * 60 + bm);
                  const saat = Math.floor(dk / 60);
                  const kalan = dk % 60;
                  return saat > 0 && kalan > 0 ? `${saat} saat ${kalan} dakika` : saat > 0 ? `${saat} saat` : `${kalan} dakika`;
                })()} gezin
              </p>
            )}
            {baslangic && bitis && bitis <= baslangic && (
              <p className="text-[11px] text-red-400 mt-1.5">Bitiş saati başlangıçtan önce olamaz</p>
            )}
          </div>

          {/* Vibe seçimi */}
          <div className="mb-5">
            <p className="text-xs font-medium text-gray-600 mb-1">Nasıl bir gün hayal ediyorsun?</p>
            <p className="text-[11px] text-gray-400 mb-4">3 soruyu yanıtla, rotanı kişiselleştir.</p>
            <div className="flex flex-col gap-4">
              {VIBE_SORULARI.map((soru, idx) => (
                <div key={soru.id}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-4 h-4 rounded-full bg-gray-100 text-[10px] font-bold text-gray-500 flex items-center justify-center flex-shrink-0">{idx + 1}</span>
                    <p className="text-[11px] font-medium text-gray-600">{soru.soru}</p>
                    {vibeSecim[soru.id] && <span className="ml-auto text-[10px] text-green-500 font-medium">✓</span>}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {(["a", "b"] as const).map((sec) => {
                      const opt = soru[sec];
                      const selected = vibeSecim[soru.id] === sec;
                      return (
                        <button
                          key={sec}
                          onClick={() => selectVibe(soru.id, sec)}
                          className={`anim-secim p-3 rounded-xl border text-left transition-all ${
                            selected
                              ? "bg-coral border-coral"
                              : "border-gray-200 hover:border-coral bg-white"
                          }`}
                        >
                          <p className="text-lg mb-1">{opt.emoji}</p>
                          <p className={`text-xs font-semibold leading-tight ${
                            selected ? "text-white" : "text-gray-800"
                          }`}>{opt.label}</p>
                          <p className={`text-[10px] mt-0.5 leading-tight ${
                            selected ? "text-orange-100" : "text-gray-400"
                          }`}>{opt.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gezilenleri dahil et */}
          {gezilenYerler.length > 0 && (
            <button
              onClick={() => setGezilenleriDahilEt(!gezilenleriDahilEt)}
              className="mb-5 flex items-center gap-2.5 w-full"
            >
              <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                gezilenleriDahilEt ? "bg-coral border-coral" : "border-gray-300"
              }`}>
                {gezilenleriDahilEt && <IconCheck size={10} color="white" strokeWidth={3} />}
              </div>
              <span className="text-xs text-gray-600">Daha önce gezdiğim yerleri de dahil et</span>
            </button>
          )}

          {/* Hata */}
          {hata && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 mb-4">
              {hata}
            </p>
          )}

          {/* Buton */}
          <button
            onClick={rotaOlustur}
            disabled={!hazir || yukleniyor}
            className="w-full bg-coral hover:bg-coral-dark disabled:opacity-40 text-white rounded-full py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            {yukleniyor ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Rota hazırlanıyor...
              </>
            ) : (
              <>
                <IconSparkles size={16} />
                Rota Oluştur
              </>
            )}
          </button>

          {!hazir && (
            <p className="text-center text-[11px] text-gray-400 mt-2">
              Bölge ve süre seçmeyi unutma
            </p>
          )}
        </div>
      ) : (
        /* Rota sonucu */
        <div className="mx-auto w-full max-w-3xl pb-10">
          {/* Rota başlık kartı */}
          <div className="mx-5 mt-5 bg-navy rounded-2xl p-4 mb-5 anim-pop-in shadow-[0_12px_36px_rgba(11,31,56,0.35)]">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-coral flex items-center justify-center flex-shrink-0 mt-0.5 anim-nabiz">
                <IconRoute size={18} color="white" />
              </div>
              <div>
                <h2 className="font-display text-[15px] font-semibold text-white leading-snug">{rota.baslik}</h2>
                <p className="text-xs text-white/70 mt-1 leading-relaxed">{rota.aciklama}</p>
                {rota.hava && (
                  <p className="text-[11px] text-white/85 mt-2 inline-flex items-center gap-1 bg-white/10 border border-white/20 rounded-full px-2.5 py-1">
                    {rota.hava.emoji} {rota.hava.aciklama} · {rota.hava.sicaklikMin}°–{rota.hava.sicaklikMax}°C
                    {rota.hava.yagisOlasilik >= 30 ? ` · %${rota.hava.yagisOlasilik} yağış ihtimali` : ""}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Duraklar */}
          <div className="px-5">
            <p className="text-xs font-medium text-gray-500 mb-3 flex items-center gap-1.5">
              <IconMapPin size={13} className="text-coral" />
              {rota.duraklar.length} durak
            </p>

            <div className="flex flex-col gap-3">
              {rota.duraklar.map((durak, idx) => (
                <div key={durak.sira} className="anim-fade-up" style={{ animationDelay: `${idx * 90}ms` }}>
                  <div className="flex gap-3">
                    {/* Zaman çizgisi */}
                    <div className="flex flex-col items-center">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0 ${
                        durak.mola ? "bg-amber-400" : "bg-navy"
                      }`}>
                        {durak.mola
                          ? durak.mekan.toLowerCase().includes("kahve") || durak.mekan.toLowerCase().includes("kafe")
                            ? <IconCoffee size={13} />
                            : <IconToolsKitchen2 size={13} />
                          : durak.sira}
                      </div>
                      {idx < rota.duraklar.length - 1 && (
                        <div className="w-px flex-1 bg-navy-line mt-1 min-h-[24px]" />
                      )}
                    </div>

                    {/* İçerik */}
                    <div className="flex-1 pb-1">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <button
                          onClick={() => !durak.mola && setAcikDurak(durak)}
                          className={`text-sm font-medium text-left ${
                            durak.mola ? "text-amber-700 cursor-default" : "text-gray-900 hover:text-coral"
                          }`}
                        >
                          {durak.mekan}
                          {!durak.mola && (
                            <span className="ml-1 text-[10px] text-gray-300 font-normal align-middle">↗</span>
                          )}
                        </button>
                        <span className="flex items-center gap-1.5 text-[11px] text-gray-400 whitespace-nowrap flex-shrink-0 mt-0.5">
                          <IconClock size={11} />
                          {durak.sure}
                          {!durak.mola && rota.duraklar.length > 2 && (
                            <button
                              onClick={() => durakAtla(durak.sira)}
                              title="Bu durağı atla, süren diğerlerine kalsın"
                              className="text-[10px] text-gray-300 hover:text-coral transition-colors"
                            >
                              Atla
                            </button>
                          )}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed mb-1.5">{durak.aciklama}</p>
                      {durak.ipucu && (
                        <div className="flex items-start gap-1.5 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5 mb-2">
                          <IconBulb size={11} className="text-amber-500 flex-shrink-0 mt-0.5" />
                          <p className="text-[11px] text-amber-700 leading-relaxed">{durak.ipucu}</p>
                        </div>
                      )}
                      {!durak.mola && (
                        <button
                          onClick={() => toggleGezdim(durak.mekan)}
                          className={`flex items-center gap-1.5 text-[11px] font-medium px-3 py-1 rounded-full border transition-colors ${
                            gezilenYerler.includes(durak.mekan)
                              ? "bg-green-50 border-green-400 text-green-700"
                              : "border-gray-200 bg-white text-gray-400 hover:border-green-400 hover:text-green-600"
                          }`}
                        >
                          <IconCheck size={11} />
                          {gezilenYerler.includes(durak.mekan) ? "Gezdim ✓" : "Gezdim"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Ulaşım bağlantısı */}
                  {durak.ulasim && idx < rota.duraklar.length - 1 && (
                    <div className="ml-10 my-2">
                      <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-3 py-1.5">
                        <IconWalk size={13} className="text-gray-400 flex-shrink-0" />
                        <p className="text-xs text-gray-500 leading-tight">{durak.ulasim}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Aksiyonlar */}
            <div className="flex flex-col gap-2 mt-6">
              {userId && paylasDurum !== "paylasildi" && (
                <p className="text-center text-[11px] text-gray-500">
                  🔒 Bu rota profiline kaydedildi, sadece sen görebilirsin. İstersen aşağıdan paylaşabilirsin.
                </p>
              )}
              <button
                onClick={rotayiPaylas}
                disabled={paylasDurum !== "yok"}
                className={`w-full rounded-full py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  paylasDurum === "paylasildi"
                    ? "bg-green-50 border border-green-400 text-green-700"
                    : "bg-coral hover:bg-coral-dark text-white"
                }`}
              >
                {paylasDurum === "paylasildi" ? (
                  <>
                    <IconCheck size={15} />
                    Akışta paylaşıldı
                  </>
                ) : paylasDurum === "kaydediliyor" ? (
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <>
                    <IconShare size={15} />
                    Rotayı Paylaş
                  </>
                )}
              </button>

              {!anketTamam && (
                <button
                  onClick={() => setAnketAcik(true)}
                  className="w-full bg-white border border-navy-line text-navy rounded-full py-3 text-sm font-medium hover:bg-navy-line/30 transition-colors"
                >
                  🎉 Geziyi Tamamladım
                </button>
              )}

              <button
                onClick={() => { setRota(null); setKayitliRotaId(null); setPaylasDurum("yok"); setAnketTamam(false); }}
                className="w-full bg-white border border-gray-200 rounded-full py-2.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Yeni Rota Oluştur
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gezi sonu anketi */}
      {anketAcik && rota && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/30"
          onClick={() => setAnketAcik(false)}
        >
          <div
            className="bg-white rounded-t-2xl w-full max-w-lg shadow-2xl p-5 pb-8 anim-fade-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-4">
              <p className="text-2xl mb-1">🎉</p>
              <h3 className="text-sm font-semibold text-navy">Umarız harika bir gündü!</h3>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                Bugün en çok neresi iyi geldi? Cevabın sonraki rotalarını kişiselleştirir.{" "}
                <span className="text-coral font-semibold">+50 puan</span>
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {rota.duraklar.filter((d) => !d.mola).map((d, i) => (
                <button
                  key={d.sira}
                  onClick={() => anketCevapla(d.mekan)}
                  className="anim-fade-up border border-gray-200 rounded-xl px-4 py-2.5 text-left text-xs font-medium text-gray-700 hover:border-coral hover:text-coral transition-colors"
                  style={{ animationDelay: `${i * 70}ms` }}
                >
                  {d.mekan}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Yer bilgi kartı overlay */}
      {acikDurak && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/30"
          onClick={() => setAcikDurak(null)}
        >
          <div
            className="bg-white rounded-t-2xl w-full max-w-lg shadow-2xl border-t border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Tutamaç */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            <div className="px-5 pb-6 pt-2">
              {/* Fotoğraf — elle eklenen ya da Wikipedia'dan otomatik */}
              {(MEKAN_GORSELLER[acikDurak.mekan] || wikiGorsel[acikDurak.mekan]) && (
                <div className="-mx-5 mb-4">
                  <img
                    src={MEKAN_GORSELLER[acikDurak.mekan] || wikiGorsel[acikDurak.mekan] || ""}
                    alt={acikDurak.mekan}
                    className="w-full h-44 object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = "none"; }}
                  />
                </div>
              )}

              {/* Başlık */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 mr-3">
                  {placesMap[acikDurak.mekan] && (
                    <span className="text-[10px] font-semibold text-coral uppercase tracking-wide">
                      {placesMap[acikDurak.mekan].category}
                    </span>
                  )}
                  <h3 className="text-base font-semibold text-gray-900 mt-0.5 leading-snug">{acikDurak.mekan}</h3>
                  {placesMap[acikDurak.mekan]?.duration_minutes && (
                    <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
                      <IconClock size={11} />
                      Ortalama ziyaret: ~{placesMap[acikDurak.mekan].duration_minutes} dk
                    </p>
                  )}
                </div>
                <button onClick={() => setAcikDurak(null)} className="text-gray-300 flex-shrink-0 hover:text-gray-600 transition-colors">
                  <IconX size={20} />
                </button>
              </div>

              {/* Özel not (hardcoded bilgi) */}
              {MEKAN_OZEL_NOTLAR[acikDurak.mekan] && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-3">
                  <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-1">ℹ️ Bilgi</p>
                  <p className="text-xs text-blue-900 leading-relaxed">{MEKAN_OZEL_NOTLAR[acikDurak.mekan]}</p>
                </div>
              )}

              {/* Rehber notu — AI'ın ipucu */}
              {acikDurak.ipucu && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
                  <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wide mb-1">🔑 Rehber Notu</p>
                  <p className="text-xs text-amber-900 leading-relaxed">{acikDurak.ipucu}</p>
                </div>
              )}

              {/* Genel bilgi */}
              {placesMap[acikDurak.mekan] ? (
                <>
                  <p className="text-xs text-gray-500 leading-relaxed mb-3">{placesMap[acikDurak.mekan].description}</p>
                  {placesMap[acikDurak.mekan].tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {placesMap[acikDurak.mekan].tags.map((tag: string) => (
                        <span key={tag} className="text-[10px] bg-coral-tint text-coral-deep border border-coral-line px-2.5 py-1 rounded-full">{tag}</span>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                !acikDurak.ipucu && (
                  <p className="text-xs text-gray-400">Bu mekân için ek bilgi bulunamadı.</p>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RotaOlusturPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-navy-tint flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-coral border-t-transparent animate-spin" />
      </div>
    }>
      <RotaOlusturInner />
    </Suspense>
  );
}
