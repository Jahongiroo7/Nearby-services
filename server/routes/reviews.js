import { Router } from "express";
import { rateLimit } from "../lib/rate-limit.js";
import { parseReview } from "../lib/validate.js";

const MAX_PER_SERVICE = 200;

/** GET /api/reviews → { [serviceId]: Review[] },  POST /api/reviews */
export function reviewsRouter(store) {
  const router = Router();

  router.get("/", (_req, res) => {
    res.set("Cache-Control", "no-cache");
    res.json(store.data.byService);
  });

  router.post("/", rateLimit({ windowMs: 60_000, max: 10 }), (req, res) => {
    const { value, error } = parseReview(req.body);
    if (error) return res.status(400).json({ error });

    const { serviceId, ...review } = value;
    const created = store.update((d) => {
      const list = (d.byService[serviceId] ??= []);
      if (list.some((r) => r.rid === review.rid)) return false; // takroriy yuborish
      list.push(review);
      if (list.length > MAX_PER_SERVICE) list.shift();
      return true;
    });
    res.status(created ? 201 : 200).json({ ok: true });
  });

  return router;
}
