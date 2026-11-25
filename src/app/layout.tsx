import type { Metadata } from "next";
import { Manrope, Dancing_Script, Pacifico, Great_Vibes } from "next/font/google";
import "./globals.css";

// Gövde: Manrope — arayüz metinleri, butonlar, okunabilirlik gerektiren her yer
const manrope = Manrope({
  variable: "--font-govde",
  subsets: ["latin", "latin-ext"],
});

// Başlıklar: Dancing Script — zarif ve el yazısı ama büyük boyutlarda gayet okunaklı
const dancingScript = Dancing_Script({
  variable: "--font-baslik",
  subsets: ["latin", "latin-ext"],
  weight: ["600", "700"],
});

// Marka adı "Gezi App": Pacifico — sıcak, oyuncu, küçük boyutta bile okunur tek ağırlık
const pacifico = Pacifico({
  variable: "--font-marka",
  subsets: ["latin", "latin-ext"],
  weight: "400",
});

// Büyük süsleme yazıları (hero etiketi gibi): Great Vibes — çok ince, sadece büyük punto için
const greatVibes = Great_Vibes({
  variable: "--font-suslu",
  subsets: ["latin", "latin-ext"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Gezi App — İstanbul'u Keşfet",
  description: "İstanbul için kişisel gezi asistanı ve gezginlerin sosyal medyası",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${manrope.variable} ${dancingScript.variable} ${pacifico.variable} ${greatVibes.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
