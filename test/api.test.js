import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import { createApp } from "../server/app.js";

const TOKEN = "test-token";
let server, base, dir, stores;

const call = (url, { method = "GET", body, token } = {}) =>
  fetch(base + url, {
    method,
    headers: {
      ...(body && { "Content-Type": "application/json" }),
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body && JSON.stringify(body),
  });

const review = (over = {}) => ({ serviceId: "s1", rid: "r-1", name: "Ali", stars: 5, text: "Yaxshi xizmat", ...over });

before(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), "ns-"));
  const made = await createApp({ dataDir: dir, adminToken: TOKEN });
  stores = made.stores;
  server = made.app.listen(0);
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  server.close();
  await Promise.all(stores.map((s) => s.idle()));
  await fs.rm(dir, { recursive: true, force: true });
});

describe("umumiy", () => {
  it("health", async () => {
    const res = await call("/api/health");
    assert.equal(res.status, 200);
    assert.equal((await res.json()).ok, true);
  });

  it("noma'lum API yo'li JSON 404 qaytaradi", async () => {
    const res = await call("/api/yoq");
    assert.equal(res.status, 404);
    assert.ok((await res.json()).error);
  });

  it("buzuq JSON 400 qaytaradi", async () => {
    const res = await fetch(`${base}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{bad",
    });
    assert.equal(res.status, 400);
  });

  it("bosh sahifa va ma'lumot fayllari beriladi", async () => {
    const page = await call("/");
    assert.equal(page.status, 200);
    assert.match(await page.text(), /Nearby Services/);
    for (const f of ["osm", "bounds", "i18n", "photos"]) {
      const res = await call(`/data/${f}.json`);
      assert.equal(res.status, 200, f);
      assert.ok(Object.keys(await res.json()).length > 0, f);
    }
  });
});

describe("sharhlar", () => {
  it("qo'shadi va ro'yxatda qaytaradi", async () => {
    assert.equal((await call("/api/reviews", { method: "POST", body: review() })).status, 201);
    const all = await (await call("/api/reviews")).json();
    assert.equal(all.s1.length, 1);
    assert.deepEqual({ name: all.s1[0].name, stars: all.s1[0].stars }, { name: "Ali", stars: 5 });
  });

  it("bir xil rid ikki marta qo'shilmaydi", async () => {
    const res = await call("/api/reviews", { method: "POST", body: review() });
    assert.equal(res.status, 200);
    assert.equal((await (await call("/api/reviews")).json()).s1.length, 1);
  });

  it("noto'g'ri ma'lumotni rad etadi", async () => {
    for (const bad of [{ stars: 0 }, { stars: 6 }, { stars: 2.5 }, { text: "ab" }, { serviceId: "../x" }, { rid: "" }]) {
      const res = await call("/api/reviews", { method: "POST", body: review({ rid: "x" + Math.random(), ...bad }) });
      assert.equal(res.status, 400, JSON.stringify(bad));
    }
  });

  it("matn va ism uzunligi cheklanadi", async () => {
    await call("/api/reviews", { method: "POST", body: review({ serviceId: "s2", rid: "long", name: "N".repeat(500), text: "T".repeat(5000) }) });
    const [r] = (await (await call("/api/reviews")).json()).s2;
    assert.equal(r.name.length, 60);
    assert.equal(r.text.length, 1000);
  });

  it("diskka saqlanadi", async () => {
    await Promise.all(stores.map((s) => s.idle()));
    const saved = JSON.parse(await fs.readFile(path.join(dir, "reviews.json"), "utf8"));
    assert.equal(saved.byService.s1.length, 1);
  });
});

describe("xabarlar (reports)", () => {
  let id;

  it("hamma yuborishi mumkin", async () => {
    const res = await call("/api/reports", { method: "POST", body: { item: "s1", why: "Telefon noto'g'ri", text: "izoh" } });
    assert.equal(res.status, 201);
    id = (await res.json()).id;
  });

  it("noto'g'ri xabarni rad etadi", async () => {
    assert.equal((await call("/api/reports", { method: "POST", body: { item: "s1" } })).status, 400);
  });

  it("o'qish tokensiz 401, noto'g'ri token 401", async () => {
    assert.equal((await call("/api/reports")).status, 401);
    assert.equal((await call("/api/reports", { token: "xato" })).status, 401);
  });

  it("admin ko'radi, holatini o'zgartiradi va o'chiradi", async () => {
    const list = await (await call("/api/reports", { token: TOKEN })).json();
    assert.equal(list[0].id, id);
    assert.equal(list[0].status, "new");

    assert.equal((await call(`/api/reports/${id}`, { method: "PATCH", token: TOKEN, body: { status: "bad" } })).status, 400);
    const patched = await call(`/api/reports/${id}`, { method: "PATCH", token: TOKEN, body: { status: "done" } });
    assert.equal((await patched.json()).status, "done");

    assert.equal((await call(`/api/reports/${id}`, { method: "DELETE", token: TOKEN })).status, 204);
    assert.equal((await call(`/api/reports/${id}`, { method: "DELETE", token: TOKEN })).status, 404);
  });

  it("tezlik cheklovi: ketma-ket ko'p yuborish 429 beradi", async () => {
    const codes = [];
    for (let i = 0; i < 8; i++) codes.push((await call("/api/reports", { method: "POST", body: { item: "s1", why: "x" } })).status);
    assert.ok(codes.includes(429), codes.join());
  });
});
