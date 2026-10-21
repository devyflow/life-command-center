import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import unlock from "../api/unlock.mjs";
import session from "../api/session.mjs";
import page from "../api/page.mjs";

process.env.ACCESS_SECRET = "test-secret";

function response() {
  return { statusCode:200, headers:{}, body:"", setHeader(key,value){this.headers[key.toLowerCase()]=value;}, end(value=""){this.body=String(value);} };
}
function request(method="GET", headers={}, body=undefined) {
  const req = new EventEmitter(); req.method=method; req.headers=headers; req.body=body;
  req[Symbol.asyncIterator]=async function*(){ if(typeof body==="string")yield Buffer.from(body); };
  return req;
}

const locked=response();page(request(),locked);assert.match(locked.body,/Enter your secret word/);
const denied=response();await unlock(request("POST",{host:"example.test",origin:"https://example.test","x-forwarded-proto":"https"},{secret:"wrong"}),denied);assert.equal(denied.statusCode,401);
const sessionOnly=response();await unlock(request("POST",{host:"example.test",origin:"https://example.test","x-forwarded-proto":"https"},{secret:"test-secret",stayLoggedIn:false}),sessionOnly);assert.equal(sessionOnly.statusCode,200);assert.doesNotMatch(sessionOnly.headers["set-cookie"],/Max-Age=/);
const unlocked=response();await unlock(request("POST",{host:"example.test",origin:"https://example.test","x-forwarded-proto":"https"},{secret:"test-secret",stayLoggedIn:true}),unlocked);assert.equal(unlocked.statusCode,200);assert.match(unlocked.headers["set-cookie"],/Max-Age=31536000/);
const cookie=unlocked.headers["set-cookie"].split(";")[0];
const authorized=response();session(request("GET",{cookie}),authorized);assert.equal(authorized.statusCode,200);
const app=response();page(request("GET",{cookie}),app);assert.match(app.body,/Life Command Center/);assert.match(app.body,/scanModal/);
assert.match(app.body,/settingsModal/);assert.match(app.body,/manifest\.webmanifest/);assert.match(app.body,/Auto enhance/);assert.match(app.body,/English \+ Hindi/);assert.match(app.body,/Clear history/);assert.match(app.body,/installNudge/);assert.match(app.body,/resetMomentum/);assert.match(app.body,/Productive rhythm/);assert.match(app.body,/boardNoteModal/);assert.match(app.body,/libraryModal/);assert.match(app.body,/Bulletin board/);
const appSource=await readFile(resolve(import.meta.dirname,"../client/app.js"),"utf8");
assert.match(appSource,/data-planner-time/);assert.match(appSource,/exportBackup/);assert.match(appSource,/saveTaxonomy/);assert.match(appSource,/prepareScanVariants/);assert.match(appSource,/tessedit_pageseg_mode/);assert.match(appSource,/clearCompletedHistory/);assert.match(appSource,/completedHistoryClearedAt/);assert.match(appSource,/beforeinstallprompt/);assert.match(appSource,/showInstallNudge/);assert.match(appSource,/MOMENTUM_MILESTONES/);assert.match(appSource,/data-request-filter/);assert.match(appSource,/data-clear-request-history/);assert.match(appSource,/paperSafePosition/);assert.match(appSource,/initBulletinBoard/);assert.match(appSource,/openSharedLibraryCapture/);
for(const file of ["manifest.webmanifest","sw.js","icon-192.png","icon-512.png"])await access(resolve(import.meta.dirname,"../client",file));
console.log("Vercel entrance, cloud shell, Paper layout, bulletin board, useful library, scanner, planner, backups, taxonomy, and PWA validated");
