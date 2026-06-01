"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
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
  const [placesMap, setPlacesMap] = useState<Record<string, { description: string; category: string; tags: string[]; duration_minutes: number }>>({});
  const [acikDurak, setAcikDurak] = useState<Durak | null>(null);
  const [asamasi, setAsamasi] = useState<"form" | "secim">("form");
  const [alternatifler, setAlternatifler] = useState<AlternatifSoru[]>([]);
  const [secimler, setSecimler] = useState<Record<number, "a" | "b">>({});

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
        .select("name, description, category, tags, duration_minutes");
      if (data) {
        const m: Record<string, typeof data[0]> = {};
        data.forEach((p) => { m[p.name] = p; });
        setPlacesMap(m);
      }
    }
    fetchUserPrefs();
    fetchPlaces();
  }, []);

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
    const yeni = gezilenYerler.includes(mekanAdi)
      ? gezilenYerler.filter((n) => n !== mekanAdi)
      : [...gezilenYerler, mekanAdi];
    setGezilenYerler(yeni);
    await supabase.from("profiles").update({ gezilen_yerler: yeni }).eq("id", userId);
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
    <div className="min-h-screen bg-white max-w-lg mx-auto">
      {/* Topbar */}
      <header className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur-sm z-10">
        <Link href="/" className="text-gray-500 hover:text-gray-800 transition-colors">
          <IconArrowLeft size={20} />
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#C2622A] flex items-center justify-center">
            <IconMap2 size={14} color="white" />
          </div>
          <span className="text-sm font-medium text-gray-900">
            gez<span className="text-[#C2622A]">im</span>
          </span>
        </div>
        <div className="w-5" />
      </header>

      {!rota && asamasi === "secim" ? (
        /* Seçim ekranı — adım 2 */
        <div className="px-5 pt-6 pb-10">
          <div className="mb-5">
            <p className="text-[11px] font-semibold text-[#C2622A] mb-1">Adım 2 / 2</p>
            <h1 className="text-base font-semibold text-gray-900">Sen seç, AI uygulasın</h1>
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
                        className={`p-3.5 rounded-xl border text-left transition-all ${
                          selected ? "bg-[#C2622A] border-[#C2622A]" : "border-gray-200 bg-white hover:border-[#C2622A]"
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
            className="w-full bg-[#C2622A] hover:bg-[#a8521f] disabled:opacity-40 text-white rounded-full py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2"
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
        <div className="px-5 pt-6 pb-10">
          {/* Başlık */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-1">
              <IconRoute size={18} className="text-[#C2622A]" />
              <h1 className="text-base font-semibold text-gray-900">Rota Oluştur</h1>
            </div>
            <p className="text-xs text-gray-400">Sana özel İstanbul rotanı yapay zeka oluştursun.</p>
          </div>

          {/* Öncelikli yer */}
          {oncelikliYerParam && (
            <div className="mb-5 flex items-center gap-2 bg-[#FDF0E8] border border-[#E8B48A] rounded-xl px-4 py-2.5">
              <IconBookmarkFilled size={14} className="text-[#C2622A] flex-shrink-0" />
              <p className="text-xs text-[#9B4A1E]">
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
                  <span key={yer} className="inline-flex items-center gap-1 text-[11px] bg-[#FDF0E8] text-[#9B4A1E] border border-[#E8B48A] px-2.5 py-1 rounded-full">
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
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1 ${
                        secili
                          ? "bg-[#C2622A] border-[#C2622A] text-white"
                          : yakin
                          ? "border-[#C2622A] text-[#C2622A] bg-[#FDF0E8]"
                          : "border-gray-200 text-gray-600 hover:border-[#C2622A] hover:text-[#C2622A]"
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
            <p className="text-xs font-medium text-gray-600 mb-2">Ne zaman gidiyorsun?</p>
            {/* Tarih */}
            <input
              type="date"
              value={tarih}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setTarih(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:border-[#C2622A] transition-colors mb-3"
            />
            {/* Saat aralığı */}
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <p className="text-[10px] text-gray-400 mb-1">Başlangıç</p>
                <input
                  type="time"
                  value={baslangic}
                  onChange={(e) => setBaslangic(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:border-[#C2622A] transition-colors"
                />
              </div>
              <div className="text-gray-300 text-sm mt-4">→</div>
              <div className="flex-1">
                <p className="text-[10px] text-gray-400 mb-1">Bitiş</p>
                <input
                  type="time"
                  value={bitis}
                  onChange={(e) => setBitis(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:border-[#C2622A] transition-colors"
                />
              </div>
            </div>
            {baslangic && bitis && bitis > baslangic && (
              <p className="text-[11px] text-[#C2622A] mt-1.5">
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
                          className={`p-3 rounded-xl border text-left transition-all ${
                            selected
                              ? "bg-[#C2622A] border-[#C2622A]"
                              : "border-gray-200 hover:border-[#C2622A] bg-white"
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
                gezilenleriDahilEt ? "bg-[#C2622A] border-[#C2622A]" : "border-gray-300"
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
            className="w-full bg-[#C2622A] hover:bg-[#a8521f] disabled:opacity-40 text-white rounded-full py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2"
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
        <div className="pb-10">
          {/* Rota başlık kartı */}
          <div className="mx-5 mt-5 bg-[#FDF0E8] border border-[#E8B48A] rounded-2xl p-4 mb-5">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#C2622A] flex items-center justify-center flex-shrink-0 mt-0.5">
                <IconRoute size={18} color="white" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900 leading-snug">{rota.baslik}</h2>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{rota.aciklama}</p>
              </div>
            </div>
          </div>

          {/* Duraklar */}
          <div className="px-5">
            <p className="text-xs font-medium text-gray-500 mb-3 flex items-center gap-1.5">
              <IconMapPin size={13} className="text-[#C2622A]" />
              {rota.duraklar.length} durak
            </p>

            <div className="flex flex-col gap-3">
              {rota.duraklar.map((durak, idx) => (
                <div key={durak.sira}>
                  <div className="flex gap-3">
                    {/* Zaman çizgisi */}
                    <div className="flex flex-col items-center">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0 ${
                        durak.mola ? "bg-amber-400" : "bg-[#C2622A]"
                      }`}>
                        {durak.mola
                          ? durak.mekan.toLowerCase().includes("kahve") || durak.mekan.toLowerCase().includes("kafe")
                            ? <IconCoffee size={13} />
                            : <IconToolsKitchen2 size={13} />
                          : durak.sira}
                      </div>
                      {idx < rota.duraklar.length - 1 && (
                        <div className="w-px flex-1 bg-[#E8B48A] mt-1 min-h-[24px]" />
                      )}
                    </div>

                    {/* İçerik */}
                    <div className="flex-1 pb-1">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <button
                          onClick={() => !durak.mola && setAcikDurak(durak)}
                          className={`text-sm font-medium text-left ${
                            durak.mola ? "text-amber-700 cursor-default" : "text-gray-900 hover:text-[#C2622A]"
                          }`}
                        >
                          {durak.mekan}
                          {!durak.mola && (
                            <span className="ml-1 text-[10px] text-gray-300 font-normal align-middle">↗</span>
                          )}
                        </button>
                        <span className="flex items-center gap-1 text-[11px] text-gray-400 whitespace-nowrap flex-shrink-0 mt-0.5">
                          <IconClock size={11} />
                          {durak.sure}
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
                              : "border-gray-200 text-gray-400 hover:border-green-400 hover:text-green-600"
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
                      <div className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-3 py-1.5">
                        <IconWalk size={13} className="text-gray-400 flex-shrink-0" />
                        <p className="text-xs text-gray-500 leading-tight">{durak.ulasim}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Tekrar oluştur */}
            <button
              onClick={() => setRota(null)}
              className="w-full mt-6 border border-gray-200 rounded-full py-2.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Yeni Rota Oluştur
            </button>
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
              {/* Fotoğraf */}
              {MEKAN_GORSELLER[acikDurak.mekan] && (
                <div className="-mx-5 mb-4">
                  <img
                    src={MEKAN_GORSELLER[acikDurak.mekan]}
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
                    <span className="text-[10px] font-semibold text-[#C2622A] uppercase tracking-wide">
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
                        <span key={tag} className="text-[10px] bg-[#FDF0E8] text-[#9B4A1E] border border-[#E8B48A] px-2.5 py-1 rounded-full">{tag}</span>
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#C2622A] border-t-transparent animate-spin" />
      </div>
    }>
      <RotaOlusturInner />
    </Suspense>
  );
}
