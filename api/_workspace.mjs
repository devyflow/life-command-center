import { createHash, createHmac, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";

const DEFAULT_UPSTREAM = "https://lcc.aaadhar0.chatgpt.site";
const REGISTRY_VERSION = 1;
const MAX_TESTERS = 10;
const MAX_AUDIT = 300;
const MAX_BACKUPS = 3;
const LOGIN_WINDOW_MS = 15 * 60_000;
const LOGIN_LIMIT = 8;

const now = () => new Date().toISOString();
const clone = value => JSON.parse(JSON.stringify(value));
const tokenHash = value => createHash("sha256").update(String(value || "")).digest("hex");
const securityHash = value => createHmac("sha256", process.env.ACCESS_SECRET || "local").update(String(value || "")).digest("hex");
const audit = (registry, actorId, action, targetId, detail = "") => registry.audit.push({ id:randomUUID(), at:now(), actorId, action, targetId, detail:String(detail || "").slice(0, 160) });
const recoveryCode = () => `LCC-${randomBytes(4).toString("hex").toUpperCase()}-${randomBytes(4).toString("hex").toUpperCase()}`;
function issueRecoveryCodes(account) {
  const codes = Array.from({ length:8 }, recoveryCode);
  account.recoveryCodes = codes.map(code => tokenHash(code));
  account.recoveryCodesCreatedAt = now();
  return codes;
}
function deviceName(userAgent = "") {
  const ua=String(userAgent).toLowerCase(), platform=ua.includes("iphone")?"iPhone":ua.includes("ipad")?"iPad":ua.includes("android")?"Android":ua.includes("windows")?"Windows":ua.includes("mac")?"Mac":"Browser";
  const browser=ua.includes("edg/")?"Edge":ua.includes("chrome/")?"Chrome":ua.includes("safari/")?"Safari":ua.includes("firefox/")?"Firefox":"Web app";
  return `${platform} · ${browser}`;
}
function createDeviceSession(registry, account, context = {}) {
  const id=randomUUID(),createdAt=now();
  registry.sessions[id]={id,accountId:account.id,device:deviceName(context.userAgent),ipHash:securityHash(context.ip || "unknown").slice(0,16),createdAt,lastSeenAt:createdAt,expiresAt:new Date(Date.now()+365*86400_000).toISOString(),revokedAt:null};
  return registry.sessions[id];
}

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
        ownerAccess:true, failedAttempts:0, lockedUntil:null, recoveryCodes:[], createdAt,
      },
    },
    workspaces: {
      owner: { id:"owner", name:"My command center", ownerAccountId:"owner", state:legacyState, revision:0, backups:[], updatedAt:createdAt },
    },
    invites: [],
    sessions: {},
    loginAttempts: {},
    audit: [{ id:randomUUID(), at:createdAt, actorId:"owner", action:"owner_workspace_migrated", targetId:"owner" }],
    updatedAt:createdAt,
  };
}

