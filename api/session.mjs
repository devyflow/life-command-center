import { json, validSession } from "./_auth.mjs";

export default function handler(request, response) {
  if (!validSession(request)) return json(response, { error:"Sign in required" }, 401);
  return json(response, { user:{ name:"Private workspace", email:"" } });
}

