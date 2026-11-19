// Backend bilan aloqa — frontendning barcha fetch'lari shu yerda.

async function request(url, { signal } = {}) {
  const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!res.ok) {
    let msg = `Server xatosi (${res.status})`;
    try { msg = (await res.json()).error || msg; } catch { /* JSON emas */ }
    throw new Error(msg);
  }
  return res.json();
}

export const getCategories = () => request("/api/categories");
export const getMeta = () => request("/api/meta");

/** params: { q, category: string[], openNow, sort, lat, lng } */
export function searchPlaces(params, signal) {
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.category?.length) qs.set("category", params.category.join(","));
  if (params.openNow) qs.set("openNow", "1");
  qs.set("sort", params.sort);
  qs.set("lat", params.lat);
  qs.set("lng", params.lng);
  return request(`/api/places?${qs}`, { signal });
}