function normalizeRegistry(registry) {
  registry.tasks ||= [];
  registry.accounts ||= {};
  registry.workspaces ||= {};
  registry.invites ||= [];
  registry.sessions ||= {};
  registry.loginAttempts ||= {};
  Object.values(registry.accounts).forEach(account=>{account.recoveryCodes ||= [];});
  Object.values(registry.workspaces).forEach(workspace=>{workspace.backups ||= [];});
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
    registry.audit = registry.audit.slice(-MAX_AUDIT);
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
  if (session.claims.sessionId) {
    const deviceSession = registry.sessions[session.claims.sessionId];
    if (!deviceSession || deviceSession.accountId !== account.id || deviceSession.revokedAt || Date.parse(deviceSession.expiresAt || 0) <= Date.now()) return null;
  }
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

function pruneLoginAttempts(registry) {
  const cutoff=Date.now()-LOGIN_WINDOW_MS;
  for (const [key,entry] of Object.entries(registry.loginAttempts)) if (Date.parse(entry.startedAt || 0)<cutoff) delete registry.loginAttempts[key];
}

export async function authenticate(accessId, password, context = {}) {
  const normalized = normalizeAccessId(accessId || "owner");
  return mutateRegistry(registry => {
    pruneLoginAttempts(registry);
    const attemptKey=securityHash(`${context.ip || "unknown"}|${normalized}`), attempt=registry.loginAttempts[attemptKey];
    if (attempt && attempt.count >= LOGIN_LIMIT) return { ok:false, error:"Too many attempts. Try again in a few minutes." };
    const account = Object.values(registry.accounts).find(item => item.accessId === normalized);
    if (!account || account.status !== "active") {
      registry.loginAttempts[attemptKey]={count:Number(attempt?.count || 0)+1,startedAt:attempt?.startedAt || now()};
      return { ok:false, error:"Access ID or passphrase is not correct." };
    }
    const lockedUntil = Date.parse(account.lockedUntil || 0);
    if (lockedUntil > Date.now()) return { ok:false, error:"Too many attempts. Try again in a few minutes." };
    if (!passwordMatches(password, account.password)) {
      registry.loginAttempts[attemptKey]={count:Number(attempt?.count || 0)+1,startedAt:attempt?.startedAt || now()};
      account.failedAttempts = Number(account.failedAttempts || 0) + 1;
      if (account.failedAttempts >= 6) {
        account.failedAttempts = 0;
        account.lockedUntil = new Date(Date.now() + 5 * 60_000).toISOString();
      }
      return { ok:false, error:"Access ID or passphrase is not correct." };
    }
    account.failedAttempts = 0;
    account.lockedUntil = null;
    delete registry.loginAttempts[attemptKey];
    const deviceSession=createDeviceSession(registry,account,context);
    audit(registry,account.id,"signed_in",account.workspaceId,deviceSession.device);
    return { ok:true, account, deviceSession };
  });
}

export async function activateInvite(token, displayName, password, ownerAccess, context = {}) {
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
      Object.values(registry.sessions).filter(item=>item.accountId===account.id&&!item.revokedAt).forEach(item=>item.revokedAt=now());
      const deviceSession=createDeviceSession(registry,account,context);
      audit(registry,account.id,"passphrase_reset",account.id);
      return { account, reset:true, deviceSession };
    }
    if (!ownerAccess) throw new Error("Owner support access must be accepted for this tester invitation.");
    if (Object.values(registry.accounts).filter(account => account.role === "tester" && account.status === "active").length >= MAX_TESTERS) throw new Error("The tester limit has been reached.");
    const id = randomUUID(), workspaceId = randomUUID(), name = String(displayName || invite.displayName || "Tester").trim().slice(0, 60) || "Tester";
    const account = { id, accessId:makeAccessId(name, registry), displayName:name, role:"tester", status:"active", password:passwordRecord(password), sessionVersion:1, workspaceId, ownerAccess:true, failedAttempts:0, lockedUntil:null, recoveryCodes:[], createdAt:now() };
    registry.accounts[id] = account;
    registry.workspaces[workspaceId] = { id:workspaceId, name:`${name}'s command center`, ownerAccountId:id, state:null, revision:0, backups:[], updatedAt:now() };
    invite.usedAt = now(); invite.accountId = id;
    const recoveryCodes=issueRecoveryCodes(account),deviceSession=createDeviceSession(registry,account,context);
    audit(registry,id,"tester_activated",workspaceId);
    return { account, reset:false, recoveryCodes, deviceSession };
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
    audit(registry,ownerId,type === "reset" ? "reset_link_created" : "tester_invited",accountId || "pending");
    return true;
  });
  return { ...output, token, expiresAt };
}

