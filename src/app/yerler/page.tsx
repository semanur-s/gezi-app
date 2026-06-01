"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import {
  IconArrowLeft,
  IconMap2,
  IconSearch,
  IconMapPin,
  IconCheck,
  IconBookmark,
  IconBookmarkFilled,
  IconRoute,
} from "@tabler/icons-react";

interface Place {
  id: string;
  name: string;
  category: string;
  district: string;
  description: string;
  duration_minutes: number;
  tags: string[];
}

const KATEGORI_RENK: Record<string, string> = {
  tarihi: "bg-amber-50 text-amber-700 border-amber-200",
  müze: "bg-purple-50 text-purple-700 border-purple-200",
  park: "bg-green-50 text-green-700 border-green-200",
  alışveriş: "bg-pink-50 text-pink-700 border-pink-200",
  yürüyüş: "bg-blue-50 text-blue-700 border-blue-200",
  meydan: "bg-orange-50 text-orange-700 border-orange-200",
  sokak: "bg-rose-50 text-rose-700 border-rose-200",
  kültür: "bg-indigo-50 text-indigo-700 border-indigo-200",
  tur: "bg-cyan-50 text-cyan-700 border-cyan-200",
  ada: "bg-teal-50 text-teal-700 border-teal-200",
};

export default function YerlerPage() {
  const router = useRouter();
  const [aramaMetni, setAramaMetni] = useState("");
  const [places, setPlaces] = useState<Place[]>([]);
  const [filtrelenmis, setFiltrelenmis] = useState<Place[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [gezilen, setGezilen] = useState<string[]>([]);
  const [gidilecek, setGidilecek] = useState<string[]>([]);
  const [islemYapiliyor, setIslemYapiliyor] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    async function fetchAll() {
      const [{ data: { user } }, { data: placesData }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from("places").select("*").order("name"),
      ]);
      setUser(user);
      setPlaces(placesData || []);
      setFiltrelenmis(placesData || []);

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("gezilen_yerler, gidilecek_yerler")
          .eq("id", user.id)
          .single();
        if (profile) {
          setGezilen(profile.gezilen_yerler || []);
          setGidilecek(profile.gidilecek_yerler || []);
        }
      }
      setYukleniyor(false);
    }
    fetchAll();
  }, []);

  const ara = useCallback((metin: string) => {
    const q = metin.toLowerCase().trim();
    if (!q) { setFiltrelenmis(places); return; }
    setFiltrelenmis(
      places.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.district.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
      )
    );
  }, [places]);

  useEffect(() => { ara(aramaMetni); }, [aramaMetni, ara]);

  async function toggleGezilen(placeName: string) {
    if (!user) { router.push("/giris"); return; }
    setIslemYapiliyor(placeName + "_gezilen");
    const supabase = createClient();
    const yeni = gezilen.includes(placeName)
      ? gezilen.filter((n) => n !== placeName)
      : [...gezilen, placeName];
    setGezilen(yeni);
    await supabase.from("profiles").update({ gezilen_yerler: yeni }).eq("id", user.id);
    setIslemYapiliyor(null);
  }

  async function toggleGidilecek(placeName: string) {
    if (!user) { router.push("/giris"); return; }
    setIslemYapiliyor(placeName + "_gidilecek");
    const supabase = createClient();
    const yeni = gidilecek.includes(placeName)
      ? gidilecek.filter((n) => n !== placeName)
      : [...gidilecek, placeName];
    setGidilecek(yeni);
    await supabase.from("profiles").update({ gidilecek_yerler: yeni }).eq("id", user.id);
    setIslemYapiliyor(null);
  }

  function rotaOlustur(placeName: string) {
    router.push(`/rota-olustur?yer=${encodeURIComponent(placeName)}`);
  }

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

      {/* Arama */}
      <div className="px-5 pt-5 pb-3 sticky top-[57px] bg-white z-10">
        <div className="relative">
          <IconSearch size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={aramaMetni}
            onChange={(e) => setAramaMetni(e.target.value)}
            placeholder="Galata, müze, Kadıköy..."
            autoFocus
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-full text-sm placeholder-gray-400 focus:outline-none focus:border-[#C2622A] transition-colors"
          />
        </div>
        <div className="flex items-center justify-between mt-2.5">
          <p className="text-[11px] text-gray-400">{filtrelenmis.length} yer</p>
          {!user && (
            <p className="text-[11px] text-gray-400">
              <Link href="/giris" className="text-[#C2622A]">Giriş yap</Link> → kaydet & rota oluştur
            </p>
          )}
        </div>
      </div>

      {/* Liste */}
      {yukleniyor ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 rounded-full border-2 border-[#C2622A] border-t-transparent animate-spin" />
        </div>
      ) : filtrelenmis.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-gray-400">Sonuç bulunamadı</p>
        </div>
      ) : (
        <div className="px-5 pb-10 flex flex-col gap-3 mt-1">
          {filtrelenmis.map((place) => {
            const isGezilen = gezilen.includes(place.name);
            const isGidilecek = gidilecek.includes(place.name);
            const renk = KATEGORI_RENK[place.category] || "bg-gray-50 text-gray-600 border-gray-200";

            return (
              <div key={place.id} className="border border-gray-100 rounded-2xl p-4">
                {/* Üst satır */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900">{place.name}</p>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${renk}`}>
                        {place.category}
                      </span>
                      {isGezilen && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
                          <IconCheck size={9} />
                          Gezildi
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
                      <IconMapPin size={10} />
                      {place.district} · ~{place.duration_minutes} dk
                    </p>
                  </div>
                </div>

                <p className="text-xs text-gray-500 leading-relaxed mb-3">{place.description}</p>

                {/* Aksiyonlar */}
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleGidilecek(place.name)}
                    disabled={islemYapiliyor === place.name + "_gidilecek"}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      isGidilecek
                        ? "bg-[#FDF0E8] border-[#C2622A] text-[#C2622A]"
                        : "border-gray-200 text-gray-500 hover:border-[#C2622A] hover:text-[#C2622A]"
                    }`}
                  >
                    {isGidilecek ? <IconBookmarkFilled size={12} /> : <IconBookmark size={12} />}
                    {isGidilecek ? "Listede" : "Gitmek istiyorum"}
                  </button>

                  <button
                    onClick={() => toggleGezilen(place.name)}
                    disabled={islemYapiliyor === place.name + "_gezilen"}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      isGezilen
                        ? "bg-green-50 border-green-500 text-green-700"
                        : "border-gray-200 text-gray-500 hover:border-green-500 hover:text-green-600"
                    }`}
                  >
                    <IconCheck size={12} />
                    {isGezilen ? "Gezdim ✓" : "Gezdim"}
                  </button>

                  <button
                    onClick={() => rotaOlustur(place.name)}
                    className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#C2622A] text-white hover:bg-[#a8521f] transition-colors"
                  >
                    <IconRoute size={12} />
                    Rota
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
