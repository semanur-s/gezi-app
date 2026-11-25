"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { egimVer, egimSifirla, kalpUcur } from "@/lib/etkilesim";
import { useScrollReveal } from "@/lib/useScrollReveal";
import { useSayac } from "@/lib/useSayac";
import type { User } from "@supabase/supabase-js";
import {
  IconMap2,
  IconSparkles,
  IconArrowRight,
  IconMapPin,
  IconRoute,
  IconClock,
  IconChevronRight,
  IconHeartFilled,
  IconHeart,
  IconMessageCircle,
  IconBookmark,
  IconUsers,
} from "@tabler/icons-react";

// Her chip gerçek bir keşfet aramasına bağlanır (places.tags / category ile eşleşir)
// ipucu: hover'da beliren düşünce baloncuğundaki oyuncu mesaj
const CHIPS = [
  { emoji: "🗺", label: "Tarihi Yarımada", q: "tarihi", ipucu: "Zamanda yolculuk ⏳" },
  { emoji: "☕", label: "Kafe Rotaları", q: "yeme-içme", ipucu: "Bir fincan keyif ☕" },
  { emoji: "🎨", label: "Sokak Sanatı", q: "sanat", ipucu: "Duvarlar konuşuyor 🎨" },
  { emoji: "⛵", label: "Boğaz Turu", q: "tur", ipucu: "İki kıta bir bakış 🌊" },
  { emoji: "🌧", label: "Yağmurlu Gün", q: "müze", ipucu: "Yağmura inat gezi ☔" },
];

// Hero arka planı: İstanbul'un simge mekanları (1280px, tamamı doğrulandı)
const HERO_GORSELLER = [
  "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Istanbul_asv2020-02_img48_Galata_Tower.jpg/1280px-Istanbul_asv2020-02_img48_Galata_Tower.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Istanbul_K%C4%B1z_Kulesi_%2854511155871%29_%28cropped%29.jpg/1280px-Istanbul_K%C4%B1z_Kulesi_%2854511155871%29_%28cropped%29.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Hagia_Sophia_%28228968325%29.jpeg/1280px-Hagia_Sophia_%28228968325%29.jpeg",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Istanbul_asv2020-02_img60_Ortak%C3%B6y_Mosque.jpg/1280px-Istanbul_asv2020-02_img60_Ortak%C3%B6y_Mosque.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Istanbul_%2834223582516%29_%28cropped%29.jpg/1280px-Istanbul_%2834223582516%29_%28cropped%29.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/S%C3%BCleymaniyeMosqueIstanbul_%28cropped%29.jpg/1280px-S%C3%BCleymaniyeMosqueIstanbul_%28cropped%29.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Dolmabahce_Istanbul_Turkey.jpg/1280px-Dolmabahce_Istanbul_Turkey.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Istanbul_asv2021-11_img41_Grand_Bazaar.jpg/1280px-Istanbul_asv2021-11_img41_Grand_Bazaar.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Istiklal_Avenue_in_Istanbul_-_Turkey.jpg/1280px-Istiklal_Avenue_in_Istanbul_-_Turkey.jpg",
];

const ONLINE_AVATARS = [
  { init: "AY", bg: "#fde5dd", color: "#b03818" },
  { init: "MK", bg: "#D8EEF5", color: "#1A5E75" },
  { init: "SÇ", bg: "#E8F5D8", color: "#2E6B1A" },
  { init: "EL", bg: "#F5D8E8", color: "#7A1A4A" },
];

interface Post {
  id: number;
  username: string;
  initials: string;
  avatarBg: string;
  avatarColor: string;
  time: string;
  stopCount: number;
  stops: string[];
  imageBg: string;
  imageLabel: string;
  likes: number;
  comments: number;
  liked: boolean;
}