export async function updateTester(ownerId, accountId, action) {
  return mutateRegistry(registry => {
    const owner = registry.accounts[ownerId], target = registry.accounts[accountId];
    if (!owner || owner.role !== "owner") throw new Error("Owner access required.");
    if (!target || target.role !== "tester") throw new Error("Tester account not found.");
    if (action === "disable") { target.status = "disabled"; target.sessionVersion += 1; Object.values(registry.sessions).filter(item=>item.accountId===target.id&&!item.revokedAt).forEach(item=>item.revokedAt=now()); }
    else if (action === "enable") { target.status = "active"; target.sessionVersion += 1; }
    else if (action === "delete") { const workspaceId=target.workspaceId; audit(registry,ownerId,"tester_deleted",accountId); delete registry.workspaces[workspaceId]; delete registry.accounts[target.id]; for(const [id,item] of Object.entries(registry.sessions))if(item.accountId===target.id)delete registry.sessions[id]; registry.invites=registry.invites.filter(item=>item.accountId!==target.id); return true; }
    else throw new Error("Unsupported account action.");
    audit(registry,ownerId,`tester_${action}d`,accountId);
    return true;
  });
}

export async function setOwnerAccess(accountId, allowed) {
  return mutateRegistry(registry => {
    const account = registry.accounts[accountId];
    if (!account || account.role !== "tester" || account.status !== "active") throw new Error("Tester account not found.");
    account.ownerAccess = Boolean(allowed);
    audit(registry,accountId,allowed ? "owner_support_enabled" : "owner_support_disabled",account.workspaceId);
    return account.ownerAccess;
  });
}

export async function recoverAccount(accessId, recoveryCodeValue, newPassword, context = {}) {
  if (String(newPassword || "").length < 10) throw new Error("Use at least 10 characters for the new passphrase.");
  const normalized=normalizeAccessId(accessId),hashed=tokenHash(String(recoveryCodeValue || "").trim().toUpperCase());
  return mutateRegistry(registry=>{
    const account=Object.values(registry.accounts).find(item=>item.accessId===normalized&&item.status==="active");
    const index=account?.recoveryCodes?.findIndex(code=>code===hashed) ?? -1;
    if(!account||index<0)throw new Error("The Access ID or recovery code is not correct.");
    account.recoveryCodes.splice(index,1);account.password=passwordRecord(newPassword);account.sessionVersion=Number(account.sessionVersion||1)+1;account.failedAttempts=0;account.lockedUntil=null;
    Object.values(registry.sessions).filter(item=>item.accountId===account.id&&!item.revokedAt).forEach(item=>item.revokedAt=now());
    const deviceSession=createDeviceSession(registry,account,context);audit(registry,account.id,"recovery_code_used",account.id);
    return {ok:true,account,deviceSession};
  });
}

export async function changePassword(accountId,currentPassword,newPassword,context={}) {
  if(String(newPassword||"").length<10)throw new Error("Use at least 10 characters for the new passphrase.");
  return mutateRegistry(registry=>{
    const account=registry.accounts[accountId];if(!account||!passwordMatches(currentPassword,account.password))throw new Error("Current passphrase is not correct.");
    account.password=passwordRecord(newPassword);account.sessionVersion=Number(account.sessionVersion||1)+1;
    Object.values(registry.sessions).filter(item=>item.accountId===account.id&&!item.revokedAt).forEach(item=>item.revokedAt=now());
    const deviceSession=createDeviceSession(registry,account,context);audit(registry,account.id,"passphrase_changed",account.id);
    return {account,deviceSession};
  });
}

export async function regenerateRecoveryCodes(accountId,currentPassword) {
  return mutateRegistry(registry=>{
    const account=registry.accounts[accountId];if(!account||!passwordMatches(currentPassword,account.password))throw new Error("Current passphrase is not correct.");
    const codes=issueRecoveryCodes(account);audit(registry,account.id,"recovery_codes_regenerated",account.id);return {codes};
  });
}

