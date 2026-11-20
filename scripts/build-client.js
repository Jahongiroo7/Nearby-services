// client/app/*.js bo'limlarini bitta IIFE ga, client/widgets/*.js ni undan keyin yig'adi → public/js/app.js
// Bo'limlar bitta yopiq hududni (closure) bo'lishadi, shuning uchun ularni alohida <script> qilib bo'lmaydi.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const list = (dir) =>
  fs.readdirSync(path.join(root, dir)).filter((f) => f.endsWith(".js")).sort()
    .map((f) => ({ name: `${dir}/${f}`, code: fs.readFileSync(path.join(root, dir, f), "utf8") }));

const app = list("client/app");
const widgets = list("client/widgets");
const banner = (n) => `\n/* ===== ${n} ===== */\n`;

const bundle =
  "/* Avtomatik yaratiladi: `npm run build`. Tahrirlamang — client/ papkasini o'zgartiring. */\n" +
  '(() => {\n"use strict";\n' +
  app.map((p) => banner(p.name) + p.code).join("") +
  "\n})();\n" +
  widgets.map((p) => banner(p.name) + p.code).join("");

new vm.Script(bundle, { filename: "app.js" }); // sintaksis xatosi bo'lsa shu yerda to'xtaydi

const outFile = path.join(root, "public/js/app.js");
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, bundle);
console.log(`public/js/app.js: ${(bundle.length / 1024).toFixed(0)} KB (${app.length + widgets.length} fayl)`);
