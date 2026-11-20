/* Ilovani yuklash: avval ma'lumotlar (xarita, tarjima, rasmlar, sharhlar), keyin app.js. */
(() => {
  const boot = document.getElementById("boot");
  const DATA = [
    ["osm", "data/osm.json", true],
    ["bounds", "data/bounds.json", true],
    ["i18n", "data/i18n.json", false],
    ["photos", "data/photos.json", false],
    ["reviews", "api/reviews", false],
  ];

  async function getJson(url) {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`${url}: ${res.status}`);
    return res.json();
  }

  function fail(message) {
    boot.classList.add("boot-error");
    boot.innerHTML = "";
    const text = document.createElement("p");
    text.textContent = message;
    const retry = document.createElement("button");
    retry.type = "button";
    retry.className = "btn btn-accent";
    retry.textContent = "Qayta urinish";
    retry.addEventListener("click", start);
    boot.append(text, retry);
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = () => reject(new Error(`${src} yuklanmadi`));
      document.body.appendChild(s);
    });
  }

  async function start() {
    boot.className = "boot";
    boot.textContent = "Yuklanmoqda…";
    const data = {};
    const results = await Promise.allSettled(DATA.map(([, url]) => getJson(url)));
    for (const [i, [key, , required]] of DATA.entries()) {
      const r = results[i];
      if (r.status === "fulfilled") data[key] = r.value;
      else if (required) return fail("Xarita ma'lumotlarini yuklab bo'lmadi. Internetni tekshirib, qayta urining.");
    }
    window.NS_DATA = data;
    try {
      await loadScript("js/app.js");
    } catch (err) {
      return fail("Ilovani yuklab bo'lmadi. Qayta urinib ko'ring.");
    }
    boot.remove();
  }

  start();
})();
