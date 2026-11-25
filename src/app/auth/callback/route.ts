import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Kullanıcı adı seçilmemişse (ör. ilk Google girişi) onboarding'e yönlendir
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", user.id)
          .maybeSingle();
        if (!profile?.username) {
          return NextResponse.redirect(`${origin}/hosgeldin`);
        }
      }
      return NextResponse.redirect(`${origin}/`);
    }
  }

  // Hata durumunda giriş sayfasına geri gönder
  return NextResponse.redirect(`${origin}/giris?hata=true`);
}
