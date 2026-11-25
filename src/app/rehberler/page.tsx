"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { seviyeBul } from "@/lib/seviye";
import { egimVer, egimSifirla } from "@/lib/etkilesim";
import type { User } from "@supabase/supabase-js";
import {
  IconArrowLeft,
  IconMap2,
  IconMapPin,
  IconTrophy,
  IconRoute,
  IconSend,
  IconX,
  IconCheck,
  IconUsers,
} from "@tabler/icons-react";

interface Rehber {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  puan: number;
  gezilen_yerler: string[];
  rehber_aciklama: string | null;
  rehber_fiyat_bilgisi: string | null;
  rehber_bolgeler: string[];
}

export default function RehberlerPage() {
  const router = useRouter();
  const [rehberler, setRehberler] = useState<Rehber[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [acikRehber, setAcikRehber] = useState<Rehber | null>(null);
  const [mesaj, setMesaj] = useState("");
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [gonderildi, setGonderildi] = useState(false);
  const [hata, setHata] = useState("");

  useEffect(() => {
    const supabase = createClient();
    async function fetchAll() {
      const [{ data: { user } }, { data }] = await Promise.all([
        supabase.auth.getUser(),
        supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url, puan, gezilen_yerler, rehber_aciklama, rehber_fiyat_bilgisi, rehber_bolgeler")
          .eq("rehber_mi", true)
          .order("puan", { ascending: false }),
      ]);
      setUser(user);
      setRehberler((data as Rehber[]) || []);
      setYukleniyor(false);
    }
    fetchAll();
  }, []);

  function talepAc(rehber: Rehber) {
    if (!user) { router.push("/giris"); return; }
    setAcikRehber(rehber);
    setMesaj("");
    setGonderildi(false);
    setHata("");
  }

  async function talepGonder(e: React.FormEvent) {
    e.preventDefault();
    if (!acikRehber || !user) return;
    if (mesaj.trim().length < 10) { setHata("Kısaca ne istediğini yazar mısın?"); return; }
    setHata("");
    setGonderiliyor(true);
    const supabase = createClient();
    const { error } = await supabase.from("rehber_talepleri").insert({
      rehber_id: acikRehber.id,
      talep_eden_id: user.id,
      mesaj: mesaj.trim(),
    });
    if (error) {
      setHata("Talep gönderilemedi, tekrar dene.");
    } else {
      setGonderildi(true);
    }
    setGonderiliyor(false);
  }

  return (
    <div className="min-h-screen bg-navy-tint">
      <header className="border-b border-white/10 sticky top-0 bg-navy/90 backdrop-blur-md z-20">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-3.5">
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
          <div className="w-5" />
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-5 pt-8 pb-16">
        <div className="text-center mb-8 anim-fade-up">
          <p className="font-flourish text-3xl text-coral mb-1">Gerçek Gezginlerle</p>
          <h1 className="font-display text-2xl font-bold text-navy">İnsan Rehberle Keşfet</h1>
          <p className="text-xs text-gray-500 mt-2 max-w-md mx-auto leading-relaxed">
            Bu şehri gerçekten yaşamış, gezmiş insanlarla tanış — onlar senin için değil, seninle birlikte gezer.
          </p>
          <Link
            href="/rehber-ol"
            className="hover-buyu inline-flex items-center gap-1.5 mt-3 text-xs font-medium text-coral"
          >
            <IconUsers size={14} />
            sen de rehber olmak ister misin?
          </Link>
        </div>

        {yukleniyor ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 rounded-full border-2 border-coral border-t-transparent animate-spin" />
          </div>
        ) : rehberler.length === 0 ? (
          <div className="anim-pop-in text-center py-16 bg-white border border-navy-line/50 rounded-2xl max-w-md mx-auto">
            <p className="text-3xl mb-2">🧭</p>
            <p className="text-sm font-medium text-gray-700 mb-1">Henüz onaylı rehberimiz yok</p>
            <p className="text-xs text-gray-400 mb-4">İlk rehber sen olabilirsin.</p>
            <Link href="/rehber-ol" className="inline-flex items-center gap-1.5 bg-coral hover:bg-coral-dark text-white text-xs font-medium px-5 py-2 rounded-full transition-colors">
              Rehber Ol
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rehberler.map((r, i) => {
              const { mevcut } = seviyeBul(r.puan || 0);
              const initials = (r.full_name?.split(" ").map((n) => n[0]).slice(0, 2).join("") || r.username.charAt(0)).toUpperCase();
              return (
                <div
                  key={r.id}
                  className="anim-fade-up kart-3d bg-white border border-navy-line/50 rounded-2xl p-4"
                  style={{ animationDelay: `${i * 70}ms` }}
                  onMouseMove={egimVer}
                  onMouseLeave={egimSifirla}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Link
                      href={`/profil/${r.username}`}
                      className="w-12 h-12 rounded-full bg-navy-tint flex items-center justify-center text-sm font-semibold text-navy overflow-hidden border-2 border-navy-line flex-shrink-0"
                    >
                      {r.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        initials
                      )}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link href={`/profil/${r.username}`} className="text-sm font-semibold text-gray-900 hover:text-coral transition-colors truncate block">
                        {r.full_name || `@${r.username}`}
                      </Link>
                      <p className="text-[11px] text-gray-400 flex items-center gap-1">
                        {mevcut.emoji} {mevcut.ad}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mb-2.5 text-[11px] text-gray-500">
                    <span className="flex items-center gap-1">
                      <IconTrophy size={12} className="text-coral" />
                      {r.puan} puan
                    </span>
                    <span className="flex items-center gap-1">
                      <IconRoute size={12} className="text-navy" />
                      {r.gezilen_yerler?.length || 0} yer
                    </span>
                  </div>

                  {r.rehber_bolgeler?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2.5">
                      {r.rehber_bolgeler.map((b) => (
                        <span key={b} className="text-[10px] bg-navy-tint text-navy border border-navy-line px-2 py-0.5 rounded-full flex items-center gap-0.5">
                          <IconMapPin size={9} />
                          {b}
                        </span>
                      ))}
                    </div>
                  )}

                  {r.rehber_aciklama && (
                    <p className="text-xs text-gray-500 leading-relaxed mb-3 line-clamp-3">{r.rehber_aciklama}</p>
                  )}

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
                    <span className="text-xs font-medium text-coral-deep">
                      {r.rehber_fiyat_bilgisi || "Fiyat görüşülür"}
                    </span>
                    <button
                      onClick={() => talepAc(r)}
                      className="flex items-center gap-1.5 bg-coral hover:bg-coral-dark text-white text-xs font-medium px-3.5 py-1.5 rounded-full transition-colors"
                    >
                      <IconSend size={12} />
                      Talep Gönder
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Talep modalı */}
      {acikRehber && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/30"
          onClick={() => setAcikRehber(null)}
        >
          <div
            className="bg-white rounded-t-2xl w-full max-w-lg shadow-2xl p-5 pb-8 anim-fade-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {acikRehber.full_name || `@${acikRehber.username}`}&apos;e talep gönder
                </p>
                <p className="text-xs text-gray-400 mt-0.5">Ne zaman, kaç kişi, ne istediğini kısaca yaz.</p>
              </div>
              <button onClick={() => setAcikRehber(null)} className="text-gray-300 hover:text-gray-600 transition-colors">
                <IconX size={20} />
              </button>
            </div>

            {gonderildi ? (
              <div className="text-center py-6">
                <IconCheck size={28} className="text-green-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-800">Talebin gönderildi</p>
                <p className="text-xs text-gray-400 mt-1">Rehber sana geri dönecek.</p>
              </div>
            ) : (
              <form onSubmit={talepGonder} className="flex flex-col gap-3">
                <textarea
                  value={mesaj}
                  onChange={(e) => setMesaj(e.target.value)}
                  placeholder="Örn: 15 Eylül'de 2 kişi, Beyoğlu'nu keşfetmek istiyoruz..."
                  rows={4}
                  maxLength={400}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-coral transition-colors resize-none"
                />
                {hata && <p className="text-xs text-red-500">{hata}</p>}
                <button
                  type="submit"
                  disabled={gonderiliyor}
                  className="w-full bg-coral hover:bg-coral-dark disabled:opacity-60 text-white rounded-full py-2.5 text-sm font-medium transition-colors"
                >
                  {gonderiliyor ? "Gönderiliyor..." : "Talebi Gönder"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
