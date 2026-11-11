# <img src="charlie/public/favicon.svg" alt="CM logo" width="32" height="32" align="absmiddle"> mihran.com

Charlie's personal site, a one-page-scroll site with an animated starfield background. It's a single static HTML file hosted on Cloudflare Workers, with no build step.

| Site | Folder |
|---|---|
| [charlie.mihran.com](https://charlie.mihran.com) | `charlie/` |

`mihran.com` and `www.mihran.com` redirect to `charlie.mihran.com`, and `greg.mihran.com` redirects to [kj6er.net](https://kj6er.net/). These are Cloudflare redirect rules, not sites in this repo.

## Preview locally

```sh
node preview.mjs     # then open http://charlie.localhost:4321/
```

To view it on a phone on the same network, use `http://<your-LAN-IP>:4321/~charlie/`.

## Editing and deploying

Edit `charlie/public/index.html`. Projects shown on the Projects page are listed in the `PROJECTS` array near the top of its script. Then deploy:

```sh
npm install -g cf    # Cloudflare CLI (one-time)
cf auth login        # one-time
cd charlie && npm install && cf deploy
```

Pushing to GitHub does not deploy anything. You have to run the deploy command yourself.

For the full setup, including DNS, redirects, email forwarding, and adding a new subdomain, see [AGENTS.md](AGENTS.md).
