import path from "node:path";
import { fileURLToPath } from "node:url";
import { createApp } from "./app.js";
import { createStore } from "./lib/store.js";

const dir = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;
const DATA_FILE = process.env.DATA_FILE || path.join(dir, "data", "places.json");

const store = await createStore({
  file: DATA_FILE,
  seedFile: path.join(dir, "data", "places.seed.json"),
});

const app = createApp({ store, adminToken: process.env.ADMIN_TOKEN || "" });

const server = app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
  if (!process.env.ADMIN_TOKEN) console.log("Eslatma: ADMIN_TOKEN yo'q — POST/PUT/PATCH/DELETE o'chirilgan.");
});

for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => server.close(() => process.exit(0)));
