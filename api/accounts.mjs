import { createSession, json, readJsonBody, REMEMBERED_SESSION_SECONDS, sameOrigin, sessionCookie, sessionDetails } from "./_auth.mjs";
import { accountFromSession, createInvite, loadRegistry, publicAccount, setOwnerAccess, updateTester } from "./_workspace.mjs";

function claimsFor(account, workspaceId = account.workspaceId) { return { accountId:account.id, workspaceId, role:account.role, sessionVersion:account.sessionVersion }; }
function accountPayload(registry, resolved) {
  const base = { current:publicAccount(resolved.account), workspace:{ id:resolved.workspace.id, name:resolved.workspace.name, isOwn:resolved.workspace.id === resolved.account.workspaceId } };
  if (resolved.account.role === "owner") base.testers = Object.values(registry.accounts).filter(account => account.role === "tester").map(publicAccount);
  return base;
}

export default async function handler(request, response) {
  if (!["GET","POST"].includes(request.method)) return json(response, { error:"Method not allowed" }, 405);
  if (request.method === "POST" && !sameOrigin(request)) return json(response, { error:"Origin rejected" }, 403);
  const session = sessionDetails(request);
  if (!session) return json(response, { error:"Sign in required" }, 401);
  try {
    const { registry } = await loadRegistry();
    const body = request.method === "POST" ? await readJsonBody(request) : null, action = body?.action;
    const actor = session.legacy ? registry.accounts.owner : registry.accounts[session.claims?.accountId];
    if (action === "return_owner" && actor?.role === "owner" && actor.status === "active" && (session.legacy || Number(actor.sessionVersion) === Number(session.claims?.sessionVersion))) {
      const lifetime = session.remembered ? REMEMBERED_SESSION_SECONDS : undefined;
      response.setHeader("set-cookie", sessionCookie(createSession(process.env.ACCESS_SECRET, lifetime, claimsFor(actor)), session.remembered ? REMEMBERED_SESSION_SECONDS : null));
      return json(response, { ok:true });
    }
    const resolved = session.legacy ? { account:registry.accounts.owner, workspace:registry.workspaces.owner } : accountFromSession(registry, session);
    if (!resolved) return json(response, { error:"This session is no longer active" }, 401);
    if (request.method === "GET") return json(response, accountPayload(registry, resolved));
    if (action === "create_invite") {
      if (resolved.account.role !== "owner") return json(response, { error:"Owner access required" }, 403);
      const created = await createInvite(resolved.account.id, body.displayName, "tester");
      return json(response, { ok:true, token:created.token, expiresAt:created.expiresAt });
    }
    if (action === "reset_link") {
      if (resolved.account.role !== "owner") return json(response, { error:"Owner access required" }, 403);
      const target = registry.accounts[body.accountId];
      const created = await createInvite(resolved.account.id, target?.displayName, "reset", body.accountId);
      return json(response, { ok:true, token:created.token, expiresAt:created.expiresAt });
    }
    if (action === "switch_workspace") {
      if (resolved.account.role !== "owner") return json(response, { error:"Owner access required" }, 403);
      const target = registry.workspaces[body.workspaceId], tester = Object.values(registry.accounts).find(account => account.workspaceId === body.workspaceId);
      if (!target || !tester || tester.status !== "active" || !tester.ownerAccess) return json(response, { error:"This tester workspace is not available" }, 403);
      const lifetime = session.remembered ? REMEMBERED_SESSION_SECONDS : undefined;
      response.setHeader("set-cookie", sessionCookie(createSession(process.env.ACCESS_SECRET, lifetime, claimsFor(resolved.account, target.id)), session.remembered ? REMEMBERED_SESSION_SECONDS : null));
      return json(response, { ok:true, workspace:{ id:target.id, name:target.name } });
    }
    if (["disable","enable","delete"].includes(action)) {
      if (resolved.account.role !== "owner") return json(response, { error:"Owner access required" }, 403);
      await updateTester(resolved.account.id, body.accountId, action);
      return json(response, { ok:true });
    }
    if (action === "owner_access") {
      if (resolved.account.role !== "tester") return json(response, { error:"Tester account required" }, 403);
      await setOwnerAccess(resolved.account.id, body.allowed === true);
      return json(response, { ok:true, allowed:body.allowed === true });
    }
    return json(response, { error:"Unsupported account action" }, 400);
  } catch (error) { return json(response, { error:error.message || "Account operation failed" }, 400); }
}
