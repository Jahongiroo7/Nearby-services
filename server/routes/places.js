import { Router } from "express";
import { timingSafeEqual } from "node:crypto";
import { distanceKm, isOpenNow } from "../lib/geo.js";
import { CATEGORY_IDS } from "../lib/categories.js";
import { validatePlace } from "../lib/validate.js";

const SORTS = new Set(["dist", "rating", "name"]);

function num(v) {
  if (v === undefined || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

function sameToken(given, expected) {
  const a = Buffer.from(String(given ?? ""));
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function placesRouter({ store, adminToken }) {
  const r = Router();

  // Yozish (POST/PUT/PATCH/DELETE) faqat admin token bilan.
  function requireAdmin(req, res, next) {
    if (!adminToken) return res.status(503).json({ error: "ADMIN_TOKEN o'rnatilmagan, yozish o'chirilgan" });
    const m = /^Bearer (.+)$/.exec(req.get("authorization") ?? "");
    if (!m || !sameToken(m[1], adminToken)) return res.status(401).json({ error: "Ruxsat yo'q" });
    next();
  }

  const withId = (req, res, next) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: "id noto'g'ri" });
    req.placeId = id;
    next();
  };

  const present = (p, me, now) => ({
    ...p,
    openNow: isOpenNow(p, now),
    ...(me && { distanceKm: Math.round(distanceKm(me, p) * 1000) / 1000 }),
  });

  // GET /api/places?q=&category=a,b&openNow=1&lat=&lng=&radius=&sort=dist|rating|name
  r.get("/", (req, res) => {
    const { q = "", category = "", openNow, sort = "dist" } = req.query;
    const lat = num(req.query.lat), lng = num(req.query.lng), radius = num(req.query.radius);

    if (Number.isNaN(lat) || Number.isNaN(lng) || Number.isNaN(radius))
      return res.status(400).json({ error: "lat, lng, radius son bo'lishi kerak" });
    if ((lat === undefined) !== (lng === undefined))
      return res.status(400).json({ error: "lat va lng birga berilishi kerak" });
    if (!SORTS.has(sort)) return res.status(400).json({ error: "sort: dist | rating | name" });
    if (sort === "dist" && lat === undefined && req.query.sort) return res.status(400).json({ error: "dist uchun lat/lng kerak" });

    const cats = String(category).split(",").filter(Boolean);
    if (cats.some((c) => !CATEGORY_IDS.has(c))) return res.status(400).json({ error: "noma'lum kategoriya" });

    const me = lat !== undefined ? { lat, lng } : null;
    const needle = String(q).trim().toLowerCase().slice(0, 100);
    const now = new Date();

    let items = store.all()
      .filter((p) => !cats.length || cats.includes(p.category))
      .filter((p) => !needle || `${p.name} ${p.address}`.toLowerCase().includes(needle))
      .map((p) => present(p, me, now))
      .filter((p) => openNow !== "1" || p.openNow)
      .filter((p) => radius === undefined || !me || p.distanceKm <= radius);

    const cmp = {
      dist: (a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0),
      rating: (a, b) => b.rating - a.rating,
      name: (a, b) => a.name.localeCompare(b.name, "uz"),
    }[sort];
    items.sort(cmp);

    res.json({ total: items.length, items });
  });

  r.get("/:id", withId, (req, res) => {
    const p = store.get(req.placeId);
    if (!p) return res.status(404).json({ error: "Topilmadi" });
    const lat = num(req.query.lat), lng = num(req.query.lng);
    const me = Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
    res.json(present(p, me, new Date()));
  });

  r.post("/", requireAdmin, async (req, res) => {
    const { value, errors } = validatePlace(req.body);
    if (errors) return res.status(422).json({ error: "Validatsiya xatosi", fields: errors });
    res.status(201).json(present(await store.create(value), null, new Date()));
  });

  r.put("/:id", requireAdmin, withId, async (req, res) => {
    const { value, errors } = validatePlace(req.body);
    if (errors) return res.status(422).json({ error: "Validatsiya xatosi", fields: errors });
    const p = await store.update(req.placeId, value);
    if (!p) return res.status(404).json({ error: "Topilmadi" });
    res.json(present(p, null, new Date()));
  });

  r.patch("/:id", requireAdmin, withId, async (req, res) => {
    const { value, errors } = validatePlace(req.body, { partial: true });
    if (errors) return res.status(422).json({ error: "Validatsiya xatosi", fields: errors });
    if (!Object.keys(value).length) return res.status(400).json({ error: "O'zgartirish uchun maydon yo'q" });
    const p = await store.update(req.placeId, value);
    if (!p) return res.status(404).json({ error: "Topilmadi" });
    res.json(present(p, null, new Date()));
  });

  r.delete("/:id", requireAdmin, withId, async (req, res) => {
    if (!(await store.remove(req.placeId))) return res.status(404).json({ error: "Topilmadi" });
    res.status(204).end();
  });

  return r;
}
