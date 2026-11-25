"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { IconMap2, IconAt, IconSparkles } from "@tabler/icons-react";

export default function HosgeldinPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [kullaniciAdi, setKullaniciAdi] = useState("");
  const [yukleniyor, setYukleniyor] = useState(true);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [hata, setHata] = useState("");

  useEffect(() => {
    const supabase = createClient();
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/giris"); return; }
      setUserId(user.id);
      setFullName(user.user_metadata?.full_name || "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.username) {
        router.push(`/profil/${profile.username}`);
        return;
      }

      // E-postadan kullanıcı adı önerisi türet
      const oneri = (user.email?.split("@")[0] || "")
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "_")
        .slice(0, 20);
      setKullaniciAdi(oneri);
      setYukleniyor(false);
    }
    init();
  }, [router]);

  async function kaydet(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setHata("");
    setKaydediliyor(true);

    const supabase = createClient();
    const username = kullaniciAdi.trim().toLowerCase();

    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
      setHata("Kullanıcı adı 3-20 karakter olmalı; küçük harf, rakam ve _ kullanılabilir.");
      setKaydediliyor(false);
      return;
    }

    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .neq("id", userId)
      .maybeSingle();
    if (existing) {
      setHata("Bu kullanıcı adı zaten alınmış, başka bir tane dene.");
      setKaydediliyor(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .upsert({ id: userId, username, full_name: fullName.trim() || null });

    if (error) {
      setHata("Bir hata oluştu, tekrar dene.");
      setKaydediliyor(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  if (yukleniyor) {
    return (
      <div className="min-h-screen bg-navy-deep flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-coral border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-navy-deep flex items-center justify-center px-5 overflow-hidden">
      <div className="blob blob-1 w-72 h-72 -top-16 -left-20" style={{ background: "#f4512c" }} />
      <div className="blob blob-2 w-80 h-80 bottom-0 -right-24" style={{ background: "#3c6a9e" }} />

      <div className="relative anim-pop-in bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-xl bg-navy flex items-center justify-center">
            <IconMap2 size={20} color="white" />
          </div>
          <span className="font-brand text-2xl text-navy">
            Gezi <span className="text-coral">App</span>
          </span>
        </div>

        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 bg-navy-tint text-navy text-xs px-3 py-1 rounded-full border border-navy-line mb-3">
            <IconSparkles size={12} />
            Aramıza hoş geldin
          </div>
          <h1 className="font-display text-xl font-bold text-navy">Kullanıcı Adını Seç</h1>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
            Arkadaşların seni bu adla bulacak — &ldquo;Gezi App&rsquo;teki adın ne?&rdquo; sorusunun cevabı bu.
          </p>
        </div>

        <form onSubmit={kaydet} className="flex flex-col gap-3">
          <div className="relative">
            <IconAt size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="kullanici_adi"
              value={kullaniciAdi}
              onChange={(e) => setKullaniciAdi(e.target.value.toLowerCase())}
              maxLength={20}
              required
              autoFocus
              className="w-full pl-10 pr-4 py-3 rounded-full border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-coral transition-colors"
            />
          </div>
          <p className="text-[11px] text-gray-400 px-2">3-20 karakter; küçük harf, rakam ve _ kullanılabilir.</p>

          {hata && <p className="text-xs text-red-500 text-center">{hata}</p>}

          <button
            type="submit"
            disabled={kaydediliyor}
            className="w-full bg-coral hover:bg-coral-dark disabled:opacity-60 text-white text-sm font-medium py-3 rounded-full transition-colors mt-1"
          >
            {kaydediliyor ? "..." : "Devam Et"}
          </button>
        </form>
      </div>
    </div>
  );
}