const INITIAL_POSTS: Post[] = [
  {
    id: 1,
    username: "ayşe_yolcu",
    initials: "AY",
    avatarBg: "#fde5dd",
    avatarColor: "#b03818",
    time: "2 saat önce",
    stopCount: 5,
    stops: ["Karaköy", "Galata", "Tünel", "Pera"],
    imageBg: "linear-gradient(135deg, #3c6a9e 0%, #13304f 100%)",
    imageLabel: "Galata Kulesi",
    likes: 84,
    comments: 12,
    liked: true,
  },
  {
    id: 2,
    username: "selin_çeker",
    initials: "SÇ",
    avatarBg: "#E8F5D8",
    avatarColor: "#2E6B1A",
    time: "5 saat önce",
    stopCount: 4,
    stops: ["Balat", "Fener", "Ayvansaray"],
    imageBg: "linear-gradient(135deg, #A8D08A 0%, #3B6D11 100%)",
    imageLabel: "Balat sokakları",
    likes: 61,
    comments: 7,
    liked: false,
  },
];

interface GercekPost {
  id: string;
  baslik: string;
  duraklar: { mekan: string; mola?: boolean }[];
  created_at: string;
  kullanici: { username: string; full_name: string | null; avatar_url: string | null } | null;
  begeniSayisi: number;
  begendim: boolean;
}

const AVATAR_PALET = [
  { bg: "#fde5dd", color: "#b03818" },
  { bg: "#e3ecf5", color: "#24507c" },
  { bg: "#e8f5d8", color: "#2E6B1A" },
  { bg: "#f5d8e8", color: "#7A1A4A" },
];

const KART_GRADYANLAR = [
  "linear-gradient(135deg, #3c6a9e 0%, #13304f 100%)",
  "linear-gradient(135deg, #f97a5a 0%, #d43e1d 100%)",
  "linear-gradient(135deg, #A8D08A 0%, #3B6D11 100%)",
  "linear-gradient(135deg, #8AB4D0 0%, #1A5E75 100%)",
];

function isimKarma(ad: string) {
  let t = 0;
  for (const c of ad) t += c.charCodeAt(0);
  return t;
}

function zamanOnce(iso: string) {
  const dk = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (dk < 1) return "az önce";
  if (dk < 60) return `${dk} dk önce`;
  const saat = Math.floor(dk / 60);
  if (saat < 24) return `${saat} saat önce`;
  return `${Math.floor(saat / 24)} gün önce`;
}

function OnlineSayaci() {
  const { deger, ref } = useSayac(127, 1400);
  return (
    <span ref={ref} className="text-xs text-gray-500">
      şu an <strong className="text-navy">{deger} kişi</strong>{" "}İstanbul&apos;u keşfediyor
    </span>
  );
}

