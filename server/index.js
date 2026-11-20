import path from "node:path";
import { createApp } from "./app.js";

const port = Number(process.env.PORT) || 3000;
const dataDir = path.resolve(process.env.DATA_DIR || "./var");

const { app, stores } = await createApp({ dataDir, adminToken: process.env.ADMIN_TOKEN });
const server = app.listen(port, () => console.log(`http://localhost:${port}  (ma'lumot: ${dataDir})`));

// Qayta ishga tushirishda kutilayotgan yozuvlar yo'qolmasin
for (const signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, () => {
    server.close(async () => {
      await Promise.all(stores.map((s) => s.idle()));
      process.exit(0);
    });
  });
}
