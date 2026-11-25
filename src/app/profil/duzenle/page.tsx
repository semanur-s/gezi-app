"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  IconArrowLeft,
  IconMap2,
  IconCheck,
  IconCamera,
  IconMail,
  IconLock,
  IconLogout,
  IconAlertTriangle,
  IconBell,
  IconUser,
  IconX,
} from "@tabler/icons-react";

interface FormState {
  full_name: string;
  username: string;
  bio: string;
}

interface Bildirimler {
  takipci: boolean;
  begeni: boolean;
  haftalik_ozet: boolean;
  rota_onerileri: boolean;
}

const BILDIRIM_ETIKETLERI: { anahtar: keyof Bildirimler; baslik: string; aciklama: string }[] = [
  { anahtar: "takipci", baslik: "Yeni takipçi", aciklama: "Biri seni takip ettiğinde haber ver" },
  { anahtar: "begeni", baslik: "Beğeni ve yorum", aciklama: "Rotan beğenildiğinde haber ver" },
  { anahtar: "rota_onerileri", baslik: "Kişisel rota önerileri", aciklama: "Sevdiğin yerlere göre öneriler gelsin" },
  { anahtar: "haftalik_ozet", baslik: "Haftalık özet", aciklama: "Haftanın popüler rotalarını e-posta ile al" },
];

