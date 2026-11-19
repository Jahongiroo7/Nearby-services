const R = 6371; // Yer radiusi, km
const rad = (x) => (x * Math.PI) / 180;

/** Ikki nuqta orasidagi masofa (km), haversine formulasi. */
export function distanceKm(a, b) {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Joy hozir ochiqmi? Vaqt serverning zonasiga emas, Toshkent zonasiga qarab
 * hisoblanadi (server qayerda ishlashidan qat'i nazar natija bir xil).
 * opens=0 va closes=24 — kechayu kunduz ochiq.
 */
export function isOpenNow(place, now = new Date(), timeZone = "Asia/Tashkent") {
  if (place.opens === 0 && place.closes === 24) return true;
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const h = Number(parts.find((p) => p.type === "hour").value);
  const m = Number(parts.find((p) => p.type === "minute").value);
  const t = h + m / 60;
  return t >= place.opens && t < place.closes;
}
