import { createSession, json, readJsonBody, sameOrigin, secretMatches, sessionCookie } from "./_auth.mjs";

export default async function handler(request, response) {
  if (request.method !== "POST") return json(response, { error:"Method not allowed" }, 405);
  if (!sameOrigin(request)) return json(response, { error:"Origin rejected" }, 403);
  if (!process.env.ACCESS_SECRET) return json(response, { error:"The private entrance is not configured" }, 503);
  let body;
  try { body = await readJsonBody(request); } catch { return json(response, { error:"Enter the secret word" }, 400); }
  if (!secretMatches(body?.secret)) return json(response, { error:"That secret word is not correct." }, 401);
  response.setHeader("set-cookie", sessionCookie(createSession(process.env.ACCESS_SECRET)));
  return json(response, { ok:true });
}

