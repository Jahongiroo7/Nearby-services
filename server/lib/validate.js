import { CATEGORY_IDS } from "./categories.js";

// Toshkent atrofi — undan tashqaridagi koordinatalar rad etiladi.
export const BOUNDS = { south: 41.21, north: 41.39, west: 69.16, east: 69.37 };

const isNum = (v) => typeof v === "number" && Number.isFinite(v);
const clean = (s) => (typeof s === "string" ? s.trim() : s);

/**
 * Joy ma'lumotini tekshiradi.
 * partial=true bo'lsa (PATCH) faqat berilgan maydonlar tekshiriladi.
 * Qaytaradi: { value, errors } — value faqat ruxsat etilgan maydonlardan iborat.
 */
export function validatePlace(body, { partial = false } = {}) {
  const errors = {};
  const out = {};
  const src = body && typeof body === "object" ? body : {};
  const has = (k) => Object.hasOwn(src, k);

  const need = (k) => {
    if (!partial && !has(k)) errors[k] = "majburiy maydon";
    return has(k);
  };

  if (need("name")) {
    const v = clean(src.name);
    if (typeof v !== "string" || v.length < 2 || v.length > 100) errors.name = "2–100 belgi bo'lishi kerak";
    else out.name = v;
  }
  if (need("category")) {
    if (!CATEGORY_IDS.has(src.category)) errors.category = "noma'lum kategoriya";
    else out.category = src.category;
  }
  if (need("address")) {
    const v = clean(src.address);
    if (typeof v !== "string" || v.length < 2 || v.length > 200) errors.address = "2–200 belgi bo'lishi kerak";
    else out.address = v;
  }
  if (has("phone")) {
    const v = clean(src.phone);
    if (typeof v !== "string" || (v !== "" && !/^\+?[\d\s()-]{7,20}$/.test(v))) errors.phone = "telefon raqami noto'g'ri";
    else out.phone = v;
  } else if (!partial) out.phone = "";

  if (need("lat")) {
    if (!isNum(src.lat) || src.lat < BOUNDS.south || src.lat > BOUNDS.north) errors.lat = `${BOUNDS.south}…${BOUNDS.north} oralig'ida bo'lishi kerak`;
    else out.lat = src.lat;
  }
  if (need("lng")) {
    if (!isNum(src.lng) || src.lng < BOUNDS.west || src.lng > BOUNDS.east) errors.lng = `${BOUNDS.west}…${BOUNDS.east} oralig'ida bo'lishi kerak`;
    else out.lng = src.lng;
  }

  const hasOpens = has("opens"), hasCloses = has("closes");
  if (!partial || hasOpens || hasCloses) {
    if (!partial) { need("opens"); need("closes"); }
    if (hasOpens && (!Number.isInteger(src.opens) || src.opens < 0 || src.opens > 23)) errors.opens = "0–23 butun son";
    else if (hasOpens) out.opens = src.opens;
    if (hasCloses && (!Number.isInteger(src.closes) || src.closes < 1 || src.closes > 24)) errors.closes = "1–24 butun son";
    else if (hasCloses) out.closes = src.closes;
  }

  if (has("rating")) {
    if (!isNum(src.rating) || src.rating < 0 || src.rating > 5) errors.rating = "0–5 oralig'ida bo'lishi kerak";
    else out.rating = Math.round(src.rating * 10) / 10;
  } else if (!partial) out.rating = 0;

  return { value: out, errors: Object.keys(errors).length ? errors : null };
}
