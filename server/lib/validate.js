/** Kirish ma'lumotlarini tekshiradi. Muvaffaqiyatda { value }, aks holda { error } qaytaradi. */

const ID_RE = /^[\w.-]{1,40}$/;
const text = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export function parseReview(body) {
  const b = body ?? {};
  const serviceId = text(b.serviceId, 40);
  const rid = text(b.rid, 40);
  const stars = Number(b.stars);
  const review = text(b.text, 1000);
  if (!ID_RE.test(serviceId)) return { error: "serviceId noto'g'ri" };
  if (!ID_RE.test(rid)) return { error: "rid noto'g'ri" };
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) return { error: "stars 1 dan 5 gacha butun son bo'lishi kerak" };
  if (review.length < 3) return { error: "Sharh kamida 3 belgi bo'lishi kerak" };
  return {
    value: { serviceId, rid, name: text(b.name, 60) || "Mehmon", stars, text: review, ts: Date.now() },
  };
}

export function parseReport(body) {
  const b = body ?? {};
  const item = text(b.item, 40);
  const why = text(b.why, 120);
  const from = text(b.from, 40);
  if (!ID_RE.test(item)) return { error: "item noto'g'ri" };
  if (!why) return { error: "why kerak" };
  return {
    value: {
      id: `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
      item,
      why,
      text: text(b.text, 300),
      from: ID_RE.test(from) ? from : "guest",
      ts: Date.now(),
      status: "new",
    },
  };
}

export const REPORT_STATUSES = ["new", "done"];
