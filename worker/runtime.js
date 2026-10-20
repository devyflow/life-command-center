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
    if (url.pathname.startsWith("/api/")) {
      const user = userFrom(request);
      if (!user) return json({ error: "Sign in required" }, 401);
      if (url.pathname === "/api/session") return json({ user: { email: user.email, name: user.name } });
      if (url.pathname === "/api/state") return stateRoute(request, env, user);
      return json({ error: "Not found" }, 404);
    }
    if (url.pathname === "/styles.css") return asset(ASSETS.css, "text/css; charset=utf-8");
    if (url.pathname === "/app.js") return asset(ASSETS.app, "text/javascript; charset=utf-8");
    if (url.pathname === "/scene.js") return asset(ASSETS.scene, "text/javascript; charset=utf-8");
    return asset(ASSETS.html, "text/html; charset=utf-8");
  },
};
