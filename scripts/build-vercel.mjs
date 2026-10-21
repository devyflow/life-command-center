import { cp, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const output = resolve(root, "public");
await rm(output, { recursive:true, force:true });
await mkdir(output, { recursive:true });
for (const file of ["app.js", "scene.js", "styles.css", "manifest.webmanifest", "sw.js", "icon-192.png", "icon-512.png"]) {
  await cp(resolve(root, "client", file), resolve(output, file));
}
console.log("Prepared Vercel static assets");
