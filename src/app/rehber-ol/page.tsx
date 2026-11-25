"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { seviyeBul } from "@/lib/seviye";
import {
  IconArrowLeft,
  IconMap2,
  IconLock,
  IconCheck,
  IconClockHour4,
  IconMapPin,
} from "@tabler/icons-react";

const REHBER_ESIGI = 1000; // Semt Uzmanı seviyesi
const BOLGELER = ["Beyoğlu", "Fatih", "Beşiktaş", "Kadıköy", "Üsküdar", "Adalar"];

export default function RehberOlPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [puan, setPuan] = useState(0);
  const [gezilenSayisi, setGezilenSayisi] = useState(0);
  const [durum, setDurum] = useState<string | null>(null);
  const [rehberMi, setRehberMi] = useState(false);
  const [username, setUsername] = useState("");

  const [bolgeler, setBolgeler] = useState<string[]>([]);
  const [aciklama, setAciklama] = useState("");
  const [fiyat, setFiyat] = useState("");
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hata, setHata] = useState("");
  const [basarili, setBasarili] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/giris"); return; }
      setUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("username, puan, gezilen_yerler, rehber_basvuru_durumu, rehber_mi, rehber_bolgeler, rehber_aciklama, rehber_fiyat_bilgisi")
        .eq("id", user.id)
        .single();

      if (profile) {
        setUsername(profile.username || "");
        setPuan(profile.puan || 0);
        setGezilenSayisi((profile.gezilen_yerler || []).length);
        setDurum(profile.rehber_basvuru_durumu);
        setRehberMi(!!profile.rehber_mi);
        setBolgeler(profile.rehber_bolgeler || []);
        setAciklama(profile.rehber_aciklama || "");
        setFiyat(profile.rehber_fiyat_bilgisi || "");
      }
      setYukleniyor(false);
    }
    fetchProfile();
  }, [router]);

  function bolgeSec(b: string) {
    setBolgeler((prev) => (prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]));
  }

  async function basvuruGonder(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    if (bolgeler.length === 0) { setHata("En az bir bölge seç."); return; }
    if (aciklama.trim().length < 30) { setHata("Deneyimini biraz daha anlat (en az 30 karakter)."); return; }

    setHata("");
    setGonderiliyor(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        rehber_basvuru_durumu: "beklemede",
        rehber_bolgeler: bolgeler,
        rehber_aciklama: aciklama.trim(),
        rehber_fiyat_bilgisi: fiyat.trim() || null,
      })
      .eq("id", userId);

    if (error) {
      setHata("Başvuru gönderilemedi, tekrar dene.");
    } else {
      setBasarili(true);
      setDurum("beklemede");
    }
    setGonderiliyor(false);
  }

  if (yukleniyor) {
    return (
      <div className="min-h-screen bg-navy-tint flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-coral border-t-transparent animate-spin" />
      </div>
    );
  }

  const { mevcut } = seviyeBul(puan);
  const uygun = puan >= REHBER_ESIGI;

  return (
    <div className="min-h-screen bg-navy-tint">
      <header className="border-b border-white/10 sticky top-0 bg-navy/90 backdrop-blur-md z-20">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-3.5">
          <Link href="/rehberler" className="text-white/70 hover:text-white transition-colors">
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
        </div>
      </header>

      <div className="mx-auto w-full max-w-xl px-5 pt-8 pb-16">
        <div className="text-center mb-7 anim-fade-up">
          <p className="font-flourish text-3xl text-coral mb-1">Rehber Ol</p>
          <h1 className="font-display text-xl font-bold text-navy">Şehri bildiğin gibi anlat, kazan</h1>
          <p className="text-xs text-gray-500 mt-1.5 leading-relaxed max-w-sm mx-auto">
            Gerçekten gezdiğin yerlerden, kendi bildiğin rotaları başkalarıyla paylaş.
            Onayın sonrası profilin <Link href="/rehberler" className="text-coral font-medium">rehberler</Link> sayfasında görünür.
          </p>
        </div>

        {rehberMi ? (
          <div className="anim-pop-in bg-white border border-green-200 rounded-2xl p-6 text-center">
            <IconCheck size={28} className="text-green-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-900">Zaten onaylı bir rehbersin!</p>
            <p className="text-xs text-gray-500 mt-1 mb-4">Profilin @{username} rehberler listesinde görünüyor.</p>
            <Link href="/rehberler" className="inline-flex items-center gap-1.5 bg-coral hover:bg-coral-dark text-white text-xs font-medium px-5 py-2 rounded-full transition-colors">
              Rehberleri Gör
            </Link>
          </div>
        ) : durum === "beklemede" ? (
          <div className="anim-pop-in bg-white border border-navy-line rounded-2xl p-6 text-center">
            <IconClockHour4 size={28} className="text-navy mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-900">Başvurun inceleniyor</p>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Ekibimiz başvurunu birkaç gün içinde değerlendirip sana dönecek.
            </p>
          </div>
        ) : basarili ? (
          <div className="anim-pop-in bg-white border border-navy-line rounded-2xl p-6 text-center">
            <IconClockHour4 size={28} className="text-navy mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-900">Başvurun alındı</p>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">İnceleme sonrası haber vereceğiz.</p>
          </div>
        ) : !uygun ? (
          <div className="anim-pop-in bg-white border border-navy-line rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-full bg-navy-tint flex items-center justify-center flex-shrink-0">
                <IconLock size={18} className="text-navy" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Henüz yeterli deneyimin yok</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Rehber olabilmek için en az <strong>{REHBER_ESIGI} puan</strong> gerekiyor.
                </p>
              </div>
            </div>
            <div className="h-2 rounded-full bg-navy-tint overflow-hidden mb-1.5">
              <div
                className="puan-cubugu h-full rounded-full bg-gradient-to-r from-coral to-coral-dark"
                style={{ width: `${Math.min(100, Math.round((puan / REHBER_ESIGI) * 100))}%` }}
              />
            </div>
            <p className="text-[11px] text-gray-400 mb-4">
              {mevcut.emoji} {mevcut.ad} · {puan} / {REHBER_ESIGI} puan · {gezilenSayisi} yer gezildi
            </p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Konum doğrulamalı &ldquo;Gezdim&rdquo; işaretlemeleri ve tamamladığın rotalarla puan kazanırsın.
            </p>
            <Link href="/rota-olustur" className="inline-flex items-center gap-1.5 mt-4 bg-coral hover:bg-coral-dark text-white text-xs font-medium px-5 py-2 rounded-full transition-colors">
              Gezmeye Başla
            </Link>
          </div>
        ) : (
          <form onSubmit={basvuruGonder} className="anim-pop-in bg-white border border-navy-line rounded-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-xl px-3.5 py-2">
              <IconCheck size={14} />
              {mevcut.emoji} {mevcut.ad} seviyesindesin — başvurabilirsin
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
                <IconMapPin size={13} />
                Hangi bölgelerde rehberlik yapabilirsin?
              </label>
              <div className="flex flex-wrap gap-2">
                {BOLGELER.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => bolgeSec(b)}
                    className={`anim-secim px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      bolgeler.includes(b)
                        ? "bg-coral border-coral text-white"
                        : "border-gray-200 bg-white text-gray-600 hover:border-coral hover:text-coral"
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">Deneyimini anlat</label>
              <textarea
                value={aciklama}
                onChange={(e) => setAciklama(e.target.value)}
                placeholder="Hangi yerleri iyi bilirsin, nasıl bir tur sunarsın?"
                rows={4}
                maxLength={500}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-coral transition-colors resize-none"
              />
              <p className="text-[11px] text-gray-400 text-right">{aciklama.length}/500</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">Fiyat bilgisi (opsiyonel)</label>
              <input
                type="text"
                value={fiyat}
                onChange={(e) => setFiyat(e.target.value)}
                placeholder="Örn: kişi başı 400₺, grup için görüşülür"
                maxLength={80}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-coral transition-colors"
              />
              <p className="text-[11px] text-gray-400">Ödeme şu an uygulama dışında, rehberle görüşerek anlaşılır.</p>
            </div>

            {hata && <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">{hata}</p>}

            <button
              type="submit"
              disabled={gonderiliyor}
              className="w-full bg-coral hover:bg-coral-dark disabled:opacity-60 text-white rounded-full py-2.5 text-sm font-medium transition-colors"
            >
              {gonderiliyor ? "Gönderiliyor..." : "Başvuruyu Gönder"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
