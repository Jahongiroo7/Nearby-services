import fs from "node:fs/promises";
import path from "node:path";

/**
 * Oddiy JSON-fayl saqlash joyi: xotirada ushlab turadi, har o'zgarishda faylga atomik yozadi
 * (vaqtinchalik faylga yozib, so'ng rename). Yozuvlar ketma-ket bajariladi.
 * Ko'p nusxali yoki yuqori yuklamali muhit uchun Postgres/SQLite ga almashtiring.
 */
export class JsonStore {
  #file;
  #data;
  #queue = Promise.resolve();

  constructor(file, initial) {
    this.#file = file;
    this.#data = initial;
  }

  static async open(file, initial) {
    const store = new JsonStore(file, initial);
    try {
      store.#data = JSON.parse(await fs.readFile(file, "utf8"));
    } catch (err) {
      if (err.code !== "ENOENT") throw new Error(`${file} o'qilmadi: ${err.message}`);
    }
    return store;
  }

  get data() {
    return this.#data;
  }

  /** `mutate(data)` ni chaqirib, natijani diskka yozadi. */
  update(mutate) {
    const result = mutate(this.#data);
    this.#queue = this.#queue.then(() => this.#flush()).catch((err) => console.error("Saqlashda xato:", err));
    return result;
  }

  /** Kutilayotgan barcha yozuvlar tugashini kutadi (testlar va o'chirishda). */
  idle() {
    return this.#queue;
  }

  async #flush() {
    await fs.mkdir(path.dirname(this.#file), { recursive: true });
    const tmp = `${this.#file}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(this.#data));
    await fs.rename(tmp, this.#file);
  }
}
