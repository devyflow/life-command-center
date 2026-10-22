import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const workerPath = resolve(import.meta.dirname, "../dist/server/index.js");
const source = await readFile(workerPath, "utf8");
const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
const worker = (await import(moduleUrl)).default;
assert.equal(typeof worker?.fetch, "function");
const lockEnv = { ACCESS_SECRET:"PaperOrbit-test" };
const locked = await worker.fetch(new Request("https://example.test/"), lockEnv, {});
assert.equal(locked.status, 200);
assert.match(await locked.text(), /Open your command center/);
const unlock = await worker.fetch(new Request("https://example.test/api/unlock", { method:"POST", headers:{ origin:"https://example.test", "content-type":"application/json" }, body:JSON.stringify({ secret:"PaperOrbit-test" }) }), lockEnv, {});
assert.equal(unlock.status, 200);
const cookie = unlock.headers.get("set-cookie").split(";")[0];
const page = await worker.fetch(new Request("https://example.test/", { headers:{ cookie } }), lockEnv, {});
assert.equal(page.status, 200);
const pageHtml = await page.text();
assert.match(pageHtml, /Life Command Center/);
assert.match(pageHtml, /scanModal/);
const unauthorized = await worker.fetch(new Request("https://example.test/api/state"), {}, {});
assert.equal(unauthorized.status, 401);

let stored = null;
const DB = { prepare(sql) { return { bind(...args) { return {
  async first() { return stored; },
  async run() { stored = { payload:args[3], revision:args[4], updated_at:args[5] }; return { success:true }; },
}; } }; } };
const headers = { "oai-authenticated-user-id":"user-1", "oai-authenticated-user-email":"user@example.test", origin:"https://example.test" };
const empty = await worker.fetch(new Request("https://example.test/api/state", { headers }), { DB }, {});
assert.deepEqual(await empty.json(), { state:null, revision:0, updatedAt:null });
const saved = await worker.fetch(new Request("https://example.test/api/state", { method:"PUT", headers:{...headers,"content-type":"application/json"}, body:JSON.stringify({ state:{ tasks:[], paper:{} }, baseRevision:0 }) }), { DB }, {});
assert.equal(saved.status, 200);
const conflict = await worker.fetch(new Request("https://example.test/api/state", { method:"PUT", headers:{...headers,"content-type":"application/json"}, body:JSON.stringify({ state:{ tasks:[] }, baseRevision:0 }) }), { DB }, {});
assert.equal(conflict.status, 409);
console.log("Worker, private entrance, page scanner, persistence, and revision conflicts validated");
