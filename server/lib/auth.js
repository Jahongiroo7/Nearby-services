import crypto from "node:crypto";

const sha256 = (s) => crypto.createHash("sha256").update(s).digest();

/** `Authorization: Bearer <token>` ni vaqt bo'yicha xavfsiz solishtiradi. Token bo'lmasa — admin yo'llari yopiq. */
export function adminAuth(token) {
  const want = token ? sha256(token) : null;
  return (req, res, next) => {
    if (!want) return res.status(503).json({ error: "ADMIN_TOKEN sozlanmagan" });
    const m = /^Bearer (.+)$/.exec(req.get("authorization") ?? "");
    if (!m || !crypto.timingSafeEqual(sha256(m[1]), want)) return res.status(401).json({ error: "Ruxsat yo'q" });
    next();
  };
}
