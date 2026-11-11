// Local preview of all the *.mihran.com sites, using your working copy.
//   node preview.mjs [port]      (default port 4321)
// Then open http://localhost:4321/ — other sites are at http://<name>.localhost:4321/.
// From a phone on the same network, use your PC's LAN IP with a /~name/ path:
//   http://<LAN-IP>:4321/ (family),  http://<LAN-IP>:4321/~charlie/,  http://<LAN-IP>:4321/~greg/
// Every "https://…mihran.com" URL in HTML/CSS/JS is rewritten to the local server,
// so the shared CSS and nav come from family/public/_shared on disk, not production.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname, normalize } from "node:path";

const port = Number(process.argv[2]) || 4321;
const root = import.meta.dirname;

// Which site a request is for, and how to build URLs back to this server.
//  - localhost / <name>.localhost: one site per hostname ("host" mode)
//  - any other host (a LAN IP from a phone): one site per path prefix, /~<name>/ ("path" mode),
//    because name-based DNS tricks (like nip.io) don't resolve on every network
function parseHost(hostHeader = "") {
  const host = hostHeader.split(":")[0];
  const m = host.match(/^([a-z0-9-]+)\.localhost$/);
  if (m) return { mode: "host", sub: m[1], base: "localhost" };
  if (!host || host === "localhost") return { mode: "host", sub: undefined, base: "localhost" };
  return { mode: "path", sub: undefined, base: host };
}

const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".json": "application/json",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp",
  ".ico": "image/x-icon", ".txt": "text/plain; charset=utf-8",
};

const rewrite = (text, { mode, base }) => {
  const origin = (sub) =>
    mode === "host"
      ? `http://${sub ? sub + "." : ""}${base}:${port}`
      : `http://${base}:${port}${sub ? "/~" + sub : ""}`;
  return text
    .replace(/https:\/\/(?:www\.)?mihran\.com/g, origin())
    .replace(/https:\/\/([a-z0-9-]+)\.mihran\.com/g, (_, sub) => origin(sub))
    .replace(/mihran\\\.com/g, base.replace(/\./g, "\\.")); // regexes in nav.js
};

createServer(async (req, res) => {
  const ctx = parseHost(req.headers.host);
  const url = new URL(req.url, "http://x");
  let { sub } = ctx;
  let pathname = url.pathname;
  if (ctx.mode === "path") {
    const m = pathname.match(/^\/~([a-z0-9-]+)(\/.*)?$/);
    if (m) {
      if (!m[2]) { res.writeHead(302, { location: `/~${m[1]}/` }); return res.end(); }
      sub = m[1];
      pathname = m[2];
    }
  }
  const site = sub && sub !== "www" ? sub : "family";
  let file = normalize(join(root, site, "public", decodeURIComponent(pathname)));
  if (!file.startsWith(join(root, site, "public"))) return send(res, 403, "Forbidden");
  try {
    if ((await stat(file)).isDirectory()) file = join(file, "index.html");
    const type = TYPES[extname(file)] || "application/octet-stream";
    let body = await readFile(file);
    if (/^text\//.test(type)) body = rewrite(body.toString("utf8"), ctx);
    res.writeHead(200, { "content-type": type, "cache-control": "no-store" });
    res.end(body);
  } catch {
    send(res, 404, `Not found: ${site}${pathname}`);
  }
}).listen(port, () => {
  const o = (sub) => `http://${sub ? sub + "." : ""}localhost:${port}`;
  console.log(`Preview running:\n  ${o()}/\n  ${o("charlie")}/\n  ${o("greg")}/`);
});

function send(res, code, msg) {
  res.writeHead(code, { "content-type": "text/plain; charset=utf-8" });
  res.end(msg);
}
