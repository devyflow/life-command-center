import { createSession, json, readJsonBody, REMEMBERED_SESSION_SECONDS, sameOrigin, sessionCookie } from "./_auth.mjs";
import { activateInvite, authenticate, recoverAccount } from "./_workspace.mjs";

const requestContext=request=>({ip:String(request.headers["x-forwarded-for"]||request.headers["x-real-ip"]||"unknown").split(",")[0].trim(),userAgent:request.headers["user-agent"]||""});

export default async function handler(request, response) {
  if (request.method !== "POST") return json(response, { error:"Method not allowed" }, 405);
  if (!sameOrigin(request)) return json(response, { error:"Origin rejected" }, 403);
  let body;
  try { body = await readJsonBody(request); } catch { return json(response, { error:"Enter your access details" }, 400); }
  try {
    const remembered = body?.stayLoggedIn === true;
    let outcome;const context=requestContext(request);
    if (body?.recover) outcome=(await recoverAccount(body.accessId,body.recoveryCode,body.password,context)).result;
    else if (body?.inviteToken) outcome = (await activateInvite(body.inviteToken, body.displayName, body.password, body.ownerAccess === true,context)).result;
    else {
      const login = await authenticate(body?.accessId || "owner", body?.password ?? body?.secret,context);
      outcome = login.result;
      if (!outcome.ok) return json(response, { error:outcome.error }, 401);
    }
    const account = outcome.account;
    const claims = { accountId:account.id, workspaceId:account.workspaceId, role:account.role, sessionVersion:account.sessionVersion, sessionId:outcome.deviceSession?.id };
    const lifetime = remembered ? REMEMBERED_SESSION_SECONDS : undefined;
    response.setHeader("set-cookie", sessionCookie(createSession(process.env.ACCESS_SECRET, lifetime, claims), remembered ? REMEMBERED_SESSION_SECONDS : null));
    return json(response, { ok:true, account:{ accessId:account.accessId, displayName:account.displayName, role:account.role }, activated:Boolean(body?.inviteToken), recovered:Boolean(body?.recover), reset:Boolean(outcome.reset), recoveryCodes:outcome.recoveryCodes || undefined });
  } catch (error) {
    return json(response, { error:error.message || "Access could not be created" }, 400);
  }
}