function Anahtar({ acik, onClick }: { acik: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-10 h-6 rounded-full relative flex-shrink-0 transition-colors ${
        acik ? "bg-coral" : "bg-gray-200"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
          acik ? "translate-x-4" : ""
        }`}
      />
    </button>
  );
}

export default function ProfilDuzenlePage() {
  const router = useRouter();
  const dosyaInput = useRef<HTMLInputElement>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [form, setForm] = useState<FormState>({ full_name: "", username: "", bio: "" });
  const [originalUsername, setOriginalUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarYukleniyor, setAvatarYukleniyor] = useState(false);
  const [bildirimler, setBildirimler] = useState<Bildirimler>({
    takipci: true,
    begeni: true,
    haftalik_ozet: true,
    rota_onerileri: true,
  });

  const [yeniSifre, setYeniSifre] = useState("");
  const [yeniSifreTekrar, setYeniSifreTekrar] = useState("");
  const [sifreDegistiriliyor, setSifreDegistiriliyor] = useState(false);
  const [sifreHata, setSifreHata] = useState("");
  const [sifreMesaj, setSifreMesaj] = useState("");

  const [yukleniyor, setYukleniyor] = useState(true);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [hata, setHata] = useState("");
  const [basarili, setBasarili] = useState(false);
  const [silOnayAcik, setSilOnayAcik] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/giris"); return; }
      setUserId(user.id);
      setUserEmail(user.email || "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, username, bio, avatar_url, bildirimler")
        .eq("id", user.id)
        .single();

      if (profile) {
        setForm({
          full_name: profile.full_name || "",
          username: profile.username || "",
          bio: profile.bio || "",
        });
        setOriginalUsername(profile.username || "");
        setAvatarUrl(profile.avatar_url || null);
        const b = (profile.bildirimler as Partial<Bildirimler>) || {};
        setBildirimler({
          takipci: b.takipci ?? true,
          begeni: b.begeni ?? true,
          haftalik_ozet: b.haftalik_ozet ?? true,
          rota_onerileri: b.rota_onerileri ?? true,
        });
      }
      setYukleniyor(false);
    }
    fetchProfile();
  }, [router]);

  async function avatarSecildi(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    if (!file.type.startsWith("image/")) {
      setHata("Sadece görsel dosyası yükleyebilirsin.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setHata("Fotoğraf 5 MB'den küçük olmalı.");
      return;
    }
    setHata("");
    setAvatarYukleniyor(true);

    const supabase = createClient();
    const uzanti = file.name.split(".").pop() || "jpg";
    const yol = `${userId}/${Date.now()}.${uzanti}`;

    const { error: yuklemeHatasi } = await supabase.storage
      .from("avatars")
      .upload(yol, file, { upsert: true, cacheControl: "3600" });

    if (yuklemeHatasi) {
      setHata("Fotoğraf yüklenemedi, tekrar dene.");
      setAvatarYukleniyor(false);
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(yol);
    setAvatarUrl(data.publicUrl);
    await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("id", userId);
    setAvatarYukleniyor(false);
  }

  async function bildirimDegistir(anahtar: keyof Bildirimler) {
    if (!userId) return;
    const yeni = { ...bildirimler, [anahtar]: !bildirimler[anahtar] };
    setBildirimler(yeni);
    const supabase = createClient();
    await supabase.from("profiles").update({ bildirimler: yeni }).eq("id", userId);
  }

  async function sifreDegistir(e: React.FormEvent) {
    e.preventDefault();
    setSifreHata("");
    setSifreMesaj("");

    if (yeniSifre.length < 6) {
      setSifreHata("Şifre en az 6 karakter olmalı.");
      return;
    }
    if (yeniSifre !== yeniSifreTekrar) {
      setSifreHata("Şifreler eşleşmiyor.");
      return;
    }

    setSifreDegistiriliyor(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: yeniSifre });
    if (error) {
      setSifreHata("Şifre değiştirilemedi, tekrar dene.");
    } else {
      setSifreMesaj("Şifren güncellendi.");
      setYeniSifre("");
      setYeniSifreTekrar("");
    }
    setSifreDegistiriliyor(false);
  }

  async function cikisYap() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  async function kaydet(e: React.FormEvent) {
    e.preventDefault();
    setHata("");
    setKaydediliyor(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setKaydediliyor(false); return; }

    // Username değiştiyse çakışma kontrolü
    if (form.username !== originalUsername) {
      if (!/^[a-z0-9_]{3,20}$/.test(form.username)) {
        setHata("Kullanıcı adı 3-20 karakter, sadece küçük harf, rakam ve _ içerebilir.");
        setKaydediliyor(false);
        return;
      }
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", form.username)
        .neq("id", user.id)
        .single();
      if (existing) {
        setHata("Bu kullanıcı adı zaten alınmış.");
        setKaydediliyor(false);
        return;
      }
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name.trim() || null,
        username: form.username.trim(),
        bio: form.bio.trim() || null,
      })
      .eq("id", user.id);

    if (error) {
      setHata("Bir hata oluştu, tekrar dene.");
    } else {
      setBasarili(true);
      setTimeout(() => setBasarili(false), 2000);
      setOriginalUsername(form.username.trim());
    }
    setKaydediliyor(false);
  }

  const initials = (form.full_name
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("") || form.username?.charAt(0) || "?").toUpperCase();

  if (yukleniyor) {
    return (
      <div className="min-h-screen bg-navy-tint flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-coral border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-tint">
      {/* Topbar */}
      <header className="border-b border-white/10 sticky top-0 bg-navy/90 backdrop-blur-md z-20">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-3.5">
          <Link href={`/profil/${originalUsername}`} className="text-white/70 hover:text-white transition-colors">
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

      {/* Başlık */}
      <div className="mx-auto w-full max-w-xl px-5 pt-6 pb-2 anim-fade-up">
        <h1 className="font-display text-2xl font-bold text-navy">Ayarlar</h1>
        <p className="text-xs text-gray-400 mt-0.5">Profilini, bildirimlerini ve hesabını yönet.</p>
      </div>

      <div className="mx-auto w-full max-w-xl px-5 pt-4 pb-16 flex flex-col gap-4">
        {/* Fotoğraf */}
        <section className="anim-fade-up bg-white border border-navy-line/50 rounded-2xl p-5" style={{ animationDelay: "60ms" }}>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-3">Profil Fotoğrafı</p>
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-navy-tint flex items-center justify-center text-xl font-semibold text-navy overflow-hidden border-2 border-navy-line">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
                {avatarYukleniyor && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => dosyaInput.current?.click()}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-coral hover:bg-coral-dark text-white flex items-center justify-center border-2 border-white transition-colors"
                title="Fotoğraf değiştir"
              >
                <IconCamera size={14} />
              </button>
              <input
                ref={dosyaInput}
                type="file"
                accept="image/*"
                onChange={avatarSecildi}
                className="hidden"
              />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 leading-relaxed">
                Kare bir fotoğraf en iyi sonucu verir. JPG/PNG, en fazla 5 MB.
              </p>
              <button
                type="button"
                onClick={() => dosyaInput.current?.click()}
                className="mt-2 text-xs font-medium text-coral hover:text-coral-dark transition-colors"
              >
                Fotoğraf yükle
              </button>
            </div>
          </div>
        </section>

        {/* Kişisel Bilgiler */}
        <section className="anim-fade-up bg-white border border-navy-line/50 rounded-2xl p-5" style={{ animationDelay: "120ms" }}>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <IconUser size={12} />
            Kişisel Bilgiler
          </p>
          <form onSubmit={kaydet} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">Ad Soyad</label>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder="Adın ve soyadın"
                maxLength={60}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-coral transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">Kullanıcı Adı</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">@</span>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase() })}
                  placeholder="kullanici_adi"
                  maxLength={20}
                  required
                  className="w-full border border-gray-200 rounded-xl pl-8 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-coral transition-colors"
                />
              </div>
              <p className="text-[11px] text-gray-400">3-20 karakter, küçük harf, rakam ve _ kullanılabilir.</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">Bio</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="Kendinden kısaca bahset..."
                maxLength={160}
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-coral transition-colors resize-none"
              />
              <p className="text-[11px] text-gray-400 text-right">{form.bio.length}/160</p>
            </div>

            {hata && (
              <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">{hata}</p>
            )}

            <button
              type="submit"
              disabled={kaydediliyor}
              className="w-full bg-coral hover:bg-coral-dark disabled:opacity-60 text-white rounded-full py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {basarili ? (
                <>
                  <IconCheck size={16} />
                  Kaydedildi
                </>
              ) : kaydediliyor ? (
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                "Bilgileri Kaydet"
              )}
            </button>
          </form>
        </section>

        {/* Bildirim Tercihleri */}
        <section className="anim-fade-up bg-white border border-navy-line/50 rounded-2xl p-5" style={{ animationDelay: "180ms" }}>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <IconBell size={12} />
            Bildirim Tercihleri
          </p>
          <div className="flex flex-col divide-y divide-gray-100">
            {BILDIRIM_ETIKETLERI.map((b) => (
              <div key={b.anahtar} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium text-gray-800">{b.baslik}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{b.aciklama}</p>
                </div>
                <Anahtar acik={bildirimler[b.anahtar]} onClick={() => bildirimDegistir(b.anahtar)} />
              </div>
            ))}
          </div>
        </section>

        {/* Hesap */}
        <section className="anim-fade-up bg-white border border-red-100 rounded-2xl p-5" style={{ animationDelay: "240ms" }}>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <IconMail size={12} />
            Hesap
          </p>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-gray-400">E-posta</p>
              <p className="text-sm text-gray-800">{userEmail || "—"}</p>
            </div>
          </div>

          <form onSubmit={sifreDegistir} className="flex flex-col gap-3 pt-3 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
              <IconLock size={13} />
              Şifre Değiştir
            </p>
            <input
              type="password"
              value={yeniSifre}
              onChange={(e) => setYeniSifre(e.target.value)}
              placeholder="Yeni şifre"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-coral transition-colors"
            />
            <input
              type="password"
              value={yeniSifreTekrar}
              onChange={(e) => setYeniSifreTekrar(e.target.value)}
              placeholder="Yeni şifre (tekrar)"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-coral transition-colors"
            />
            {sifreHata && <p className="text-xs text-red-500">{sifreHata}</p>}
            {sifreMesaj && <p className="text-xs text-green-600">{sifreMesaj}</p>}
            <button
              type="submit"
              disabled={sifreDegistiriliyor || !yeniSifre}
              className="self-start bg-navy-tint border border-navy-line text-navy disabled:opacity-50 rounded-full px-4 py-2 text-xs font-medium hover:bg-navy-line/30 transition-colors"
            >
              {sifreDegistiriliyor ? "Güncelleniyor..." : "Şifreyi Güncelle"}
            </button>
          </form>
        </section>

        {/* Tehlikeli Bölge */}
        <section className="bg-white border border-red-100 rounded-2xl p-5">
          <p className="text-[11px] font-semibold text-red-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <IconAlertTriangle size={12} />
            Tehlikeli Bölge
          </p>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={cikisYap}
              className="w-full flex items-center justify-center gap-2 border border-gray-200 rounded-full py-2.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <IconLogout size={14} />
              Çıkış Yap
            </button>
            <button
              type="button"
              onClick={() => setSilOnayAcik(true)}
              className="w-full text-xs font-medium text-red-500 hover:text-red-600 py-2 transition-colors"
            >
              Hesabı Sil
            </button>
          </div>
        </section>
      </div>

      {/* Hesap silme bilgilendirme modalı */}
      {silOnayAcik && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/30"
          onClick={() => setSilOnayAcik(false)}
        >
          <div
            className="bg-white rounded-t-2xl w-full max-w-lg shadow-2xl p-5 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-3">
              <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                <IconAlertTriangle size={15} className="text-red-500" />
                Hesabını silmek üzeresin
              </p>
              <button onClick={() => setSilOnayAcik(false)} className="text-gray-300 hover:text-gray-600 transition-colors">
                <IconX size={18} />
              </button>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed mb-4">
              Hesap silme işlemi geri alınamaz ve tüm rotalarını, puanlarını kalıcı olarak kaldırır.
              Güvenliğin için bu işlem şu anda destek ekibimiz üzerinden yapılıyor —
              <span className="font-medium text-gray-700"> destek@gezim.app</span> adresine yazman yeterli.
            </p>
            <button
              onClick={() => setSilOnayAcik(false)}
              className="w-full bg-navy-tint border border-navy-line text-navy rounded-full py-2.5 text-xs font-medium hover:bg-navy-line/30 transition-colors"
            >
              Anladım
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
