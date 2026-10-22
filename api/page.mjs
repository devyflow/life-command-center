import { readFile } from "node:fs/promises";
import { createSession, REMEMBERED_SESSION_SECONDS, sessionCookie, sessionDetails } from "./_auth.mjs";

const [appPage, lockPage] = await Promise.all([
  readFile(new URL("../client/index.html", import.meta.url), "utf8"),
  readFile(new URL("../client/lock.html", import.meta.url), "utf8"),
]);

export default function handler(request, response) {
  const session = sessionDetails(request);
  response.statusCode = 200;
  response.setHeader("content-type", "text/html; charset=utf-8");
  response.setHeader("cache-control", "no-store");
  if (session?.remembered) response.setHeader("set-cookie", sessionCookie(createSession(process.env.ACCESS_SECRET, REMEMBERED_SESSION_SECONDS, session.claims), REMEMBERED_SESSION_SECONDS));
  response.end(session ? appPage : lockPage);
}
