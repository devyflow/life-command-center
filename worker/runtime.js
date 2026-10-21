const json = (value, status = 200) => new Response(JSON.stringify(value), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
});

function userFrom(request) {
  const userId = request.headers.get("oai-authenticated-user-id");
  if (!userId) return null;
  const email = request.headers.get("oai-authenticated-user-email") || "";
  const encoded = request.headers.get("oai-authenticated-user-full-name");
  let name = email || "Life Command user";
  if (encoded && request.headers.get("oai-authenticated-user-full-name-encoding") === "percent-encoded-utf-8") {
    try { name = decodeURIComponent(encoded); } catch { name = email || "Life Command user"; }
  }
  return { userId, email, name };
}

const ACCESS_COOKIE = "life_command_access";
const SESSION_SECONDS = 60 * 60 * 24 * 30;
const encoder = new TextEncoder();
function cookieValue(request, name) {
  const cookie = request.headers.get("cookie") || "";
  for (const part of cookie.split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return value.join("=");
  }
  return null;
}
function base64url(bytes) {
  let binary = "";
  for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
async function digest(value) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
}
function equalBytes(left, right) {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index++) mismatch |= left[index] ^ right[index];
  return mismatch === 0;
}
async function signSession(expires, secret) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name:"HMAC", hash:"SHA-256" }, false, ["sign"]);
  return base64url(await crypto.subtle.sign("HMAC", key, encoder.encode(String(expires))));
}
async function secretMatches(candidate, secret) {
  const [left, right] = await Promise.all([digest(candidate), digest(secret)]);
  return equalBytes(left, right);
}
async function accessUser(request, env) {
  const authenticated = userFrom(request);
  if (authenticated) return authenticated;
  if (!env.ACCESS_SECRET) return null;
  const token = cookieValue(request, ACCESS_COOKIE);
  if (!token) return null;
  const [expiresText, signature] = token.split(".");
  const expires = Number(expiresText);
  if (!Number.isFinite(expires) || expires <= Math.floor(Date.now() / 1000) || !signature) return null;
  const expected = await signSession(expiresText, env.ACCESS_SECRET);
  if (!equalBytes(encoder.encode(signature), encoder.encode(expected))) return null;
  return { userId:"private-workspace", email:"", name:"Private workspace" };
}

async function unlockRoute(request, env) {
  if (request.method !== "POST") return json({ error:"Method not allowed" }, 405);
  if (!sameOrigin(request)) return json({ error:"Origin rejected" }, 403);
  if (!env.ACCESS_SECRET) return json({ error:"The private entrance is not configured" }, 503);
  let body;
  try { body = await request.json(); } catch { return json({ error:"Enter the secret word" }, 400); }
  if (typeof body?.secret !== "string" || body.secret.length > 200) return json({ error:"Enter the secret word" }, 400);
  if (!(await secretMatches(body.secret, env.ACCESS_SECRET))) return json({ error:"That secret word is not correct." }, 401);
  const expires = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const signature = await signSession(expires, env.ACCESS_SECRET);
  const response = json({ ok:true });
  response.headers.append("set-cookie", `${ACCESS_COOKIE}=${expires}.${signature}; Path=/; Max-Age=${SESSION_SECONDS}; HttpOnly; Secure; SameSite=Strict`);
  return response;
}

function logoutRoute() {
  const response = json({ ok:true });
  response.headers.append("set-cookie", `${ACCESS_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`);
  return response;
}

function sameOrigin(request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

async function stateRoute(request, env, user) {
  if (!env.DB) return json({ error: "Cloud database is unavailable" }, 503);
  const current = await env.DB.prepare("SELECT payload, revision, updated_at FROM user_state WHERE user_id = ?")
    .bind(user.userId).first();
  if (request.method === "GET") {
    return json({
      state: current ? JSON.parse(current.payload) : null,
      revision: Number(current?.revision || 0),
      updatedAt: current?.updated_at || null,
    });
  }
  if (request.method !== "PUT") return json({ error: "Method not allowed" }, 405);
  if (!sameOrigin(request)) return json({ error: "Origin rejected" }, 403);
  const raw = await request.text();
  if (raw.length > 900_000) return json({ error: "State is too large" }, 413);
  let body;
  try { body = JSON.parse(raw); } catch { return json({ error: "Invalid JSON" }, 400); }
  if (!body?.state || !Array.isArray(body.state.tasks)) return json({ error: "Invalid task state" }, 400);
  const baseRevision = Number(body.baseRevision || 0);
  const currentRevision = Number(current?.revision || 0);
  if (!body.force && baseRevision !== currentRevision) {
    return json({
      error: "revision_conflict",
      revision: currentRevision,
      state: current ? JSON.parse(current.payload) : null,
    }, 409);
  }
  const revision = currentRevision + 1;
  const updatedAt = new Date().toISOString();
  await env.DB.prepare(`INSERT INTO user_state (user_id, email, display_name, payload, revision, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET email=excluded.email, display_name=excluded.display_name,
    payload=excluded.payload, revision=excluded.revision, updated_at=excluded.updated_at`)
    .bind(user.userId, user.email, user.name, JSON.stringify(body.state), revision, updatedAt).run();
  return json({ ok: true, revision, updatedAt });
}

function asset(body, type) {
  return new Response(body, { headers: { "content-type": type, "cache-control": "public, max-age=300" } });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/unlock") return unlockRoute(request, env);
    if (url.pathname === "/api/logout") return request.method === "POST" && sameOrigin(request) ? logoutRoute() : json({ error:"Method not allowed" }, 405);
    const user = await accessUser(request, env);
    if (url.pathname.startsWith("/api/")) {
      if (!user) return json({ error: "Sign in required" }, 401);
      if (url.pathname === "/api/session") return json({ user: { email: user.email, name: user.name } });
      if (url.pathname === "/api/state") return stateRoute(request, env, user);
      return json({ error: "Not found" }, 404);
    }
    if (url.pathname === "/styles.css") return asset(ASSETS.css, "text/css; charset=utf-8");
    if (url.pathname === "/app.js") return asset(ASSETS.app, "text/javascript; charset=utf-8");
    if (url.pathname === "/scene.js") return asset(ASSETS.scene, "text/javascript; charset=utf-8");
    if (!user) return new Response(ASSETS.lock, { headers:{ "content-type":"text/html; charset=utf-8", "cache-control":"no-store" } });
    return asset(ASSETS.html, "text/html; charset=utf-8");
  },
};
