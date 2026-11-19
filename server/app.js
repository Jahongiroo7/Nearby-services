import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { placesRouter } from "./routes/places.js";
import { CATEGORIES } from "./lib/categories.js";
import { BOUNDS } from "./lib/validate.js";

const publicDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public");

/** Ilovani yig'adi (listen qilmaydi — testlarda ham ishlatiladi). */
export function createApp({ store, adminToken = "" }) {
  const app = express();
  app.disable("x-powered-by");

  app.use((_req, res, next) => {
    res.set({
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "same-origin",
      "X-Frame-Options": "DENY",
      // Frontend faqat o'z domenidan skript/stil yuklaydi, inline skript yo'q.
      "Content-Security-Policy":
        "default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; base-uri 'none'; frame-ancestors 'none'",
    });
    next();
  });

  app.use(express.json({ limit: "10kb" }));

  app.get("/api/health", (_req, res) => res.json({ ok: true }));
  app.get("/api/categories", (_req, res) => res.json(CATEGORIES));
  app.get("/api/meta", (_req, res) => res.json({ bounds: BOUNDS, center: { lat: 41.3111, lng: 69.2797 } }));
  app.use("/api/places", placesRouter({ store, adminToken }));
  app.use("/api", (_req, res) => res.status(404).json({ error: "Endpoint topilmadi" }));

  app.use(express.static(publicDir, { maxAge: "1h" }));

  // Xatolar: noto'g'ri JSON, juda katta body va h.k.
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err.type === "entity.parse.failed") return res.status(400).json({ error: "JSON noto'g'ri" });
    if (err.type === "entity.too.large") return res.status(413).json({ error: "So'rov juda katta" });
    console.error(err);
    res.status(500).json({ error: "Server xatosi" });
  });

  return app;
}
