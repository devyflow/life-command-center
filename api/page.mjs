import { readFile } from "node:fs/promises";
import { validSession } from "./_auth.mjs";

const [appPage, lockPage] = await Promise.all([
  readFile(new URL("../client/index.html", import.meta.url), "utf8"),
  readFile(new URL("../client/lock.html", import.meta.url), "utf8"),
]);

export default function handler(request, response) {
  response.statusCode = 200;
  response.setHeader("content-type", "text/html; charset=utf-8");
  response.setHeader("cache-control", "no-store");
  response.end(validSession(request) ? appPage : lockPage);
}

