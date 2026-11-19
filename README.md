# Yaqin xizmatlar

Toshkent bo'yicha yaqin dorixona, shifoxona, bank, kafe, yoqilg'i va metro joylarini topish.
Express API + vanilla JS frontend (build bosqichi yo'q).

## Lokal ishga tushirish

```bash
npm install
cp .env.example .env   # ixtiyoriy
npm run dev            # http://localhost:3000
npm test
```

## API

| Metod | Yo'l | Izoh |
|---|---|---|
| GET | `/api/health` | Render health check |
| GET | `/api/categories`, `/api/meta` | Kategoriyalar, xarita chegarasi |
| GET | `/api/places?q=&category=a,b&openNow=1&lat=&lng=&radius=&sort=dist\|rating\|name` | Qidiruv |
| GET | `/api/places/:id` | Bitta joy |
| POST / PUT / PATCH / DELETE | `/api/places[/:id]` | Faqat `Authorization: Bearer <ADMIN_TOKEN>` bilan |

## Render ga joylash

1. Kodni GitHub ga push qiling.
2. Render → **New → Blueprint** → repozitoriyni tanlang (`render.yaml` avtomatik o'qiladi).
   Yoki **New → Web Service**: Build `npm ci --omit=dev`, Start `npm start`, Health check `/api/health`.
3. `ADMIN_TOKEN` avtomatik yaratiladi (yoki o'zingiz kiriting).

**Muhim:** Free rejada fayl tizimi vaqtinchalik — qayta deploy/uyqudan keyin admin API orqali
qo'shilgan joylar `places.seed.json` holatiga qaytadi. Doimiy saqlash uchun Render **Disk** (pulli)
ulang va `DATA_FILE=/var/data/places.json` qo'ying, yoki `server/lib/store.js` ni Postgres/SQLite ga almashtiring.
