"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
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
} from "@tabler/icons-react";

const CHIPS = [
  "🗺 tarihi yarımada",
  "☕ kafe rotaları",
  "🎨 sokak sanatı",
  "⛵ boğaz turu",
  "🌧 yağmurlu gün",
];

const ONLINE_AVATARS = [
  { init: "AY", bg: "#FDE8D8", color: "#9B4A1E" },
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
    avatarBg: "#FDE8D8",
    avatarColor: "#9B4A1E",
    time: "2 saat önce",
    stopCount: 5,
    stops: ["Karaköy", "Galata", "Tünel", "Pera"],
    imageBg: "linear-gradient(135deg, #E8B48A 0%, #C2622A 100%)",
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

export default function Home() {
  const [search, setSearch] = useState("");
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

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
    }

    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) setUsername(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function cikisYap() {
    const supabase = createClient();
    await supabase.auth.signOut();
  }

  const toggleLike = (id: number) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
          : p
      )
    );
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 max-w-lg mx-auto">
      {/* Topbar */}
      <header className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#C2622A] flex items-center justify-center">
            <IconMap2 size={16} color="white" />
          </div>
          <span className="text-sm font-medium text-gray-900">
            gez<span className="text-[#C2622A]">im</span>
          </span>
        </div>
        <nav className="flex items-center gap-5">
          <a href="#" className="text-xs text-gray-500 hover:text-gray-800 transition-colors">keşfet</a>
          <a href="#" className="text-xs text-gray-500 hover:text-gray-800 transition-colors">rotalar</a>
          {user ? (
            <div className="flex items-center gap-2">
              <Link
                href={username ? `/profil/${username}` : "#"}
                className="w-7 h-7 rounded-full bg-[#FDE8D8] text-[#9B4A1E] flex items-center justify-center text-xs font-medium hover:opacity-80 transition-opacity overflow-hidden"
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
                className="text-xs text-gray-500 hover:text-gray-800 transition-colors"
              >
                Çıkış
              </button>
            </div>
          ) : (
            <Link
              href="/giris"
              className="text-xs font-medium text-white bg-[#C2622A] px-3.5 py-1.5 rounded-full hover:bg-[#a8521f] transition-colors"
            >
              giriş yap
            </Link>
          )}
        </nav>
      </header>

      {/* Hero */}
      <section className="px-5 pt-12 pb-8 text-center">
        <div className="inline-flex items-center gap-1.5 bg-[#FDF0E8] text-[#9B4A1E] text-xs px-3 py-1 rounded-full border border-[#E8B48A] mb-4">
          <IconSparkles size={12} />
          İstanbul seni bekliyor
        </div>
        <h1 className="text-[26px] font-medium text-gray-900 leading-snug mb-2.5">
          Bugün <span className="text-[#C2622A]">nereyi</span> keşfediyorsun?
        </h1>
        <p className="text-sm text-gray-500 mb-7 leading-relaxed">
          Gideceğin yeri ve müsait saatini söyle,<br />sana özel bir rota hazırlayalım.
        </p>

        {/* Search */}
        <div className="relative max-w-sm mx-auto mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Galata, Karaköy, Balat… bir yer yaz"
            className="w-full pl-4 pr-28 py-3.5 rounded-full border border-[#E8B48A] text-sm bg-white placeholder:text-gray-400 outline-none focus:border-[#C2622A] transition-colors"
          />
          <button className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-[#C2622A] hover:bg-[#a8521f] text-white text-xs font-medium px-4 py-2 rounded-full flex items-center gap-1.5 transition-colors">
            <IconArrowRight size={14} />
            rota bul
          </button>
        </div>

        {/* Rota oluştur CTA */}
        <div className="flex items-center gap-2 justify-center flex-wrap">
          <Link href="/rota-olustur" className="inline-flex items-center gap-2 bg-[#C2622A] hover:bg-[#a8521f] text-white text-sm font-medium px-6 py-2.5 rounded-full transition-colors">
            <IconRoute size={15} />
            AI ile rota oluştur
          </Link>
          <Link href="/yerler" className="inline-flex items-center gap-2 border border-[#E8B48A] text-[#9B4A1E] text-sm font-medium px-6 py-2.5 rounded-full hover:bg-[#FDF0E8] transition-colors">
            <IconMapPin size={15} />
            Yerleri keşfet
          </Link>
        </div>

        {/* Chips */}
        <div className="flex flex-wrap gap-2 justify-center">
          {CHIPS.map((chip) => (
            <button
              key={chip}
              className="text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-full bg-white hover:border-[#C2622A] hover:text-[#C2622A] transition-colors"
            >
              {chip}
            </button>
          ))}
        </div>
      </section>

      {/* Suggest strip */}
      <div className="mx-5 mb-7 bg-[#FDF0E8] border border-[#E8B48A] rounded-2xl px-4 py-3.5 flex items-center gap-3 cursor-pointer hover:bg-[#f9e8d6] transition-colors">
        <div className="w-9 h-9 bg-[#C2622A] rounded-xl flex items-center justify-center flex-shrink-0">
          <IconSparkles size={18} color="white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#9B4A1E] truncate">
            Balat&apos;ı sevmiştin — Fener de tam sana göre
          </p>
          <p className="text-xs text-[#B5723A]">Renkli sokaklar, 3 durak · yaklaşık 4 saat</p>
        </div>
        <IconChevronRight size={20} className="text-[#C2622A] flex-shrink-0" />
      </div>

      {/* Online users */}
      <div className="flex items-center gap-2 px-5 mb-6">
        <span className="w-2 h-2 rounded-full bg-green-600 flex-shrink-0" />
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
        <span className="text-xs text-gray-500">
          şu an <strong className="text-gray-700">127 kişi</strong> İstanbul&apos;u keşfediyor
        </span>
      </div>

      {/* Feed */}
      <section className="px-5 pb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="flex items-center gap-2 text-sm font-medium text-gray-900">
            <IconClock size={18} className="text-[#C2622A]" />
            son geziler
          </h2>
          <button className="text-xs text-[#C2622A] hover:text-[#a8521f] transition-colors">
            tümünü gör
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {posts.map((post) => (
            <article key={post.id} className="bg-white border border-gray-100 rounded-2xl p-3.5 shadow-sm">
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
                <div className="flex items-center gap-1 text-xs text-[#9B4A1E] bg-[#FDF0E8] px-2.5 py-1 rounded-full border border-[#E8B48A]">
                  <IconRoute size={13} />
                  {post.stopCount} durak
                </div>
              </div>

              {/* Stops */}
              <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
                {post.stops.map((stop, i) => (
                  <span key={stop} className="flex items-center gap-1">
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <IconMapPin size={13} className="text-[#C2622A]" />
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
                  onClick={() => toggleLike(post.id)}
                  className={`flex items-center gap-1 text-xs transition-colors ${
                    post.liked ? "text-[#C2622A]" : "text-gray-400 hover:text-[#C2622A]"
                  }`}
                >
                  {post.liked ? <IconHeartFilled size={16} /> : <IconHeart size={16} />}
                  {post.likes}
                </button>
                <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#C2622A] transition-colors">
                  <IconMessageCircle size={16} />
                  {post.comments} yorum
                </button>
                <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#C2622A] transition-colors">
                  <IconBookmark size={16} />
                  kaydet
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}


