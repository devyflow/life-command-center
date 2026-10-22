import { createSession, json, REMEMBERED_SESSION_SECONDS, sessionCookie, sessionDetails } from "./_auth.mjs";

export default function handler(request, response) {
  const session=sessionDetails(request);
  if (!session) return json(response, { error:"Sign in required" }, 401);
  if(session.remembered)response.setHeader("set-cookie",sessionCookie(createSession(process.env.ACCESS_SECRET,REMEMBERED_SESSION_SECONDS),REMEMBERED_SESSION_SECONDS));
  return json(response, { user:{ name:"Private workspace", email:"" } });
}
