"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { IconArrowLeft, IconMap2, IconCheck } from "@tabler/icons-react";

interface FormState {
  full_name: string;
  username: string;
  bio: string;
}

export default function ProfilDuzenlePage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({ full_name: "", username: "", bio: "" });
  const [originalUsername, setOriginalUsername] = useState("");
  const [yukleniyor, setYukleniyor] = useState(true);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [hata, setHata] = useState("");
  const [basarili, setBasarili] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/giris"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, username, bio")
        .eq("id", user.id)
        .single();

      if (profile) {
        setForm({
          full_name: profile.full_name || "",
          username: profile.username || "",
          bio: profile.bio || "",
        });
        setOriginalUsername(profile.username || "");
      }
      setYukleniyor(false);
    }
    fetchProfile();
  }, [router]);

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
      setTimeout(() => {
        router.push(`/profil/${form.username.trim()}`);
      }, 800);
    }
    setKaydediliyor(false);
  }

  if (yukleniyor) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#C2622A] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white max-w-lg mx-auto">
      {/* Topbar */}
      <header className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur-sm z-10">
        <Link href={`/profil/${originalUsername}`} className="text-gray-500 hover:text-gray-800 transition-colors">
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

      {/* Başlık */}
      <div className="px-5 pt-6 pb-2">
        <h1 className="text-base font-semibold text-gray-900">Profili Düzenle</h1>
        <p className="text-xs text-gray-400 mt-0.5">Bilgilerini güncelleyebilirsin.</p>
      </div>

      {/* Form */}
      <form onSubmit={kaydet} className="px-5 pt-4 flex flex-col gap-4">
        {/* Ad Soyad */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-600">Ad Soyad</label>
          <input
            type="text"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            placeholder="Adın ve soyadın"
            maxLength={60}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#C2622A] transition-colors"
          />
        </div>

        {/* Kullanıcı adı */}
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
              className="w-full border border-gray-200 rounded-xl pl-8 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#C2622A] transition-colors"
            />
          </div>
          <p className="text-[11px] text-gray-400">3-20 karakter, küçük harf, rakam ve _ kullanılabilir.</p>
        </div>

        {/* Bio */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-600">Bio</label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            placeholder="Kendinden kısaca bahset..."
            maxLength={160}
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#C2622A] transition-colors resize-none"
          />
          <p className="text-[11px] text-gray-400 text-right">{form.bio.length}/160</p>
        </div>

        {/* Hata */}
        {hata && (
          <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">{hata}</p>
        )}

        {/* Kaydet butonu */}
        <button
          type="submit"
          disabled={kaydediliyor || basarili}
          className="w-full bg-[#C2622A] hover:bg-[#a8521f] disabled:opacity-60 text-white rounded-full py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2 mt-2"
        >
          {basarili ? (
            <>
              <IconCheck size={16} />
              Kaydedildi
            </>
          ) : kaydediliyor ? (
            <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
          ) : (
            "Kaydet"
          )}
        </button>
      </form>
    </div>
  );
}
