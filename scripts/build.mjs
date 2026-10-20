import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const dist = resolve(root, "dist");
const read = (path) => readFile(resolve(root, path), "utf8");

const [html, css, app, scene, runtime, hosting] = await Promise.all([
  read("client/index.html"),
  read("client/styles.css"),
  read("client/app.js"),
  read("client/scene.js"),
  read("worker/runtime.js"),
  read(".openai/hosting.json"),
]);

const source = `const ASSETS = ${JSON.stringify({ html, css, app, scene })};\n${runtime}`;
await rm(dist, { recursive: true, force: true });
await mkdir(resolve(dist, "server"), { recursive: true });
await mkdir(resolve(dist, ".openai"), { recursive: true });
await writeFile(resolve(dist, "server/index.js"), source);
await writeFile(resolve(dist, ".openai/hosting.json"), hosting);
console.log(`Built authenticated Worker (${source.length} bytes)`);
