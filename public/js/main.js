import { getCategories, getMeta, searchPlaces } from "./api.js";
import { createMap } from "./map.js";

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmtKm = (d) => (d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(1)} km`);
const hoursText = (p) => (p.opens === 0 && p.closes === 24 ? "24 soat" : `${String(p.opens).padStart(2, "0")}:00 – ${String(p.closes).padStart(2, "0")}:00`);

const state = {
  cats: new Set(), q: "", sort: "dist", openOnly: false,
  sel: null, me: null, places: [],
};
let categories = [], catById = new Map(), bounds, map;

/* ---------- Ma'lumot olish ---------- */
let inflight = null, debounceId = 0;

async function load() {
  inflight?.abort();
  inflight = new AbortController();
  try {
    const data = await searchPlaces({
      q: state.q.trim(), category: [...state.cats], openNow: state.openOnly,
      sort: state.sort, lat: state.me.lat, lng: state.me.lng,
    }, inflight.signal);
    state.places = data.items;
    if (state.sel && !state.places.some((p) => p.id === state.sel)) state.sel = null;
    render();
  } catch (e) {
    if (e.name !== "AbortError") toast(e.message || "Ma'lumotni yuklab bo'lmadi");
  }
}
const loadSoon = () => { clearTimeout(debounceId); debounceId = setTimeout(load, 200); };

/* ---------- Render ---------- */
function renderChips() {
  $("#chips").innerHTML = categories.map((c) =>
    `<button class="chip" data-k="${esc(c.id)}" aria-pressed="${state.cats.has(c.id)}">${c.emoji} ${esc(c.name)}</button>`).join("");
}

function render() {
  $("#count").textContent = `${state.places.length} ta natija`;
  $("#list").innerHTML = state.places.length
    ? state.places.map((p) => {
        const c = catById.get(p.category);
        return `<li><button class="item" data-id="${p.id}" ${p.id === state.sel ? 'aria-current="true"' : ""}>
          <div class="ico" style="background:${esc(c?.color ?? "#555")}22">${c?.emoji ?? "•"}</div>
          <div><h3>${esc(p.name)}</h3>
          <div class="meta"><span>${esc(c?.name ?? "")}</span><span>· ${fmtKm(p.distanceKm)}</span><span>· ⭐ ${p.rating.toFixed(1)}</span>
          <span class="badge ${p.openNow ? "ok" : "bad"}">${p.openNow ? "Ochiq" : "Yopiq"}</span></div></div></button></li>`;
      }).join("")
    : `<li class="empty">Hech narsa topilmadi.<br>Filtrlarni o'zgartirib ko'ring.</li>`;
  map.setPlaces(state.places, state.sel);
  map.setMe(state.me.lat, state.me.lng);
  renderDetail();
}

function renderDetail() {
  const p = state.places.find((x) => x.id === state.sel), box = $("#detail");
  if (!p) { box.hidden = true; return; }
  const c = catById.get(p.category);
  const tel = p.phone.replace(/[^+\d]/g, "");
  box.hidden = false;
  box.innerHTML = `<button class="x" aria-label="Yopish" id="dx">✕</button>
    <h2>${c?.emoji ?? ""} ${esc(p.name)}</h2>
    <div class="meta"><span>${esc(c?.name ?? "")}</span><span class="badge ${p.openNow ? "ok" : "bad"}">${p.openNow ? "Hozir ochiq" : "Hozir yopiq"}</span></div>
    <dl class="kv">
      <dt>Manzil</dt><dd>${esc(p.address)}</dd>
      <dt>Masofa</dt><dd>${fmtKm(p.distanceKm)} (taxminan ${Math.max(1, Math.round(p.distanceKm / 0.08))} daqiqa piyoda)</dd>
      <dt>Ish vaqti</dt><dd>${hoursText(p)}</dd>
      <dt>Reyting</dt><dd>⭐ ${p.rating.toFixed(1)} / 5</dd>
      ${p.phone ? `<dt>Telefon</dt><dd>${esc(p.phone)}</dd>` : ""}
    </dl>
    <div class="actions">
      ${p.phone ? `<a class="btn" href="tel:${esc(tel)}">📞 Qo'ng'iroq</a>` : ""}
      <a class="btn pri" href="https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}" target="_blank" rel="noopener">🧭 Yo'nalish</a>
    </div>`;
  $("#dx").onclick = () => select(null);
}

function select(id) {
  state.sel = id;
  if (id) {
    const p = state.places.find((x) => x.id === id);
    if (p) map.centerOn(p.lat, p.lng);
  }
  render();
  if (id) document.querySelector(`.item[data-id="${id}"]`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

/* ---------- Yordamchilar ---------- */
let toastId = 0;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg; t.hidden = false;
  clearTimeout(toastId); toastId = setTimeout(() => (t.hidden = true), 4000);
}

function setMe(lat, lng) { state.me = { lat, lng }; load(); }

/* ---------- Hodisalar ---------- */
function bind() {
  $("#chips").addEventListener("click", (e) => {
    const b = e.target.closest(".chip"); if (!b) return;
    const k = b.dataset.k;
    state.cats.has(k) ? state.cats.delete(k) : state.cats.add(k);
    renderChips(); load();
  });
  $("#list").addEventListener("click", (e) => {
    const b = e.target.closest(".item"); if (b) select(Number(b.dataset.id));
  });
  $("#q").addEventListener("input", (e) => { state.q = e.target.value; loadSoon(); });
  $("#sort").addEventListener("change", (e) => { state.sort = e.target.value; load(); });
  $("#openOnly").addEventListener("change", (e) => { state.openOnly = e.target.checked; load(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && state.sel) select(null); });

  $("#zin").onclick = () => map.zoomIn();
  $("#zout").onclick = () => map.zoomOut();
  $("#zreset").onclick = () => map.reset();

  $("#geo").addEventListener("click", () => {
    if (!navigator.geolocation) return toast("Brauzer joylashuvni qo'llab-quvvatlamaydi");
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      const { latitude: lat, longitude: lng } = coords;
      if (lat < bounds.south || lat > bounds.north || lng < bounds.west || lng > bounds.east)
        return toast("Siz Toshkent xaritasidan tashqaridasiz — «Men» nuqtasini xaritada qo'lda belgilang.");
      setMe(lat, lng);
    }, () => toast("Joylashuvga ruxsat berilmadi. Xaritada qo'lda belgilashingiz mumkin."), { timeout: 8000 });
  });

  $("#theme").addEventListener("click", () => {
    const r = document.documentElement;
    const dark = r.dataset.theme ? r.dataset.theme === "dark" : matchMedia("(prefers-color-scheme:dark)").matches;
    r.dataset.theme = dark ? "light" : "dark";
  });
}

/* ---------- Boshlash ---------- */
try {
  const [cats, meta] = await Promise.all([getCategories(), getMeta()]);
  categories = cats; catById = new Map(cats.map((c) => [c.id, c]));
  bounds = meta.bounds; state.me = meta.center;
  map = createMap({
    svg: $("#map"), bounds, categories,
    onPinClick: select,
    onEmptyClick: ({ lat, lng }) => setMe(lat, lng),
  });
  renderChips(); bind(); await load();
} catch (e) {
  toast(e.message || "Serverga ulanib bo'lmadi");
}
