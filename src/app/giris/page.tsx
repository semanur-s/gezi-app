"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { IconMap2, IconBrandGoogle, IconMail, IconLock, IconEye, IconEyeOff } from "@tabler/icons-react";
import { useRouter } from "next/navigation";

export default function GirisPage() {
  const supabase = createClient();
  const router = useRouter();

  const [mod, setMod] = useState<"giris" | "kayit">("giris");
  const [email, setEmail] = useState("");
  const [sifre, setSifre] = useState("");
  const [sifreGoster, setSifreGoster] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState("");
  const [mesaj, setMesaj] = useState("");

  async function googleIleGirisYap() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: "select_account" },
      },
    });
  }

  async function epostaIleGiris(e: React.FormEvent) {
    e.preventDefault();
    setHata("");
    setMesaj("");
    setYukleniyor(true);

    if (mod === "giris") {
      const { error } = await supabase.auth.signInWithPassword({ email, password: sifre });
      if (error) {
        setHata("E-posta veya şifre hatalı.");
      } else {
        router.push("/");
        router.refresh();
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password: sifre });
      if (error) {
        setHata("Kayıt başarısız: " + error.message);
      } else {
        setMesaj("Doğrulama e-postası gönderildi, gelen kutunu kontrol et.");
      }
    }

    setYukleniyor(false);
  }

  return (
    <div className="min-h-screen bg-[#FDF0E8] flex items-center justify-center px-5">
      <div className="bg-white rounded-3xl shadow-sm border border-[#E8B48A] p-8 w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-[#C2622A] flex items-center justify-center">
            <IconMap2 size={20} color="white" />
          </div>
          <span className="text-lg font-medium text-gray-900">
            gez<span className="text-[#C2622A]">im</span>
          </span>
        </div>

        {/* Tab seçici */}
        <div className="flex bg-gray-100 rounded-full p-1 mb-6">
          <button
            onClick={() => { setMod("giris"); setHata(""); setMesaj(""); }}
            className={`flex-1 text-xs font-medium py-1.5 rounded-full transition-colors ${
              mod === "giris" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
            }`}
          >
            Giriş yap
          </button>
          <button
            onClick={() => { setMod("kayit"); setHata(""); setMesaj(""); }}
            className={`flex-1 text-xs font-medium py-1.5 rounded-full transition-colors ${
              mod === "kayit" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
            }`}
          >
            Kayıt ol
          </button>
        </div>

        {/* Google butonu */}
        <button
          onClick={googleIleGirisYap}
          className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-full py-3 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors mb-4"
        >
          <IconBrandGoogle size={18} />
          {mod === "giris" ? "Google ile giriş yap" : "Google ile kayıt ol"}
        </button>

        {/* Ayraç */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-xs text-gray-400">veya</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        {/* E-posta formu */}
        <form onSubmit={epostaIleGiris} className="flex flex-col gap-3">
          <div className="relative">
            <IconMail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              placeholder="E-posta"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-3 rounded-full border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#C2622A] transition-colors"
            />
          </div>
          <div className="relative">
            <IconLock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type={sifreGoster ? "text" : "password"}
              placeholder="Şifre"
              value={sifre}
              onChange={(e) => setSifre(e.target.value)}
              required
              className="w-full pl-10 pr-10 py-3 rounded-full border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#C2622A] transition-colors"
            />
            <button
              type="button"
              onClick={() => setSifreGoster(!sifreGoster)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {sifreGoster ? <IconEyeOff size={16} /> : <IconEye size={16} />}
            </button>
          </div>

          {hata && <p className="text-xs text-red-500 text-center">{hata}</p>}
          {mesaj && <p className="text-xs text-green-600 text-center">{mesaj}</p>}

          <button
            type="submit"
            disabled={yukleniyor}
            className="w-full bg-[#C2622A] hover:bg-[#a8521f] disabled:opacity-60 text-white text-sm font-medium py-3 rounded-full transition-colors mt-1"
          >
            {yukleniyor ? "..." : mod === "giris" ? "Giriş yap" : "Kayıt ol"}
          </button>
        </form>

        <p className="text-xs text-gray-400 mt-5 text-center leading-relaxed">
          Devam ederek{" "}
          <span className="text-[#C2622A]">kullanım koşullarını</span>{" "}
          kabul etmiş olursun.
        </p>
      </div>
    </div>
  );
}
