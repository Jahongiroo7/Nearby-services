# Nearby Services

Toshkent va butun O'zbekiston bo'yicha yaqin xizmatlar (sartaroshxona, dorixona, do'kon, avtoservis…) va jamoat joylari
interaktiv xaritada: qidiruv, filtrlar, marshrut, taqqoslash, 5 til (uz/en/ru/fr/de), kunduzgi/tungi rejim, mobil versiya.

**Stack:** Express (backend) + vanilla JS (frontend, framework va build vositasiz). Node 22.

> Xizmatlar va jamoat joylari namunaviy (deterministik tarzda yaratiladi). Ko'chalar — OpenStreetMap ma'lumoti.

## Ishga tushirish

```bash
npm install
npm run dev     # http://localhost:3000  (client/ yoki server/ o'zgarsa qayta ishga tushadi)
npm test
```

## Tuzilma

```
client/app/*.js      Ilova kodi bo'limlari (tartib raqami bilan) — bitta yopiq hududni bo'lishadi
client/widgets/*.js  Mustaqil qismlar: pastdan chiqadigan panel (mobil), rasm lightbox
scripts/build-client.js   client/ → public/js/app.js (npm run build; npm start o'zi chaqiradi)
public/              Statik fayllar: index.html, css/, js/boot.js, data/*.json (xarita, tarjima), img/photos
server/              Express: app.js, routes/ (reviews, reports), lib/ (store, validate, auth, rate-limit)
test/                API testlari (node:test)
```

`public/js/app.js` avtomatik yaratiladi va gitga kirmaydi — kodni `client/` ichida tahrirlang.

## API

| Metod | Yo'l | Izoh |
|---|---|---|
| GET | `/api/health` | Render health check |
| GET | `/api/reviews` | Barcha sharhlar `{ [xizmatId]: [...] }` |
| POST | `/api/reviews` | Sharh qo'shish (`serviceId, rid, name, stars 1–5, text`), 10/daqiqa |
| POST | `/api/reports` | Xato haqida xabar (`item, why, text`), 5/daqiqa |
| GET / PATCH / DELETE | `/api/reports[/:id]` | Faqat `Authorization: Bearer <ADMIN_TOKEN>` |

Sharh va xabarlar `DATA_DIR` (standart `./var`) ichidagi JSON fayllarda saqlanadi.
Server ishlamasa ilova baribir ishlaydi: sharh brauzerda saqlanib qoladi.

## Render ga joylash

1. Kodni GitHub ga push qiling.
2. Render → **New → Blueprint** → repozitoriyni tanlang (`render.yaml` avtomatik o'qiladi).
   Yoki **New → Web Service**: Build `npm ci --omit=dev && npm run build`, Start `npm start`, Health check `/api/health`.
3. `ADMIN_TOKEN` avtomatik yaratiladi (Dashboard → Environment).

**Muhim:** Render Free rejasida fayl tizimi vaqtinchalik — qayta deploy yoki uyqudan keyin serverdagi sharhlar va
xabarlar yo'qoladi. Doimiy saqlash uchun pulli **Disk** ulab `DATA_DIR=/var/data` qo'ying
(yoki `server/lib/store.js` ni Postgres/SQLite ga almashtiring).

## Ma'lum cheklovlar

- Akkauntlar, saralanganlar, admin paneli, "Foydali" ovozlari va ulashishlar demo: faqat shu brauzerda (localStorage) saqlanadi.
- Xabarlar admin panelida emas, serverda ham saqlanadi; ularni `GET /api/reports` orqali ko'ring.
