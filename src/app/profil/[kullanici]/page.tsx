"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import {
  IconMap2,
  IconArrowLeft,
  IconSettings,
  IconRoute,
  IconMapPin,
} from "@tabler/icons-react";

interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
}

const MOCK_GEZILER = [
  { id: 1, label: "Galata → Karaköy", imageBg: "linear-gradient(135deg, #E8B48A 0%, #C2622A 100%)", stopCount: 5 },
  { id: 2, label: "Balat → Fener", imageBg: "linear-gradient(135deg, #A8D08A 0%, #3B6D11 100%)", stopCount: 4 },
  { id: 3, label: "Boğaz turu", imageBg: "linear-gradient(135deg, #8AB4D0 0%, #1A5E75 100%)", stopCount: 3 },
];

export default function ProfilPage() {
  const params = useParams();
  const kullanici = params.kullanici as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function fetchData() {
      const [{ data: { user } }, { data: profileData }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from("profiles").select("*").eq("username", kullanici).single(),
      ]);
      setCurrentUser(user);
      setProfile(profileData);
      setYukleniyor(false);
    }

    fetchData();
  }, [kullanici]);

  const isOwnProfile = currentUser && profile && currentUser.id === profile.id;

  const initials = (profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("") || profile?.username?.charAt(0) || "?").toUpperCase();

  if (yukleniyor) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#C2622A] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-3">
        <p className="text-sm text-gray-500">Bu kullanıcı bulunamadı.</p>
        <Link href="/" className="text-xs text-[#C2622A]">Ana sayfaya dön</Link>
      </div>
    );
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
        {isOwnProfile ? (
          <button className="text-gray-500 hover:text-gray-800 transition-colors">
            <IconSettings size={20} />
          </button>
        ) : (
          <div className="w-5" />
        )}
      </header>

      {/* Profil başlığı */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-4 mb-4">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-[#FDE8D8] flex items-center justify-center text-2xl font-medium text-[#9B4A1E] flex-shrink-0 overflow-hidden border-2 border-[#E8B48A]">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt={profile.full_name || ""} className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>

          {/* İstatistikler */}
          <div className="flex-1 flex justify-around">
            <div className="text-center">
              <p className="text-base font-semibold text-gray-900">{MOCK_GEZILER.length}</p>
              <p className="text-xs text-gray-500">Gezi</p>
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-gray-900">0</p>
              <p className="text-xs text-gray-500">Takipçi</p>
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-gray-900">0</p>
              <p className="text-xs text-gray-500">Takip</p>
            </div>
          </div>
        </div>

        {/* İsim & bio */}
        <div className="mb-4">
          <p className="text-sm font-semibold text-gray-900">
            {profile.full_name || profile.username}
          </p>
          <p className="text-xs text-gray-400">@{profile.username}</p>
          {profile.bio && (
            <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">{profile.bio}</p>
          )}
        </div>

        {/* Buton */}
        {isOwnProfile ? (
          <Link href="/profil/duzenle" className="block w-full border border-gray-200 rounded-full py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors text-center">
            Profili Düzenle
          </Link>
        ) : (
          <button className="w-full bg-[#C2622A] hover:bg-[#a8521f] text-white rounded-full py-2 text-xs font-medium transition-colors">
            Takip Et
          </button>
        )}
      </div>

      {/* Gezi grid */}
      <div className="border-t border-gray-100 px-5 pt-4">
        <p className="text-xs font-medium text-gray-500 mb-3 flex items-center gap-1.5">
          <IconRoute size={14} className="text-[#C2622A]" />
          Geziler
        </p>
        <div className="grid grid-cols-3 gap-1.5 pb-10">
          {MOCK_GEZILER.map((gezi) => (
            <div
              key={gezi.id}
              className="aspect-square rounded-xl relative overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
              style={{ background: gezi.imageBg }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-1.5 left-2 right-2">
                <p className="text-white text-[10px] font-medium truncate">{gezi.label}</p>
                <p className="text-white/70 text-[9px] flex items-center gap-0.5">
                  <IconMapPin size={8} />
                  {gezi.stopCount} durak
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
