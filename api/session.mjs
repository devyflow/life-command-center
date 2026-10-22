import { createSession, json, REMEMBERED_SESSION_SECONDS, sessionCookie, sessionDetails } from "./_auth.mjs";
import { accountFromSession, loadRegistry, publicAccount } from "./_workspace.mjs";

export default async function handler(request, response) {
  const session = sessionDetails(request);
  if (!session) return json(response, { error:"Sign in required" }, 401);
  try {
    const { registry } = await loadRegistry();
    const resolved = session.legacy ? { account:registry.accounts.owner, workspace:registry.workspaces.owner } : accountFromSession(registry, session);
    if (!resolved) return json(response, { error:"This session is no longer active" }, 401);
    const claims = { accountId:resolved.account.id, workspaceId:resolved.workspace.id, role:resolved.account.role, sessionVersion:resolved.account.sessionVersion };
    if (session.remembered) response.setHeader("set-cookie", sessionCookie(createSession(process.env.ACCESS_SECRET, REMEMBERED_SESSION_SECONDS, claims), REMEMBERED_SESSION_SECONDS));
    return json(response, {
      user:{ name:resolved.account.displayName, email:"", ...publicAccount(resolved.account) },
      workspace:{ id:resolved.workspace.id, name:resolved.workspace.name, isOwn:resolved.workspace.id === resolved.account.workspaceId },
      viewingAsOwner:resolved.account.role === "owner" && resolved.workspace.id !== resolved.account.workspaceId,
    });
  } catch (error) { return json(response, { error:error.message || "Session unavailable" }, 502); }
}
