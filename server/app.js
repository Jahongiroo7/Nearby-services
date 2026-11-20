import path from "node:path";
import { fileURLToPath } from "node:url";
import compression from "compression";
import express from "express";
import { adminAuth } from "./lib/auth.js";
import { JsonStore } from "./lib/store.js";
import { reportsRouter } from "./routes/reports.js";
import { reviewsRouter } from "./routes/reviews.js";

const PUBLIC_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../public");

/**
 * @param {{ dataDir: string, adminToken?: string }} opts
 * @returns {Promise<{ app: import("express").Express, stores: JsonStore[] }>}
 */
export async function createApp({ dataDir, adminToken }) {
  const reviews = await JsonStore.open(path.join(dataDir, "reviews.json"), { byService: {} });
  const reports = await JsonStore.open(path.join(dataDir, "reports.json"), { items: [] });

  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1); // Render proxy ortida haqiqiy IP (rate limit uchun)
  app.use((_req, res, next) => {
    res.set({ "X-Content-Type-Options": "nosniff", "Referrer-Policy": "strict-origin-when-cross-origin" });
    next();
  });
  app.use(compression());

  app.get("/api/health", (_req, res) => res.json({ ok: true, uptime: Math.round(process.uptime()) }));
  app.use("/api", express.json({ limit: "10kb" }));
  app.use("/api/reviews", reviewsRouter(reviews));
  app.use("/api/reports", reportsRouter(reports, adminAuth(adminToken)));
  app.use("/api", (_req, res) => res.status(404).json({ error: "Topilmadi" }));

  app.use(
    express.static(PUBLIC_DIR, {
      setHeaders(res, file) {
        // Kod har deploy'da o'zgaradi: har safar tekshiriladi (ETag bilan arzon). Rasm va ma'lumot uzoq keshlanadi.
        const long = /[\\/](img|data)[\\/]/.test(file);
        res.set("Cache-Control", long ? "public, max-age=86400" : "no-cache");
      },
    }),
  );

  // Xatolar (masalan, noto'g'ri JSON) — doim JSON javob
  app.use((err, _req, res, _next) => {
    const status = err.status && err.status < 500 ? err.status : 500;
    if (status === 500) console.error(err);
    res.status(status).json({ error: status === 500 ? "Server xatosi" : "So'rov noto'g'ri" });
  });

  return { app, stores: [reviews, reports] };
}
