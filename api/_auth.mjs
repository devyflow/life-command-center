import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const ACCESS_COOKIE = "life_command_access";
export const SESSION_SECONDS = 60 * 60 * 12;
export const REMEMBERED_SESSION_SECONDS = 60 * 60 * 24 * 365;

export function json(response, value, status = 200) {
  response.statusCode = status;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.setHeader("cache-control", "no-store");
  response.end(JSON.stringify(value));
}

export function readCookie(request, name) {
  const source = request.headers.cookie || "";
  for (const part of source.split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return value.join("=");
  }
  return null;
}

function signature(expires, secret) {
  return createHmac("sha256", secret).update(String(expires)).digest("base64url");
}

export function createSession(secret, lifetimeSeconds = SESSION_SECONDS) {
  const expires = Math.floor(Date.now() / 1000) + lifetimeSeconds;
  return `${expires}.${signature(expires, secret)}`;
}

export function validSession(request, secret = process.env.ACCESS_SECRET) {
  if (!secret) return false;
  const token = readCookie(request, ACCESS_COOKIE);
  if (!token) return false;
  const [expiresText, supplied] = token.split(".");
  const expires = Number(expiresText);
  if (!Number.isFinite(expires) || expires <= Math.floor(Date.now() / 1000) || !supplied) return false;
  const expected = signature(expiresText, secret);
  const left = Buffer.from(supplied), right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function secretMatches(candidate, secret = process.env.ACCESS_SECRET) {
  if (!secret || typeof candidate !== "string" || candidate.length > 200) return false;
  const left = createHash("sha256").update(candidate).digest();
  const right = createHash("sha256").update(secret).digest();
  return timingSafeEqual(left, right);
}

export function sameOrigin(request) {
  const origin = request.headers.origin;
  if (!origin) return true;
  const proto = request.headers["x-forwarded-proto"] || "https";
  return origin === `${proto}://${request.headers.host}`;
}

export async function readJsonBody(request) {
  if (request.body && typeof request.body === "object") return request.body;
  let raw = "";
  for await (const chunk of request) raw += chunk;
  if (!raw) return {};
  return JSON.parse(raw);
}

export function sessionCookie(value, maxAge = null) {
  const persistence = Number.isFinite(maxAge) && maxAge > 0 ? `; Max-Age=${Math.floor(maxAge)}` : "";
  return `${ACCESS_COOKIE}=${value}; Path=/${persistence}; HttpOnly; Secure; SameSite=Strict`;
}

export function clearedSessionCookie() {
  return `${ACCESS_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`;
}
