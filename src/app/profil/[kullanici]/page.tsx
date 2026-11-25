"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { seviyeBul } from "@/lib/seviye";
import type { User } from "@supabase/supabase-js";
import {
  IconMap2,
  IconArrowLeft,
  IconSettings,
  IconRoute,
  IconMapPin,
  IconCheck,
  IconBookmarkFilled,
  IconTrophy,
  IconShare2,
} from "@tabler/icons-react";

interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  puan: number;
  toplam_gezi_dk: number;
  gezilen_yerler: string[];
  gidilecek_yerler: string[];
}

interface ProfilRota {
  id: string;
  baslik: string;
  duraklar: { mekan: string; mola?: boolean }[];
  created_at: string;
  herkese_acik: boolean;
}

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

export default function ProfilPage() {
  const params = useParams();
  const router = useRouter();
  const kullanici = params.kullanici as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [rotalar, setRotalar] = useState<ProfilRota[]>([]);
  const [takipciSayisi, setTakipciSayisi] = useState(0);
  const [takipSayisi, setTakipSayisi] = useState(0);
  const [takipteyim, setTakipteyim] = useState(false);
  const [takipYukleniyor, setTakipYukleniyor] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [cubukDolu, setCubukDolu] = useState(false);
  const [paylasKopyalandi, setPaylasKopyalandi] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function fetchData() {
      const [{ data: { user } }, { data: profileData }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from("profiles").select("*").eq("username", kullanici).single(),
      ]);
      setCurrentUser(user);
      setProfile(profileData);

      if (profileData) {
        const [rotaRes, takipciRes, takipRes, benRes] = await Promise.all([
          supabase
            .from("routes")
            .select("id, baslik, duraklar, created_at, herkese_acik")
            .eq("user_id", profileData.id)
            // Başkasının profilinde sadece paylaşılanlar; kendi profilinde gizliler de görünür
            .match(user?.id === profileData.id ? {} : { herkese_acik: true })
            .order("created_at", { ascending: false })
            .limit(30),
          supabase
            .from("follows")
            .select("*", { count: "exact", head: true })
            .eq("following_id", profileData.id),
          supabase
            .from("follows")
            .select("*", { count: "exact", head: true })
            .eq("follower_id", profileData.id),
          user
            ? supabase
                .from("follows")
                .select("follower_id")
                .eq("follower_id", user.id)
                .eq("following_id", profileData.id)
                .maybeSingle()
            : Promise.resolve({ data: null }),
        ]);
        setRotalar((rotaRes.data as ProfilRota[]) || []);
        setTakipciSayisi(takipciRes.count ?? 0);
        setTakipSayisi(takipRes.count ?? 0);
        setTakipteyim(!!benRes.data);
      }
      setYukleniyor(false);
      // Puan çubuğu dolum animasyonu için bir tık sonra tetikle
      setTimeout(() => setCubukDolu(true), 150);
    }

    fetchData();
  }, [kullanici]);

  const isOwnProfile = currentUser && profile && currentUser.id === profile.id;

  async function takipToggle() {
    if (!currentUser) { router.push("/giris"); return; }
    if (!profile || takipYukleniyor) return;
    setTakipYukleniyor(true);
    const supabase = createClient();
    if (takipteyim) {
      setTakipteyim(false);
      setTakipciSayisi((n) => Math.max(0, n - 1));
      await supabase
        .from("follows")
        .delete()
        .eq("follower_id", currentUser.id)
        .eq("following_id", profile.id);
    } else {
      setTakipteyim(true);
      setTakipciSayisi((n) => n + 1);
      await supabase
        .from("follows")
        .insert({ follower_id: currentUser.id, following_id: profile.id });
    }
    setTakipYukleniyor(false);
  }

  async function gorunurlukDegistir(id: string, herkeseAcik: boolean) {
    const supabase = createClient();
    setRotalar((prev) => prev.map((r) => (r.id === id ? { ...r, herkese_acik: herkeseAcik } : r)));
    const { error } = await supabase.from("routes").update({ herkese_acik: herkeseAcik }).eq("id", id);
    if (error) {
      setRotalar((prev) => prev.map((r) => (r.id === id ? { ...r, herkese_acik: !herkeseAcik } : r)));
    }
  }

  async function profilPaylas() {
    if (!profile) return;
    const url = `${window.location.origin}/profil/${profile.username}`;
    const nav = navigator as Navigator & { share?: (data: ShareData) => Promise<void> };
    if (nav.share) {
      try {
        await nav.share({ title: `@${profile.username} — Gezi App`, url });
      } catch { /* kullanıcı paylaşımı iptal etti */ }
      return;
    }
    await navigator.clipboard.writeText(url);
    setPaylasKopyalandi(true);
    setTimeout(() => setPaylasKopyalandi(false), 2000);
  }

  const initials = (profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("") || profile?.username?.charAt(0) || "?").toUpperCase();

  if (yukleniyor) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-coral border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-3">
        <p className="text-sm text-gray-500">Bu kullanıcı bulunamadı.</p>
        <Link href="/" className="text-xs text-coral">Ana sayfaya dön</Link>
      </div>
    );
  }

  const { mevcut, sonraki, ilerleme } = seviyeBul(profile.puan || 0);
  const geziSaat = Math.round((profile.toplam_gezi_dk || 0) / 60);

  return (
    <div className="min-h-screen bg-white">
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
        {isOwnProfile ? (
          <Link href="/profil/duzenle" className="text-white/70 hover:text-white transition-colors">
            <IconSettings size={20} />
          </Link>
        ) : (
          <div className="w-5" />
        )}
      </div></header>

      {/* Profil başlığı */}
      <div className="mx-auto w-full max-w-2xl px-5 pt-6 pb-4">
        <div className="flex items-center gap-4 mb-4 anim-fade-up">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-navy-tint flex items-center justify-center text-2xl font-semibold text-navy flex-shrink-0 overflow-hidden border-2 border-navy-line">
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
              <p className="text-base font-semibold text-navy">{rotalar.length}</p>
              <p className="text-xs text-gray-500">Gezi</p>
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-navy">{takipciSayisi}</p>
              <p className="text-xs text-gray-500">Takipçi</p>
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-navy">{takipSayisi}</p>
              <p className="text-xs text-gray-500">Takip</p>
            </div>
          </div>
        </div>

        {/* İsim & bio */}
        <div className="mb-4 anim-fade-up" style={{ animationDelay: "80ms" }}>
          <p className="text-sm font-semibold text-gray-900">
            {profile.full_name || profile.username}
          </p>
          <p className="text-xs text-gray-400">@{profile.username}</p>
          {profile.bio && (
            <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">{profile.bio}</p>
          )}
        </div>

        {/* Gezgin seviyesi */}
        <div className="mb-4 bg-navy-tint border border-navy-line rounded-2xl p-4 anim-pop-in" style={{ animationDelay: "140ms" }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-navy flex items-center gap-1.5">
              <span className="text-lg">{mevcut.emoji}</span>
              {mevcut.ad}
            </p>
            <p className="text-xs font-semibold text-coral flex items-center gap-1">
              <IconTrophy size={13} />
              {profile.puan || 0} puan
            </p>
          </div>
          <div className="h-2 rounded-full bg-white overflow-hidden mb-1.5">
            <div
              className="puan-cubugu h-full rounded-full bg-gradient-to-r from-coral to-coral-dark"
              style={{ width: cubukDolu ? `${Math.round(ilerleme * 100)}%` : "0%" }}
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-navy-soft">
              {geziSaat > 0 ? `⏱️ Toplam ${geziSaat} saat gezdi` : "Konum doğrulamalı gezilerle saat biriktir"}
            </p>
            {sonraki && (
              <p className="text-[11px] text-navy-soft">
                {sonraki.emoji} {sonraki.ad} için {sonraki.min - (profile.puan || 0)} puan
              </p>
            )}
          </div>
        </div>

        {/* Butonlar */}
        <div className="flex items-center gap-2">
          {isOwnProfile ? (
            <Link href="/profil/duzenle" className="flex-1 border border-gray-200 rounded-full py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors text-center">
              Profili Düzenle
            </Link>
          ) : (
            <button
              onClick={takipToggle}
              disabled={takipYukleniyor}
              className={`anim-secim flex-1 rounded-full py-2 text-xs font-medium transition-colors ${
                takipteyim
                  ? "border border-navy-line bg-navy-tint text-navy"
                  : "bg-coral hover:bg-coral-dark text-white"
              }`}
            >
              {takipteyim ? "✓ Takiptesin" : "Takip Et"}
            </button>
          )}
          <button
            onClick={profilPaylas}
            title="Profili Paylaş"
            className="w-11 h-9 flex-shrink-0 flex items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:border-coral hover:text-coral transition-colors"
          >
            {paylasKopyalandi ? <IconCheck size={15} className="text-green-600" /> : <IconShare2 size={15} />}
          </button>
        </div>
        {paylasKopyalandi && (
          <p className="text-[11px] text-green-600 mt-1.5 text-center anim-pop-in">Bağlantı kopyalandı ✓</p>
        )}
      </div>

      {/* Gezilen yerler */}
      {profile.gezilen_yerler?.length > 0 && (
        <div className="mx-auto w-full max-w-2xl px-5 pb-4">
          <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1.5">
            <IconCheck size={14} className="text-green-600" />
            Gezdiği yerler · {profile.gezilen_yerler.length}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {profile.gezilen_yerler.map((yer, i) => (
              <span
                key={yer}
                className="anim-pop-in text-[11px] bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                {yer}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Gitmek istediği yerler */}
      {profile.gidilecek_yerler?.length > 0 && (
        <div className="mx-auto w-full max-w-2xl px-5 pb-4">
          <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1.5">
            <IconBookmarkFilled size={13} className="text-coral" />
            Gitmek istediği yerler · {profile.gidilecek_yerler.length}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {profile.gidilecek_yerler.map((yer, i) => (
              <span
                key={yer}
                className="anim-pop-in text-[11px] bg-coral-tint text-coral-deep border border-coral-line px-2.5 py-1 rounded-full"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                {yer}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Gezi grid */}
      <div className="mx-auto w-full max-w-2xl border-t border-gray-100 px-5 pt-4">
        <p className="text-xs font-medium text-gray-500 mb-3 flex items-center gap-1.5">
          <IconRoute size={14} className="text-coral" />
          Geziler
        </p>
        {rotalar.length === 0 ? (
          <div className="text-center py-10 pb-14">
            <p className="text-3xl mb-2">🗺️</p>
            <p className="text-xs text-gray-400 mb-3">
              {isOwnProfile ? "Henüz rota oluşturmadın." : "Henüz paylaşılan rota yok."}
            </p>
            {isOwnProfile && (
              <Link
                href="/rota-olustur"
                className="inline-flex items-center gap-1.5 bg-coral hover:bg-coral-dark text-white text-xs font-medium px-5 py-2 rounded-full transition-colors"
              >
                <IconRoute size={13} />
                İlk rotanı oluştur
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 pb-10">
            {rotalar.map((gezi, i) => {
              const durakSayisi = gezi.duraklar?.filter((d) => !d.mola).length ?? 0;
              return (
                <div
                  key={gezi.id}
                  className="anim-pop-in aspect-square rounded-xl relative overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                  style={{
                    background: KART_GRADYANLAR[isimKarma(gezi.id) % KART_GRADYANLAR.length],
                    animationDelay: `${i * 60}ms`,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  {isOwnProfile && (
                    <button
                      onClick={() => gorunurlukDegistir(gezi.id, !gezi.herkese_acik)}
                      title={gezi.herkese_acik ? "Herkese açık — gizlemek için tıkla" : "Sadece sen görüyorsun — paylaşmak için tıkla"}
                      className="absolute top-1.5 right-1.5 rounded-full bg-black/45 hover:bg-black/65 text-white text-[9px] px-1.5 py-0.5 transition-colors"
                    >
                      {gezi.herkese_acik ? "🌍 Herkese açık" : "🔒 Sadece ben"}
                    </button>
                  )}
                  <div className="absolute bottom-1.5 left-2 right-2">
                    <p className="text-white text-[10px] font-medium truncate">{gezi.baslik}</p>
                    <p className="text-white/70 text-[9px] flex items-center gap-0.5">
                      <IconMapPin size={8} />
                      {durakSayisi} durak
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
