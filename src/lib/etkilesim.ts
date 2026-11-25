// Akışkan mikro-etkileşimler

// Hover'da kartı fareyi takip ederek 3D eğ (onMouseMove'a bağla)
export function egimVer(e: React.MouseEvent<HTMLElement>) {
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width - 0.5;
  const y = (e.clientY - r.top) / r.height - 0.5;
  el.style.transform = `perspective(800px) rotateY(${(x * 7).toFixed(2)}deg) rotateX(${(-y * 7).toFixed(2)}deg) translateY(-3px)`;
}

// Fare karttan çıkınca eğimi sıfırla (onMouseLeave'e bağla)
export function egimSifirla(e: React.MouseEvent<HTMLElement>) {
  e.currentTarget.style.transform = "";
}

// Beğeni butonunun üstünde küçük bir kalp yükselip solur.
// container'ın position:relative olması gerekir (position:absolute içindir).
export function kalpUcur(container: HTMLElement) {
  const el = document.createElement("span");
  el.textContent = "❤️";
  el.className = "kalp-ucan";
  el.style.fontSize = "13px";
  container.appendChild(el);
  window.setTimeout(() => el.remove(), 900);
}

// İki koordinat arası mesafe (metre) — konum doğrulaması için
export function mesafeMetre(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
