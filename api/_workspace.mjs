import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";

const DEFAULT_UPSTREAM = "https://lcc.aaadhar0.chatgpt.site";
const REGISTRY_VERSION = 1;
const MAX_TESTERS = 10;

const now = () => new Date().toISOString();
const clone = value => JSON.parse(JSON.stringify(value));
const tokenHash = value => createHash("sha256").update(String(value || "")).digest("hex");

export function passwordRecord(password, salt = randomBytes(16).toString("base64url")) {
  const hash = scryptSync(String(password), salt, 32, { N:16384, r:8, p:1 }).toString("base64url");
  return { salt, hash };
}

export function passwordMatches(password, record) {
  if (!record?.salt || !record?.hash || typeof password !== "string") return false;
  const supplied = Buffer.from(passwordRecord(password, record.salt).hash, "base64url");
  const expected = Buffer.from(record.hash, "base64url");
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

function normalizeAccessId(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 40);
}

function makeAccessId(name, registry) {
  const base = String(name || "tester").toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 20) || "tester";
  const used = new Set(Object.values(registry.accounts).map(account => account.accessId));
  for (let attempt = 0; attempt < 20; attempt++) {
    const candidate = `${base}-${randomBytes(2).toString("hex")}`;
    if (!used.has(candidate)) return candidate;
  }
  return `${base}-${randomUUID().slice(0, 8)}`;
}

function freshRegistry(legacyState, ownerPassword) {
  const createdAt = now();
  return {
    __lccRegistryVersion: REGISTRY_VERSION,
    tasks: [],
    accounts: {
      owner: {
        id:"owner", accessId:"owner", displayName:"Owner", role:"owner", status:"active",
        password:passwordRecord(ownerPassword), sessionVersion:1, workspaceId:"owner",
        ownerAccess:true, failedAttempts:0, lockedUntil:null, createdAt,
      },
    },
    workspaces: {
      owner: { id:"owner", name:"My command center", ownerAccountId:"owner", state:legacyState, revision:0, updatedAt:createdAt },
    },
    invites: [],
    audit: [{ id:randomUUID(), at:createdAt, actorId:"owner", action:"owner_workspace_migrated", targetId:"owner" }],
    updatedAt:createdAt,
  };
}

function normalizeRegistry(registry) {
  registry.tasks ||= [];
  registry.accounts ||= {};
  registry.workspaces ||= {};
  registry.invites ||= [];
  registry.audit ||= [];
  registry.updatedAt ||= now();
  return registry;
}

async function upstreamCookie(origin) {
  const result = await fetch(`${origin}/api/unlock`, {
    method:"POST",
    headers:{ "content-type":"application/json", origin },
    body:JSON.stringify({ secret:process.env.ACCESS_SECRET }),
  });
  if (!result.ok) throw new Error("Cloud workspace authentication failed");
  const cookie = (result.headers.get("set-cookie") || "").split(";")[0];
  if (!cookie) throw new Error("Cloud workspace did not issue a session");
  return cookie;
}

async function upstreamRequest(method, body) {
  if (!process.env.ACCESS_SECRET) throw new Error("Cloud connection is not configured");
  const origin = String(process.env.UPSTREAM_URL || DEFAULT_UPSTREAM).replace(/\/$/, "");
  const cookie = await upstreamCookie(origin);
  const options = { method, headers:{ cookie, origin } };
  if (body !== undefined) {
    options.headers["content-type"] = "application/json";
    options.body = JSON.stringify(body);
  }
  const response = await fetch(`${origin}/api/state`, options);
  const result = await response.json().catch(() => ({}));
  if (!response.ok && response.status !== 409) throw new Error(result.error || "Cloud workspace is unavailable");
  return { response, result };
}

async function readRaw() {
  const { result } = await upstreamRequest("GET");
  return { state:result.state, revision:Number(result.revision || 0), updatedAt:result.updatedAt || null };
}

async function writeRaw(state, baseRevision) {
  return upstreamRequest("PUT", { state, baseRevision });
}

