// Local preview of all the *.mihran.com sites, using your working copy.
//   node preview.mjs [port]      (default port 4321)
// Then open http://localhost:4321/ — other sites are at http://<name>.localhost:4321/.
// Every "https://…mihran.com" URL in HTML/CSS/JS is rewritten to the local server,
// so the shared CSS and nav come from family/public/_shared on disk, not production.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname, normalize } from "node:path";

const port = Number(process.argv[2]) || 4321;
const root = import.meta.dirname;
const origin = (sub) => `http://${sub ? sub + "." : ""}localhost:${port}`;

const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".json": "application/json",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp",
  ".ico": "image/x-icon", ".txt": "text/plain; charset=utf-8",
};

const rewrite = (text) =>
  text
    .replace(/https:\/\/(?:www\.)?mihran\.com/g, origin())
    .replace(/https:\/\/([a-z0-9-]+)\.mihran\.com/g, (_, sub) => origin(sub))
    .replace(/mihran\\\.com/g, "localhost"); // regexes in nav.js

createServer(async (req, res) => {
  const sub = (req.headers.host || "").split(":")[0].match(/^([a-z0-9-]+)\.localhost$/)?.[1];
  const site = sub && sub !== "www" ? sub : "family";
  const url = new URL(req.url, "http://x");
  let file = normalize(join(root, site, "public", decodeURIComponent(url.pathname)));
  if (!file.startsWith(join(root, site, "public"))) return send(res, 403, "Forbidden");
  try {
    if ((await stat(file)).isDirectory()) file = join(file, "index.html");
    const type = TYPES[extname(file)] || "application/octet-stream";
    let body = await readFile(file);
    if (/^text\//.test(type)) body = rewrite(body.toString("utf8"));
    res.writeHead(200, { "content-type": type, "cache-control": "no-store" });
    res.end(body);
  } catch {
    send(res, 404, `Not found: ${site}${url.pathname}`);
  }
}).listen(port, () => {
  console.log(`Preview running:\n  ${origin()}/\n  ${origin("charlie")}/\n  ${origin("greg")}/`);
});

function send(res, code, msg) {
  res.writeHead(code, { "content-type": "text/plain; charset=utf-8" });
  res.end(msg);
}
