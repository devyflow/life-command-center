import { clearedSessionCookie, json, sameOrigin } from "./_auth.mjs";

export default function handler(request, response) {
  if (request.method !== "POST") return json(response, { error:"Method not allowed" }, 405);
  if (!sameOrigin(request)) return json(response, { error:"Origin rejected" }, 403);
  response.setHeader("set-cookie", clearedSessionCookie());
  return json(response, { ok:true });
}

