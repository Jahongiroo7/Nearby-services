import { Router } from "express";
import { rateLimit } from "../lib/rate-limit.js";
import { parseReport, REPORT_STATUSES } from "../lib/validate.js";

const MAX_REPORTS = 500;

/** POST /api/reports — hamma; GET/PATCH/DELETE — faqat admin (Bearer ADMIN_TOKEN). */
export function reportsRouter(store, requireAdmin) {
  const router = Router();

  router.post("/", rateLimit({ windowMs: 60_000, max: 5 }), (req, res) => {
    const { value, error } = parseReport(req.body);
    if (error) return res.status(400).json({ error });
    store.update((d) => {
      d.items.unshift(value);
      d.items.length = Math.min(d.items.length, MAX_REPORTS);
    });
    res.status(201).json({ ok: true, id: value.id });
  });

  router.get("/", requireAdmin, (_req, res) => res.json(store.data.items));

  router.patch("/:id", requireAdmin, (req, res) => {
    const status = req.body?.status;
    if (!REPORT_STATUSES.includes(status)) return res.status(400).json({ error: "status: new | done" });
    const found = store.update((d) => {
      const r = d.items.find((x) => x.id === req.params.id);
      if (r) r.status = status;
      return r;
    });
    return found ? res.json(found) : res.status(404).json({ error: "Topilmadi" });
  });

  router.delete("/:id", requireAdmin, (req, res) => {
    const removed = store.update((d) => {
      const i = d.items.findIndex((x) => x.id === req.params.id);
      return i >= 0 ? d.items.splice(i, 1).length : 0;
    });
    return removed ? res.status(204).end() : res.status(404).json({ error: "Topilmadi" });
  });

  return router;
}