export async function revokeSession(accountId,sessionId,currentSessionId=null) {
  return mutateRegistry(registry=>{
    const target=registry.sessions[sessionId];if(!target||target.accountId!==accountId)throw new Error("Device session not found.");
    target.revokedAt=now();audit(registry,accountId,"device_revoked",sessionId,target.device);return {revokedCurrent:sessionId===currentSessionId};
  });
}

export async function revokeOtherSessions(accountId,currentSessionId=null) {
  return mutateRegistry(registry=>{let count=0;for(const item of Object.values(registry.sessions))if(item.accountId===accountId&&item.id!==currentSessionId&&!item.revokedAt){item.revokedAt=now();count++;}audit(registry,accountId,"other_devices_revoked",accountId,String(count));return {count};});
}

export async function cancelInvite(ownerId,inviteId) {
  return mutateRegistry(registry=>{const owner=registry.accounts[ownerId],invite=registry.invites.find(item=>item.id===inviteId&&!item.usedAt);if(!owner||owner.role!=="owner")throw new Error("Owner access required.");if(!invite)throw new Error("Invitation is no longer active.");invite.usedAt=now();invite.cancelledAt=invite.usedAt;audit(registry,ownerId,"invite_cancelled",invite.id);return true;});
}

export async function createWorkspaceBackup(accountId,workspaceId,label="Manual restore point") {
  return mutateRegistry(registry=>{const account=registry.accounts[accountId],workspace=registry.workspaces[workspaceId];if(!account||!workspace||workspace.id!==account.workspaceId&&account.role!=="owner")throw new Error("Workspace unavailable.");if(!workspace.state)throw new Error("Save something in this workspace before creating a restore point.");const original=workspace.backups||[],backup={id:randomUUID(),at:now(),revision:Number(workspace.revision||0),label:String(label).slice(0,60),state:clone(workspace.state)};workspace.backups=[backup,...original].slice(0,MAX_BACKUPS);if(JSON.stringify(registry).length>800_000){workspace.backups=original;throw new Error("This workspace is too large for another restore point. Download a JSON backup instead.");}audit(registry,accountId,"restore_point_created",workspaceId,backup.label);return {backup:{...backup,state:undefined}};});
}

export async function restoreWorkspaceBackup(accountId,workspaceId,backupId) {
  return mutateRegistry(registry=>{const account=registry.accounts[accountId],workspace=registry.workspaces[workspaceId];if(!account||!workspace||workspace.id!==account.workspaceId&&account.role!=="owner")throw new Error("Workspace unavailable.");const backup=(workspace.backups||[]).find(item=>item.id===backupId);if(!backup)throw new Error("Restore point not found.");if(workspace.state){const current={id:randomUUID(),at:now(),revision:Number(workspace.revision||0),label:"Before restore",state:clone(workspace.state)};workspace.backups=[current,...workspace.backups.filter(item=>item.id!==backupId)].slice(0,MAX_BACKUPS);}workspace.state=clone(backup.state);workspace.revision=Number(workspace.revision||0)+1;workspace.updatedAt=now();audit(registry,accountId,"workspace_restored",workspaceId,backup.at);return {revision:workspace.revision};});
}

export function addAutomaticBackup(registry,workspace) {
  if(!workspace?.state)return false;const latest=(workspace.backups||[]).find(item=>item.label==="Automatic");if(latest&&Date.now()-Date.parse(latest.at)<12*60*60_000)return false;
  const original=workspace.backups||[];workspace.backups=[{id:randomUUID(),at:now(),revision:Number(workspace.revision||0),label:"Automatic",state:clone(workspace.state)},...original].slice(0,MAX_BACKUPS);if(JSON.stringify(registry).length>800_000){workspace.backups=original;return false;}return true;
}

export function publicAccount(account) {
  return { id:account.id, accessId:account.accessId, displayName:account.displayName, role:account.role, status:account.status, workspaceId:account.workspaceId, ownerAccess:Boolean(account.ownerAccess), createdAt:account.createdAt };
}
