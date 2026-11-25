"use client";

import { useEffect, useRef, useState } from "react";

// Bağlandığı öğe ekrana girince 0'dan hedef sayıya hızlıca sayar (tek seferlik).
export function useSayac(hedef: number, sure = 1200) {
  const [deger, setDeger] = useState(0);
  const ref = useRef<HTMLSpanElement | null>(null);
  const basladiRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const gozlemci = new IntersectionObserver(
      ([giris]) => {
        if (giris.isIntersecting && !basladiRef.current) {
          basladiRef.current = true;
          const baslangic = performance.now();
          function adim(simdi: number) {
            const ilerleme = Math.min(1, (simdi - baslangic) / sure);
            const kolayla = 1 - Math.pow(1 - ilerleme, 3);
            setDeger(Math.round(kolayla * hedef));
            if (ilerleme < 1) requestAnimationFrame(adim);
          }
          requestAnimationFrame(adim);
        }
      },
      { threshold: 0.4 }
    );
    gozlemci.observe(el);
    return () => gozlemci.disconnect();
  }, [hedef, sure]);

  return { deger, ref };
}