export default function Home() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [gercekler, setGercekler] = useState<GercekPost[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const [slayt, setSlayt] = useState(0);

  useScrollReveal([gercekler.length]);

  // Hero fotoğrafları 5 saniyede bir değişir
  useEffect(() => {
    const t = setInterval(() => setSlayt((s) => (s + 1) % HERO_GORSELLER.length), 5000);
    return () => clearInterval(t);
  }, []);

  // Fotoğrafları önceden indirip çöz — geçiş anında takılma/oynama olmasın
  useEffect(() => {
    HERO_GORSELLER.forEach((url) => {
      const img = new window.Image();
      img.src = url;
      img.decode?.().catch(() => {});
    });
  }, []);

  // Apple tarzı paralaks: hero kaydırdıkça yavaşça kayar ve solar
  useEffect(() => {
    const f = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);

  useEffect(() => {
    const supabase = createClient();

    async function fetchFeed(uid: string | null) {
      const { data: rotalar } = await supabase
        .from("routes")
        .select("id, baslik, duraklar, created_at, profiles(username, full_name, avatar_url), route_likes(count)")
        .eq("herkese_acik", true)
        .order("created_at", { ascending: false })
        .limit(10);
      if (!rotalar) return;

      let begenilen = new Set<string>();
      if (uid) {
        const { data: b } = await supabase
          .from("route_likes")
          .select("route_id")
          .eq("user_id", uid);
        begenilen = new Set((b || []).map((x) => x.route_id as string));
      }

      setGercekler(
        rotalar.map((r) => ({
          id: r.id as string,
          baslik: (r.baslik as string) || "İsimsiz rota",
          duraklar: (r.duraklar as GercekPost["duraklar"]) || [],
          created_at: r.created_at as string,
          kullanici: (r.profiles as unknown as GercekPost["kullanici"]) ?? null,
          begeniSayisi: (r.route_likes as unknown as { count: number }[])?.[0]?.count ?? 0,
          begendim: begenilen.has(r.id as string),
        }))
      );
    }

    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", user.id)
          .single();
        setUsername(profile?.username ?? null);
      }
      fetchFeed(user?.id ?? null);
    }

    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) setUsername(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  function aramaGonder(e: React.FormEvent) {
    e.preventDefault();
    const q = search.trim();
    router.push(q ? `/yerler?ara=${encodeURIComponent(q)}` : "/yerler");
  }

  async function cikisYap() {
    const supabase = createClient();
    await supabase.auth.signOut();
  }

  const toggleLike = (id: number, e: React.MouseEvent<HTMLButtonElement>) => {
    const olacakBegeni = !posts.find((p) => p.id === id)?.liked;
    if (olacakBegeni) kalpUcur(e.currentTarget);
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
          : p
      )
    );
  };

  async function gercekBegen(id: string, e: React.MouseEvent<HTMLButtonElement>) {
    if (!user) { window.location.assign("/giris"); return; }
    const supabase = createClient();
    const post = gercekler.find((p) => p.id === id);
    if (!post) return;
    if (post.begendim) {
      setGercekler((prev) =>
        prev.map((p) => (p.id === id ? { ...p, begendim: false, begeniSayisi: p.begeniSayisi - 1 } : p))
      );
      await supabase.from("route_likes").delete().eq("route_id", id).eq("user_id", user.id);
    } else {
      kalpUcur(e.currentTarget);
      setGercekler((prev) =>
        prev.map((p) => (p.id === id ? { ...p, begendim: true, begeniSayisi: p.begeniSayisi + 1 } : p))
      );
      await supabase.from("route_likes").insert({ route_id: id, user_id: user.id });
    }
  }

  return (
    <div className="min-h-screen bg-navy-deep">
        {/* Topbar */}
        <header className="sticky top-0 z-20 border-b border-white/10 bg-navy-deep/85 backdrop-blur-md">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-coral flex items-center justify-center">
              <IconMap2 size={16} color="white" />
            </div>
            <span className="font-brand text-base text-white">
              Gezi <span className="text-coral">App</span>
            </span>
          </div>
          <nav className="flex items-center gap-5">
            <Link href="/yerler" className="hover-buyu text-xs text-white/70">Keşfet</Link>
            <Link href="/rota-olustur" className="hover-buyu text-xs text-white/70">Rotalar</Link>
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  href={username ? `/profil/${username}` : "/hosgeldin"}
                  className="w-7 h-7 rounded-full bg-coral-tint text-coral-deep flex items-center justify-center text-xs font-medium hover:opacity-80 transition-opacity overflow-hidden"
                  title={user.user_metadata?.full_name || user.email || ""}
                >
                  {user.user_metadata?.picture ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.user_metadata.picture} alt="" className="w-full h-full object-cover" />
                  ) : (
                    (user.user_metadata?.full_name?.charAt(0) || user.email?.charAt(0) || "?").toUpperCase()
                  )}
                </Link>
                <button
                  onClick={cikisYap}
                  className="text-xs text-white/60 hover:text-white transition-colors"
                >
                  Çıkış
                </button>
              </div>
            ) : (
              <Link
                href="/giris"
                className="text-xs font-medium text-white bg-coral px-3.5 py-1.5 rounded-full hover:bg-coral-dark transition-colors"
              >
                Giriş Yap
              </Link>
            )}
          </nav>
          </div>
        </header>

        {/* Hero — canlı İstanbul sahnesi: değişen fotoğraflar, gezinen ışıklar, paralaks */}
        <section className="relative px-5 pt-16 pb-28 md:pt-28 md:pb-44 text-center overflow-hidden">
          {/* İstanbul fotoğrafları — 5 sn'de bir çapraz geçiş.
              Zoom, aşağıdaki tek .hero-foto-yigin sarmalayıcısında sürekli çalışır;
              slaytlar sadece opacity değiştirir — bu yüzden geçişte asla sıçrama olmaz. */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="hero-foto-yigin">
              {HERO_GORSELLER.map((url, i) => (
                <div
                  key={url}
                  className={`hero-slayt ${i === slayt ? "aktif" : ""}`}
                  style={{ backgroundImage: `url(${url})` }}
                />
              ))}
            </div>
            {/* Fotoğrafın üstüne lacivert perde — yazılar her zaman okunur */}
            <div className="absolute inset-0 bg-gradient-to-b from-navy-deep/85 via-navy-deep/75 to-navy-deep" />
          </div>

          {/* Ekranda gezinen ışık topları */}
          <div className="blob blob-1 w-72 h-72 -top-16 -left-20" style={{ background: "#f4512c" }} />
          <div className="blob blob-2 w-80 h-80 top-28 -right-24" style={{ background: "#3c6a9e" }} />
          <div className="blob blob-3 w-44 h-44 top-56 left-6" style={{ background: "#8AB4D0", opacity: 0.35 }} />

          {/* Paralaks içerik */}
          <div
            className="relative mx-auto w-full max-w-2xl"
            style={{
              transform: `translateY(${scrollY * 0.28}px)`,
              opacity: Math.max(0, 1 - scrollY / 420),
            }}
          >
            {/* "İstanbul seni bekliyor" — yazı sabit durur, iki yanındaki kesik
                çizgiler sürekli akar (yol gibi hareket eden bir çerçeve) */}
            <div className="anim-pop-in flex items-center justify-center gap-3 mb-6 w-full max-w-md mx-auto">
              <svg className="flex-1 h-[10px] overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 10">
                <line x1="0" y1="5" x2="100" y2="5" stroke="#f4512c" strokeWidth="2" strokeLinecap="round" className="yol-cizgisi" opacity="0.6" />
              </svg>
              <span className="font-flourish text-[28px] md:text-[36px] text-coral leading-none whitespace-nowrap flex-shrink-0">
                İstanbul seni bekliyor
              </span>
              <svg className="flex-1 h-[10px] overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 10">
                <line x1="0" y1="5" x2="100" y2="5" stroke="#f4512c" strokeWidth="2" strokeLinecap="round" className="yol-cizgisi" opacity="0.6" />
              </svg>
            </div>
            <h1 className="anim-fade-up font-display text-[40px] md:text-[64px] font-bold text-white leading-[1.05] mb-3">
              Bugün <span className="text-coral">nereyi</span><br />keşfediyorsun?
            </h1>
            <p className="anim-fade-up text-sm md:text-base text-white/60 mb-8 leading-relaxed" style={{ animationDelay: "120ms" }}>
              Gideceğin yeri ve müsait saatini söyle,<br />sana özel bir rota hazırlayalım.
            </p>

            {/* Search */}
            <form
              onSubmit={aramaGonder}
              className="anim-fade-up relative max-w-md mx-auto mb-4"
              style={{ animationDelay: "200ms" }}
            >
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Galata, Karaköy, Balat… bir yer yaz"
                className="w-full pl-4 pr-28 py-3.5 rounded-full border border-white/15 text-sm bg-white/10 text-white placeholder:text-white/40 backdrop-blur-sm outline-none focus:border-coral focus:shadow-[0_0_0_4px_rgba(244,81,44,0.22)] transition-all"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-coral hover:bg-coral-dark text-white text-xs font-medium px-4 py-2 rounded-full flex items-center gap-1.5 transition-colors"
              >
                <IconArrowRight size={14} />
                Rota Bul
              </button>
            </form>

            {/* CTA'lar */}
            <div className="anim-fade-up flex items-center gap-2 justify-center flex-wrap mb-3" style={{ animationDelay: "280ms" }}>
              <Link href="/rota-olustur" className="anim-nabiz inline-flex items-center gap-2 bg-coral hover:bg-coral-dark text-white text-sm font-semibold px-6 py-2.5 rounded-full transition-colors shadow-[0_8px_30px_rgba(244,81,44,0.4)]">
                <IconRoute size={15} />
                AI ile Rota Oluştur
              </Link>
              <Link href="/yerler" className="inline-flex items-center gap-2 border border-white/20 text-white text-sm font-medium px-6 py-2.5 rounded-full hover:bg-white/10 hover:-translate-y-0.5 transition-all">
                <IconMapPin size={15} />
                Yerleri Keşfet
              </Link>
            </div>
            <div className="anim-fade-up flex justify-center mb-5" style={{ animationDelay: "320ms" }}>
              <Link
                href="/rehberler"
                className="balon inline-flex items-center gap-2 text-white text-sm font-medium border border-white/20 px-6 py-2.5 rounded-full bg-white/10 hover:border-coral hover:bg-white/15 transition-colors"
              >
                <IconUsers size={15} className="text-coral" />
                Gerçek Bir Gezginle Keşfet
              </Link>
            </div>

            {/* Yüzen keşfet baloncukları — üstüne gelince düşünce balonu belirir, tıklayınca gerçek arama açılır */}
            <div className="flex flex-wrap gap-2.5 justify-center">
              {CHIPS.map((chip, i) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => router.push(`/yerler?ara=${encodeURIComponent(chip.q)}`)}
                  className="balon text-xs text-white/80 border border-white/20 px-3.5 py-2 rounded-full bg-white/10 hover:border-coral"
                  style={{ animationDelay: `${i * -0.7}s`, animationDuration: `${3.2 + (i % 3) * 0.5}s` }}
                >
                  <span className="balon-ipucu">{chip.ipucu}</span>
                  {chip.emoji} {chip.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* İçerik yaprağı — hero'nun üstüne kayarak gelir */}
        <div className="relative z-10 bg-navy-tint rounded-t-[32px] -mt-10 pt-7 pb-12 shadow-[0_-24px_60px_rgba(4,14,28,0.45)]">
          {/* Tutamaç */}
          <div className="flex justify-center mb-5">
            <div className="w-10 h-1 rounded-full bg-navy-line" />
          </div>

          <div className="mx-auto w-full max-w-6xl px-5">

          {/* Suggest strip */}
          <div
            className="reveal kart-3d mx-auto w-full max-w-2xl mb-6 bg-white border border-navy-line/60 rounded-2xl px-4 py-3.5 flex items-center gap-3 cursor-pointer"
            onMouseMove={egimVer}
            onMouseLeave={egimSifirla}
          >
            <div className="w-9 h-9 bg-coral rounded-xl flex items-center justify-center flex-shrink-0">
              <IconSparkles size={18} color="white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-navy truncate">
                Balat&apos;ı sevmiştin — Fener de tam sana göre
              </p>
              <p className="text-xs text-navy-soft">Renkli sokaklar, 3 durak · yaklaşık 4 saat</p>
            </div>
            <IconChevronRight size={20} className="text-navy-soft flex-shrink-0" />
          </div>

          {/* Online users */}
          <div className="reveal flex items-center justify-center gap-2 mb-8">
            <span className="w-2 h-2 rounded-full bg-green-600 flex-shrink-0 anim-nabiz" />
            <div className="flex">
              {ONLINE_AVATARS.map((av, i) => (
                <div
                  key={av.init}
                  className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-medium"
                  style={{ background: av.bg, color: av.color, marginLeft: i === 0 ? 0 : -8 }}
                >
                  {av.init}
                </div>
              ))}
            </div>
            <OnlineSayaci />
          </div>

          {/* Feed */}
          <section>
            <div className="reveal flex items-center justify-between mb-4">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-navy">
                <IconClock size={18} className="text-coral" />
                Son Geziler
              </h2>
              <button className="text-xs text-coral hover:text-coral-dark transition-colors">
                Tümünü Gör
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {/* Gerçek paylaşımlar — kullanıcılar rota paylaştıkça burası dolar */}
              {gercekler.map((post) => {
                const kAd = post.kullanici?.username || "gezgin";
                const renk = AVATAR_PALET[isimKarma(kAd) % AVATAR_PALET.length];
                const gradyan = KART_GRADYANLAR[isimKarma(post.id) % KART_GRADYANLAR.length];
                const yerler = post.duraklar.filter((d) => !d.mola).map((d) => d.mekan);
                return (
                  <article
                    key={post.id}
                    className="reveal kart-3d bg-white border border-navy-line/50 rounded-2xl p-3.5 shadow-sm"
                    onMouseMove={egimVer}
                    onMouseLeave={egimSifirla}
                  >
                    <div className="flex items-center gap-2.5 mb-2.5">
                      <Link
                        href={`/profil/${kAd}`}
                        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 overflow-hidden"
                        style={{ background: renk.bg, color: renk.color }}
                      >
                        {post.kullanici?.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={post.kullanici.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          kAd.slice(0, 2).toUpperCase()
                        )}
                      </Link>
                      <div className="flex-1">
                        <Link href={`/profil/${kAd}`} className="text-xs font-medium text-gray-900 hover:text-coral transition-colors">
                          {kAd}
                        </Link>
                        <p className="text-[11px] text-gray-400">{zamanOnce(post.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-navy bg-navy-tint px-2.5 py-1 rounded-full border border-navy-line">
                        <IconRoute size={13} />
                        {yerler.length} durak
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
                      {yerler.slice(0, 4).map((stop, j) => (
                        <span key={stop + j} className="flex items-center gap-1">
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <IconMapPin size={13} className="text-coral" />
                            {stop}
                          </span>
                          {j < Math.min(yerler.length, 4) - 1 && <span className="text-gray-300 text-xs">›</span>}
                        </span>
                      ))}
                    </div>

                    <div className="w-full h-36 rounded-xl flex items-end p-2.5 mb-2.5 relative overflow-hidden" style={{ background: gradyan }}>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      <span className="relative text-white text-xs font-medium">{post.baslik}</span>
                    </div>

                    <div className="flex items-center gap-4">
                      <button
                        onClick={(e) => gercekBegen(post.id, e)}
                        className={`relative flex items-center gap-1 text-xs transition-colors ${
                          post.begendim ? "text-coral" : "text-gray-400 hover:text-coral"
                        }`}
                      >
                        {post.begendim ? <IconHeartFilled size={16} /> : <IconHeart size={16} />}
                        {post.begeniSayisi}
                      </button>
                      <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-coral transition-colors">
                        <IconBookmark size={16} />
                        Kaydet
                      </button>
                    </div>
                  </article>
                );
              })}

              {gercekler.length === 0 && posts.map((post) => (
                <article
                  key={post.id}
                  className="reveal kart-3d bg-white border border-navy-line/50 rounded-2xl p-3.5 shadow-sm"
                  onMouseMove={egimVer}
                  onMouseLeave={egimSifirla}
                >
                  {/* Post header */}
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0"
                      style={{ background: post.avatarBg, color: post.avatarColor }}
                    >
                      {post.initials}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-900">{post.username}</p>
                      <p className="text-[11px] text-gray-400">{post.time}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-navy bg-navy-tint px-2.5 py-1 rounded-full border border-navy-line">
                      <IconRoute size={13} />
                      {post.stopCount} durak
                    </div>
                  </div>

                  {/* Stops */}
                  <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
                    {post.stops.map((stop, i) => (
                      <span key={stop} className="flex items-center gap-1">
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <IconMapPin size={13} className="text-coral" />
                          {stop}
                        </span>
                        {i < post.stops.length - 1 && (
                          <span className="text-gray-300 text-xs">›</span>
                        )}
                      </span>
                    ))}
                  </div>

                  {/* Image */}
                  <div
                    className="w-full h-36 rounded-xl flex items-end p-2.5 mb-2.5 relative overflow-hidden"
                    style={{ background: post.imageBg }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <span className="relative text-white text-xs font-medium">{post.imageLabel}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-4">
                    <button
                      onClick={(e) => toggleLike(post.id, e)}
                      className={`relative flex items-center gap-1 text-xs transition-colors ${
                        post.liked ? "text-coral" : "text-gray-400 hover:text-coral"
                      }`}
                    >
                      {post.liked ? <IconHeartFilled size={16} /> : <IconHeart size={16} />}
                      {post.likes}
                    </button>
                    <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-coral transition-colors">
                      <IconMessageCircle size={16} />
                      {post.comments} yorum
                    </button>
                    <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-coral transition-colors">
                      <IconBookmark size={16} />
                      Kaydet
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
          </div>
        </div>
    </div>
  );
}