export async function loadRegistry() {
  for (let attempt = 0; attempt < 4; attempt++) {
    const raw = await readRaw();
    if (raw.state?.__lccRegistryVersion === REGISTRY_VERSION) return { registry:normalizeRegistry(raw.state), upstreamRevision:raw.revision };
    const registry = freshRegistry(raw.state, process.env.ACCESS_SECRET);
    const written = await writeRaw(registry, raw.revision);
    if (written.response.ok) return { registry, upstreamRevision:Number(written.result.revision || raw.revision + 1) };
  }
  throw new Error("Workspace migration is busy. Try again.");
}

export async function mutateRegistry(mutator) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const raw = await readRaw();
    const registry = raw.state?.__lccRegistryVersion === REGISTRY_VERSION
      ? normalizeRegistry(clone(raw.state))
      : freshRegistry(raw.state, process.env.ACCESS_SECRET);
    const result = await mutator(registry);
    registry.updatedAt = now();
    registry.audit = registry.audit.slice(-250);
    if (JSON.stringify(registry).length > 850_000) throw new Error("Combined tester workspaces have reached the prototype storage limit. Export or remove an unused tester workspace before adding more data.");
    const written = await writeRaw(registry, raw.revision);
    if (written.response.ok) return { registry, result, upstreamRevision:Number(written.result.revision || raw.revision + 1) };
  }
  throw new Error("Another device changed the workspace. Try again.");
}

export function accountFromSession(registry, session) {
  if (!session?.claims) return null;
  const account = registry.accounts[session.claims.accountId];
  if (!account || account.status !== "active" || Number(account.sessionVersion) !== Number(session.claims.sessionVersion)) return null;
  const workspace = registry.workspaces[session.claims.workspaceId];
  if (!workspace) return null;
  if (account.role === "owner") {
    if (workspace.id !== account.workspaceId) {
      const target = Object.values(registry.accounts).find(item => item.workspaceId === workspace.id);
      if (!target || target.status !== "active" || !target.ownerAccess) return null;
    }
  } else if (workspace.id !== account.workspaceId) return null;
  return { account, workspace };
}

export async function authenticate(accessId, password) {
  const normalized = normalizeAccessId(accessId || "owner");
  return mutateRegistry(registry => {
    const account = Object.values(registry.accounts).find(item => item.accessId === normalized);
    if (!account || account.status !== "active") return { ok:false, error:"Access ID or passphrase is not correct." };
    const lockedUntil = Date.parse(account.lockedUntil || 0);
    if (lockedUntil > Date.now()) return { ok:false, error:"Too many attempts. Try again in a few minutes." };
    if (!passwordMatches(password, account.password)) {
      account.failedAttempts = Number(account.failedAttempts || 0) + 1;
      if (account.failedAttempts >= 6) {
        account.failedAttempts = 0;
        account.lockedUntil = new Date(Date.now() + 5 * 60_000).toISOString();
      }
      return { ok:false, error:"Access ID or passphrase is not correct." };
    }
    account.failedAttempts = 0;
    account.lockedUntil = null;
    registry.audit.push({ id:randomUUID(), at:now(), actorId:account.id, action:"signed_in", targetId:account.workspaceId });
    return { ok:true, account };
  });
}

