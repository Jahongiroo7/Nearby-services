import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createApp } from "../server/app.js";
import { createStore } from "../server/lib/store.js";
import { isOpenNow, distanceKm } from "../server/lib/geo.js";

const seedFile = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "server", "data", "places.seed.json");
const TOKEN = "test-token";
let server, base, tmp;

before(async () => {
  tmp = await mkdtemp(path.join(tmpdir(), "yx-"));
  const store = await createStore({ file: path.join(tmp, "places.json"), seedFile });
  server = createApp({ store, adminToken: TOKEN }).listen(0);
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  await new Promise((r) => server.close(r));
  await rm(tmp, { recursive: true, force: true });
});

const j = (url, init) => fetch(base + url, init).then(async (r) => ({ status: r.status, body: r.status === 204 ? null : await r.json() }));
const auth = { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" };
const valid = { name: "Test dorixona", category: "pharmacy", address: "Test ko'chasi 1", lat: 41.31, lng: 69.28, opens: 8, closes: 20 };

test("geo: masofa va ish vaqti", () => {
  assert.ok(Math.abs(distanceKm({ lat: 41.3, lng: 69.2 }, { lat: 41.3, lng: 69.2 })) < 1e-9);
  assert.ok(distanceKm({ lat: 41.3, lng: 69.2 }, { lat: 41.4, lng: 69.2 }) > 11);
  const p = { opens: 9, closes: 18 };
  // 2026-01-01 08:00 UTC = 13:00 Toshkent (UTC+5)
  assert.equal(isOpenNow(p, new Date("2026-01-01T08:00:00Z")), true);
  // 20:00 UTC = 01:00 Toshkent
  assert.equal(isOpenNow(p, new Date("2026-01-01T20:00:00Z")), false);
  assert.equal(isOpenNow({ opens: 0, closes: 24 }, new Date()), true);
});

test("GET /api/categories", async () => {
  const { status, body } = await j("/api/categories");
  assert.equal(status, 200);
  assert.ok(body.some((c) => c.id === "pharmacy"));
});

test("GET /api/places: masofa bo'yicha saralangan", async () => {
  const { status, body } = await j("/api/places?lat=41.3111&lng=69.2797&sort=dist");
  assert.equal(status, 200);
  assert.equal(body.total, 24);
  const d = body.items.map((p) => p.distanceKm);
  assert.deepEqual(d, [...d].sort((a, b) => a - b));
});

test("GET /api/places: filtrlar", async () => {
  const cat = await j("/api/places?category=metro&lat=41.31&lng=69.28");
  assert.equal(cat.body.total, 3);
  assert.ok(cat.body.items.every((p) => p.category === "metro"));
  const q = await j("/api/places?q=chorsu&lat=41.31&lng=69.28");
  assert.ok(q.body.total >= 2);
  const r = await j("/api/places?lat=41.3111&lng=69.2797&radius=1");
  assert.ok(r.body.items.every((p) => p.distanceKm <= 1));
});

test("GET /api/places: noto'g'ri parametrlar 400 qaytaradi", async () => {
  for (const url of ["/api/places?lat=abc&lng=1", "/api/places?lat=41.3", "/api/places?sort=x", "/api/places?category=zzz"]) {
    assert.equal((await j(url)).status, 400, url);
  }
});

test("GET /api/places/:id", async () => {
  assert.equal((await j("/api/places/1")).body.id, 1);
  assert.equal((await j("/api/places/9999")).status, 404);
  assert.equal((await j("/api/places/abc")).status, 400);
});

test("yozish tokensiz rad etiladi", async () => {
  const noAuth = await j("/api/places", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(valid) });
  assert.equal(noAuth.status, 401);
  const bad = await j("/api/places", { method: "POST", headers: { ...auth, Authorization: "Bearer wrong" }, body: JSON.stringify(valid) });
  assert.equal(bad.status, 401);
});

test("CRUD: yaratish, o'zgartirish, o'chirish", async () => {
  const created = await j("/api/places", { method: "POST", headers: auth, body: JSON.stringify(valid) });
  assert.equal(created.status, 201);
  const id = created.body.id;

  const patched = await j(`/api/places/${id}`, { method: "PATCH", headers: auth, body: JSON.stringify({ rating: 4.44 }) });
  assert.equal(patched.status, 200);
  assert.equal(patched.body.rating, 4.4);
  assert.equal(patched.body.name, valid.name);

  const put = await j(`/api/places/${id}`, { method: "PUT", headers: auth, body: JSON.stringify({ ...valid, name: "Yangi nom" }) });
  assert.equal(put.body.name, "Yangi nom");

  assert.equal((await j(`/api/places/${id}`, { method: "DELETE", headers: auth })).status, 204);
  assert.equal((await j(`/api/places/${id}`)).status, 404);
});

test("validatsiya: noto'g'ri ma'lumot 422", async () => {
  const r = await j("/api/places", { method: "POST", headers: auth, body: JSON.stringify({ ...valid, category: "x", lat: 10 }) });
  assert.equal(r.status, 422);
  assert.ok(r.body.fields.category && r.body.fields.lat);
});

test("buzuq JSON 400, noma'lum endpoint 404", async () => {
  const r = await fetch(`${base}/api/places`, { method: "POST", headers: auth, body: "{oops" });
  assert.equal(r.status, 400);
  assert.equal((await j("/api/nope")).status, 404);
});

test("frontend statik fayllari beriladi", async () => {
  const html = await fetch(base + "/");
  assert.equal(html.status, 200);
  assert.match(await html.text(), /Yaqin xizmatlar/);
  assert.equal((await fetch(base + "/js/main.js")).status, 200);
});
