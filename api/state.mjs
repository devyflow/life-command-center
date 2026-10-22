import { json, readJsonBody, sameOrigin, sessionDetails } from "./_auth.mjs";
import { accountFromSession, loadRegistry, mutateRegistry } from "./_workspace.mjs";

export default async function handler(request, response) {
  if (!["GET","PUT"].includes(request.method)) return json(response, { error:"Method not allowed" }, 405);
  if (request.method === "PUT" && !sameOrigin(request)) return json(response, { error:"Origin rejected" }, 403);
  const session = sessionDetails(request);
  if (!session) return json(response, { error:"Sign in required" }, 401);
  try {
    const loaded = await loadRegistry();
    const resolved = session.legacy ? { account:loaded.registry.accounts.owner, workspace:loaded.registry.workspaces.owner } : accountFromSession(loaded.registry, session);
    if (!resolved) return json(response, { error:"This session is no longer active" }, 401);
    if (request.method === "GET") return json(response, { state:resolved.workspace.state, revision:Number(resolved.workspace.revision || 0), updatedAt:resolved.workspace.updatedAt || null });
    const body = await readJsonBody(request);
    if (!body?.state || !Array.isArray(body.state.tasks)) return json(response, { error:"Invalid task state" }, 400);
    if (JSON.stringify(body.state).length > 700_000) return json(response, { error:"Workspace is too large" }, 413);
    let conflict = null;
    const saved = await mutateRegistry(registry => {
      const active = session.legacy ? { account:registry.accounts.owner, workspace:registry.workspaces.owner } : accountFromSession(registry, session);
      if (!active) throw new Error("This session is no longer active");
      const currentRevision = Number(active.workspace.revision || 0), baseRevision = Number(body.baseRevision || 0);
      if (!body.force && baseRevision !== currentRevision) { conflict = { state:active.workspace.state, revision:currentRevision, updatedAt:active.workspace.updatedAt || null }; return false; }
      active.workspace.state = body.state;
      active.workspace.revision = currentRevision + 1;
      active.workspace.updatedAt = new Date().toISOString();
      return { revision:active.workspace.revision, updatedAt:active.workspace.updatedAt };
    });
    if (conflict) return json(response, { error:"revision_conflict", ...conflict }, 409);
    return json(response, { ok:true, ...saved.result });
  } catch (error) { return json(response, { error:error.message || "Cloud workspace is unavailable" }, 502); }
}