export async function activateInvite(token, displayName, password, ownerAccess) {
  if (String(password || "").length < 10) throw new Error("Use at least 10 characters for the passphrase.");
  const hashed = tokenHash(token);
  return mutateRegistry(registry => {
    const invite = registry.invites.find(item => item.tokenHash === hashed && !item.usedAt);
    if (!invite || Date.parse(invite.expiresAt) <= Date.now()) throw new Error("This invitation has expired or was already used.");
    if (invite.type === "reset") {
      const account = registry.accounts[invite.accountId];
      if (!account || account.status !== "active") throw new Error("This account is unavailable.");
      account.password = passwordRecord(password);
      account.sessionVersion = Number(account.sessionVersion || 1) + 1;
      account.failedAttempts = 0; account.lockedUntil = null; invite.usedAt = now();
      registry.audit.push({ id:randomUUID(), at:now(), actorId:account.id, action:"passphrase_reset", targetId:account.id });
      return { account, reset:true };
    }
    if (!ownerAccess) throw new Error("Owner support access must be accepted for this tester invitation.");
    if (Object.values(registry.accounts).filter(account => account.role === "tester" && account.status === "active").length >= MAX_TESTERS) throw new Error("The tester limit has been reached.");
    const id = randomUUID(), workspaceId = randomUUID(), name = String(displayName || invite.displayName || "Tester").trim().slice(0, 60) || "Tester";
    const account = { id, accessId:makeAccessId(name, registry), displayName:name, role:"tester", status:"active", password:passwordRecord(password), sessionVersion:1, workspaceId, ownerAccess:true, failedAttempts:0, lockedUntil:null, createdAt:now() };
    registry.accounts[id] = account;
    registry.workspaces[workspaceId] = { id:workspaceId, name:`${name}'s command center`, ownerAccountId:id, state:null, revision:0, updatedAt:now() };
    invite.usedAt = now(); invite.accountId = id;
    registry.audit.push({ id:randomUUID(), at:now(), actorId:id, action:"tester_activated", targetId:workspaceId });
    return { account, reset:false };
  });
}

export async function createInvite(ownerId, displayName, type = "tester", accountId = null) {
  const token = randomBytes(24).toString("base64url");
  const expiresAt = new Date(Date.now() + 7 * 86400_000).toISOString();
  const output = await mutateRegistry(registry => {
    const owner = registry.accounts[ownerId];
    if (!owner || owner.role !== "owner" || owner.status !== "active") throw new Error("Owner access required.");
    if (type === "tester" && Object.values(registry.accounts).filter(account => account.role === "tester" && account.status === "active").length >= MAX_TESTERS) throw new Error("The tester limit has been reached.");
    if (type === "reset") {
      const target = registry.accounts[accountId];
      if (!target || target.role !== "tester") throw new Error("Tester account not found.");
    }
    registry.invites = registry.invites.filter(item => !item.usedAt && Date.parse(item.expiresAt) > Date.now());
    registry.invites.push({ id:randomUUID(), tokenHash:tokenHash(token), type, accountId, displayName:String(displayName || "Tester").trim().slice(0, 60), createdBy:ownerId, createdAt:now(), expiresAt, usedAt:null });
    registry.audit.push({ id:randomUUID(), at:now(), actorId:ownerId, action:type === "reset" ? "reset_link_created" : "tester_invited", targetId:accountId || "pending" });
    return true;
  });
  return { ...output, token, expiresAt };
}

export async function updateTester(ownerId, accountId, action) {
  return mutateRegistry(registry => {
    const owner = registry.accounts[ownerId], target = registry.accounts[accountId];
    if (!owner || owner.role !== "owner") throw new Error("Owner access required.");
    if (!target || target.role !== "tester") throw new Error("Tester account not found.");
    if (action === "disable") { target.status = "disabled"; target.sessionVersion += 1; }
    else if (action === "enable") { target.status = "active"; target.sessionVersion += 1; }
    else if (action === "delete") { delete registry.workspaces[target.workspaceId]; delete registry.accounts[target.id]; }
    else throw new Error("Unsupported account action.");
    registry.audit.push({ id:randomUUID(), at:now(), actorId:ownerId, action:`tester_${action}d`, targetId:accountId });
    return true;
  });
}

export async function setOwnerAccess(accountId, allowed) {
  return mutateRegistry(registry => {
    const account = registry.accounts[accountId];
    if (!account || account.role !== "tester" || account.status !== "active") throw new Error("Tester account not found.");
    account.ownerAccess = Boolean(allowed);
    registry.audit.push({ id:randomUUID(), at:now(), actorId:accountId, action:allowed ? "owner_support_enabled" : "owner_support_disabled", targetId:account.workspaceId });
    return account.ownerAccess;
  });
}

export function publicAccount(account) {
  return { id:account.id, accessId:account.accessId, displayName:account.displayName, role:account.role, status:account.status, workspaceId:account.workspaceId, ownerAccess:Boolean(account.ownerAccess), createdAt:account.createdAt };
}
