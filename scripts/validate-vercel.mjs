import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
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
const unlocked=response();await unlock(request("POST",{host:"example.test",origin:"https://example.test","x-forwarded-proto":"https"},{secret:"test-secret"}),unlocked);assert.equal(unlocked.statusCode,200);
const cookie=unlocked.headers["set-cookie"].split(";")[0];
const authorized=response();session(request("GET",{cookie}),authorized);assert.equal(authorized.statusCode,200);
const app=response();page(request("GET",{cookie}),app);assert.match(app.body,/Life Command Center/);assert.match(app.body,/scanModal/);
console.log("Vercel private entrance, session, app shell, and scanner validated");

