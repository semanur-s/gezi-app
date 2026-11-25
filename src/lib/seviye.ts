// Gezgin seviye sistemi — puan, gezi süresi ve konum doğrulamalı ziyaretlerden birikir

export const SEVIYELER = [
  { ad: "Çaylak Gezgin", emoji: "🐣", min: 0 },
  { ad: "Sokak Kaşifi", emoji: "🧭", min: 300 },
  { ad: "Semt Uzmanı", emoji: "🗺️", min: 1000 },
  { ad: "Şehir Ustası", emoji: "🏙️", min: 2500 },
  { ad: "İstanbul Efsanesi", emoji: "👑", min: 6000 },
];

export function seviyeBul(puan: number) {
  let mevcut = SEVIYELER[0];
  let sonraki: (typeof SEVIYELER)[0] | null = null;
  for (let i = 0; i < SEVIYELER.length; i++) {
    if (puan >= SEVIYELER[i].min) {
      mevcut = SEVIYELER[i];
      sonraki = SEVIYELER[i + 1] ?? null;
    }
  }
  const ilerleme = sonraki
    ? Math.min(1, (puan - mevcut.min) / (sonraki.min - mevcut.min))
    : 1;
  return { mevcut, sonraki, ilerleme };
}
