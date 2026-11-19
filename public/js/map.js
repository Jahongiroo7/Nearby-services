// Sxematik xarita (SVG): chizish, zoom/pan, pinlar. Ma'lumot olish bilan ishi yo'q.
const NS = "http://www.w3.org/2000/svg";
const W = 1000, H = 760;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function el(name, attrs = {}, parent) {
  const e = document.createElementNS(NS, name);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  parent?.appendChild(e);
  return e;
}

export function createMap({ svg, bounds, categories, onPinClick, onEmptyClick }) {
  const catById = new Map(categories.map((c) => [c.id, c]));
  const proj = (lat, lng) => ({
    x: ((lng - bounds.west) / (bounds.east - bounds.west)) * W,
    y: ((bounds.north - lat) / (bounds.north - bounds.south)) * H,
  });
  const unproj = (x, y) => ({
    lng: bounds.west + (x / W) * (bounds.east - bounds.west),
    lat: bounds.north - (y / H) * (bounds.north - bounds.south),
  });

  let vb = { x: 0, y: 0, w: W, h: H };
  const applyVB = () => svg.setAttribute("viewBox", `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);

  const gBase = el("g", {}, svg), gPins = el("g", {}, svg), gMe = el("g", {}, svg);
  drawBase(gBase);

  function drawBase(g) {
    el("rect", { x: -2000, y: -2000, width: 5000, height: 5000, fill: "var(--land)" }, g);
    [[300, 330, 70, 45], [620, 210, 90, 55], [760, 430, 60, 60], [220, 560, 80, 50]].forEach(([x, y, w, h]) =>
      el("rect", { x, y, width: w, height: h, rx: 18, fill: "var(--park)" }, g));
    el("path", { d: "M-50 420 C 150 400, 260 330, 400 320 S 640 300, 740 220 S 900 120, 1060 80",
      fill: "none", stroke: "var(--water)", "stroke-width": 16, "stroke-linecap": "round" }, g);
    el("ellipse", { cx: 500, cy: 390, rx: 390, ry: 300, fill: "none", stroke: "var(--road-edge)", "stroke-width": 13 }, g);
    el("ellipse", { cx: 500, cy: 390, rx: 390, ry: 300, fill: "none", stroke: "var(--road)", "stroke-width": 9 }, g);
    ["M60 640 L940 150", "M140 160 L860 640", "M500 70 L500 710", "M110 400 L900 380", "M300 90 L420 700", "M720 90 L600 700"]
      .forEach((d) => {
        el("path", { d, fill: "none", stroke: "var(--road-edge)", "stroke-width": 8, "stroke-linecap": "round" }, g);
        el("path", { d, fill: "none", stroke: "var(--road)", "stroke-width": 5, "stroke-linecap": "round" }, g);
      });
    [["Markaz", 490, 368], ["Chilonzor", 230, 500], ["Yunusobod", 520, 150], ["Mirzo Ulug'bek", 780, 330],
     ["Sergeli", 430, 690], ["Eski shahar", 330, 300], ["Anhor", 660, 255]].forEach(([t, x, y]) => {
      const tx = el("text", { x, y, "text-anchor": "middle", "font-size": 15, "font-weight": 600, fill: "var(--label)", "pointer-events": "none" }, g);
      tx.textContent = t;
    });
  }

  function setPlaces(places, selectedId) {
    gPins.textContent = "";
    // tanlangan pin oxirida chiziladi — hammasining ustida turadi
    const ordered = [...places].sort((a, b) => (a.id === selectedId) - (b.id === selectedId));
    for (const p of ordered) {
      const { x, y } = proj(p.lat, p.lng);
      const cat = catById.get(p.category);
      const sel = p.id === selectedId;
      const g = el("g", { class: "pin" + (sel ? " sel" : ""), transform: `translate(${x} ${y})`, tabindex: 0, role: "button", "aria-label": p.name }, gPins);
      el("circle", { r: sel ? 17 : 14, fill: cat?.color ?? "#555" }, g);
      el("text", { "text-anchor": "middle", y: 5, "font-size": 14, "pointer-events": "none" }, g).textContent = cat?.emoji ?? "•";
      g.addEventListener("click", (e) => { e.stopPropagation(); onPinClick(p.id); });
      g.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPinClick(p.id); }
      });
    }
  }

  function setMe(lat, lng) {
    gMe.textContent = "";
    const { x, y } = proj(lat, lng);
    const g = el("g", { transform: `translate(${x} ${y})`, "pointer-events": "none" }, gMe);
    el("circle", { r: 22, fill: "var(--accent)", opacity: 0.18 }, g);
    el("circle", { r: 8, fill: "var(--accent)", stroke: "#fff", "stroke-width": 3 }, g);
    el("text", { y: -16, "text-anchor": "middle", "font-size": 12, "font-weight": 700, fill: "var(--accent)" }, g).textContent = "Men";
  }

  function zoomAt(f, cx, cy) {
    const nw = clamp(vb.w * f, W / 6, W * 1.6), r = nw / vb.w;
    vb = { x: cx - (cx - vb.x) * r, y: cy - (cy - vb.y) * r, w: nw, h: vb.h * r };
    applyVB();
  }
  const zoomCenter = (f) => zoomAt(f, vb.x + vb.w / 2, vb.y + vb.h / 2);
  function centerOn(lat, lng) {
    const { x, y } = proj(lat, lng);
    vb.x = x - vb.w / 2; vb.y = y - vb.h / 2; applyVB();
  }
  function reset() { vb = { x: 0, y: 0, w: W, h: H }; applyVB(); }

  const toSvg = (e) => {
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  };

  svg.addEventListener("wheel", (e) => {
    e.preventDefault();
    const p = toSvg(e);
    zoomAt(e.deltaY < 0 ? 0.85 : 1 / 0.85, p.x, p.y);
  }, { passive: false });

  let drag = null;
  svg.addEventListener("pointerdown", (e) => {
    drag = { sx: e.clientX, sy: e.clientY, vx: vb.x, vy: vb.y, moved: false };
    svg.setPointerCapture(e.pointerId);
  });
  svg.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
    if (!drag.moved && Math.abs(dx) + Math.abs(dy) > 5) { drag.moved = true; svg.classList.add("drag"); }
    if (!drag.moved) return;
    const k = vb.w / svg.getBoundingClientRect().width;
    vb.x = drag.vx - dx * k; vb.y = drag.vy - dy * k; applyVB();
  });
  svg.addEventListener("pointerup", (e) => {
    svg.classList.remove("drag");
    if (drag && !drag.moved) { const p = toSvg(e); onEmptyClick(unproj(p.x, p.y)); }
    drag = null;
  });
  svg.addEventListener("pointercancel", () => { drag = null; svg.classList.remove("drag"); });

  return { setPlaces, setMe, centerOn, zoomIn: () => zoomCenter(0.7), zoomOut: () => zoomCenter(1 / 0.7), reset };
}
