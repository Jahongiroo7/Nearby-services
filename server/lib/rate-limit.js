/** Oddiy xotiradagi cheklov: bir IP dan `windowMs` ichida `max` ta so'rov. */
export function rateLimit({ windowMs, max }) {
  const hits = new Map();
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [ip, h] of hits) if (h.reset <= now) hits.delete(ip);
  }, windowMs);
  timer.unref();

  return (req, res, next) => {
    const now = Date.now();
    let h = hits.get(req.ip);
    if (!h || h.reset <= now) hits.set(req.ip, (h = { count: 0, reset: now + windowMs }));
    if (++h.count > max) {
      res.set("Retry-After", String(Math.ceil((h.reset - now) / 1000)));
      return res.status(429).json({ error: "Juda ko'p so'rov. Birozdan keyin urinib ko'ring." });
    }
    next();
  };
}
