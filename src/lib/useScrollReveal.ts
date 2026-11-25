"use client";

import { useEffect } from "react";

// .reveal sınıflı öğeleri izler; ekrana her girişte/çıkışta .gorunur ekleyip
// kaldırır — sayfa aşağı kaydırıldıkça içerik canlı bir akış gibi belirir,
// yukarı kaydırılınca da yumuşakça geri çekilir (tek seferlik değil, iki yönlü).
export function useScrollReveal(deps: unknown[] = []) {
  useEffect(() => {
    const elemanlar = document.querySelectorAll<HTMLElement>(".reveal");
    if (elemanlar.length === 0) return;
    const gozlemci = new IntersectionObserver(
      (girisler) => {
        girisler.forEach((g) => {
          g.target.classList.toggle("gorunur", g.isIntersecting);
        });
      },
      { threshold: 0.12, rootMargin: "-40px 0px" }
    );
    elemanlar.forEach((el) => gozlemci.observe(el));
    return () => gozlemci.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
