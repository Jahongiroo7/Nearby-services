import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Oddiy JSON-fayl omborxona. Xotirada ushlaydi, o'zgarishda faylga yozadi.
 * Yozish "temp fayl + rename" usulida — jarayon uzilsa fayl buzilmaydi.
 * Kichik loyiha uchun yetarli; ma'lumot ko'paysa SQLite/Postgres'ga o'tish kerak
 * (faqat shu fayl almashtiriladi, route'lar o'zgarmaydi).
 */
export async function createStore({ file, seedFile }) {
  let places;
  let writing = Promise.resolve(); // yozuvlar ketma-ket bajarilishi uchun navbat
  try {
    places = JSON.parse(await fs.readFile(file, "utf8"));
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
    places = seedFile ? JSON.parse(await fs.readFile(seedFile, "utf8")) : [];
    await persist();
  }

  function persist() {
    writing = writing.catch(() => {}).then(async () => { // oldingi yozuv xato bersa ham navbat to'xtamasin
      await fs.mkdir(path.dirname(file), { recursive: true });
      const tmp = `${file}.${process.pid}.tmp`;
      await fs.writeFile(tmp, JSON.stringify(places, null, 2));
      await fs.rename(tmp, file);
    });
    return writing;
  }

  const nextId = () => places.reduce((m, p) => Math.max(m, p.id), 0) + 1;

  return {
    all: () => places,
    get: (id) => places.find((p) => p.id === id) ?? null,
    async create(data) {
      const place = { id: nextId(), ...data };
      places.push(place);
      await persist();
      return place;
    },
    async update(id, patch) {
      const i = places.findIndex((p) => p.id === id);
      if (i === -1) return null;
      places[i] = { ...places[i], ...patch, id };
      await persist();
      return places[i];
    },
    async remove(id) {
      const i = places.findIndex((p) => p.id === id);
      if (i === -1) return false;
      places.splice(i, 1);
      await persist();
      return true;
    },
  };
}
