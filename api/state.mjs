import { json, validSession } from "./_auth.mjs";

const DEFAULT_UPSTREAM = "https://lcc.aaadhar0.chatgpt.site";

async function upstreamCookie(origin, secret) {
  const result = await fetch(`${origin}/api/unlock`, {
    method:"POST",
    headers:{ "content-type":"application/json", origin },
    body:JSON.stringify({ secret }),
  });
  if (!result.ok) throw new Error("Cloud workspace authentication failed");
  const source = result.headers.get("set-cookie") || "";
  const cookie = source.split(";")[0];
  if (!cookie) throw new Error("Cloud workspace did not issue a session");
  return cookie;
}

async function bodyText(request) {
  if (typeof request.body === "string") return request.body;
  if (request.body && typeof request.body === "object") return JSON.stringify(request.body);
  let raw = "";
  for await (const chunk of request) raw += chunk;
  return raw;
}

export default async function handler(request, response) {
  if (!validSession(request)) return json(response, { error:"Sign in required" }, 401);
  if (!process.env.ACCESS_SECRET) return json(response, { error:"Cloud connection is not configured" }, 503);
  if (!["GET","PUT"].includes(request.method)) return json(response, { error:"Method not allowed" }, 405);
  const origin = String(process.env.UPSTREAM_URL || DEFAULT_UPSTREAM).replace(/\/$/, "");
  try {
    const cookie = await upstreamCookie(origin, process.env.ACCESS_SECRET);
    const options = { method:request.method, headers:{ cookie, origin } };
    if (request.method === "PUT") {
      options.headers["content-type"] = "application/json";
      options.body = await bodyText(request);
    }
    const upstream = await fetch(`${origin}/api/state`, options);
    response.statusCode = upstream.status;
    response.setHeader("content-type", upstream.headers.get("content-type") || "application/json; charset=utf-8");
    response.setHeader("cache-control", "no-store");
    response.end(await upstream.text());
  } catch (error) {
    return json(response, { error:error.message || "Cloud workspace is unavailable" }, 502);
  }
}

