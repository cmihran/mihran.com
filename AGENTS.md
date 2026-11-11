# AGENTS.md

This repo holds Charlie's website on `mihran.com`. Each site is a plain static HTML site, and each one is deployed as its own Cloudflare Worker.

> **Both the repo and the sites are public.** The GitHub repo `cmihran/mihran.com` is public, and so is everything served from `mihran.com` and its subdomains. Never commit secrets, tokens, account IDs, or personal email addresses, and don't put them in commit messages. Look them up with `cf` when you need them. Remember that git history is public too: removing something in a later commit doesn't hide it.

## Layout

| Folder     | Worker name      | Domains              | What it is                      |
|------------|------------------|----------------------|---------------------------------|
| `charlie/` | `charlie-mihran` | `charlie.mihran.com` | Charlie's personal site: the only site |

`mihran.com`, `www.mihran.com` and `greg.mihran.com` have no site: zone redirect rules send them elsewhere (see Redirects).

### Charlie's site (`charlie/`)

`charlie/public/index.html` is one self-contained file (CSS and JS inline, no build step, no libraries). It's a one-page-scroll site:

- A fixed black `<canvas>` starfield sits behind everything and is never reset. The pages (Home, Projects, Links) float over it, and changing page glides the starfield's "camera" so the background feels persistent. Stars drift, twinkle and push away from the cursor, with a gentle sway when there is no pointer.
- Pages change with the pill nav, mouse wheel, swipe or arrow keys (one page per gesture). The URL hash tracks the current page.
- The Projects page is a stack of light 3D cards that tilt toward the cursor, next to a numbered list. **Projects are defined in the `PROJECTS` array at the top of the script.** Each takes `name`, `repo`, `desc`, `tags` and an optional `url`. This is where web projects without their own URL are meant to be hosted: put a built static project under `charlie/public/<project>/` and link it with `url`.
- Style: pure black, white particles, no gradients or color accents. Fonts are Inter (sans), Newsreader italic (serif accents) and JetBrains Mono (labels), loaded from Google Fonts.
- Performance: a single `requestAnimationFrame` loop that pauses in hidden tabs, particle count scaled to screen size (fewer on phones), pixel ratio capped, and a static frame under `prefers-reduced-motion`.
- `logo.svg` (white mark) and `favicon.svg` (white mark on a black tile) are the CM monogram. The logo is also inlined in the header.

Every site folder has the same files:

- `public/`: the files that get served. Start with `public/index.html`.
- `cloudflare.config.ts`: the Worker name, its custom domains (`domains: [...]`), and its compatibility date.
- `wrangler.config.ts`: sets `assetsDirectory: "public"`. It was generated, so leave it alone.
- `package.json`: has `cf` and `wrangler` as dev dependencies. It must keep `"type": "module"`.

`node_modules/` and `.cloudflare/` (build output) are gitignored.

## Local preview

Run `node preview.mjs` from the repo root (no dependencies) and open http://localhost:4321/ (Charlie's site is the default). Each site folder is also served at `http://<name>.localhost:4321/`. Pass a port as an argument if 4321 is taken.

To open it on a phone on the same network, use the PC's LAN IP with a path prefix: `http://<LAN-IP>:4321/~charlie/`. (Hostname tricks like nip.io fail on networks that block DNS answers pointing at private IPs, so the server uses paths instead.) The local preview doesn't apply the Cloudflare redirect rules.

## Working rules

- **Commit eagerly, without asking.** When you finish a feature or fix, commit it right away with a clear message. Don't wait for the user to say so, and don't ask first.
- **Deploy only when asked.** Never run `cf deploy` unless the user explicitly asks for a deploy. Finishing or committing a change is not a request to deploy it.

## Deploying

Deploys use Cloudflare's `cf` CLI, which is still in beta. Each site deploys separately from its own folder:

```sh
cd charlie && cf deploy
```

- Run `cf auth whoami` to check the login. If it has expired, ask the user to run `! cf auth login`.
- `cf deploy` reads `cloudflare.config.ts`. It does **not** read `wrangler.jsonc` or `wrangler.toml`.
- On Windows, close stdin (`cf deploy < /dev/null`) when running it outside a terminal, so it can't stop at a prompt.
- After a deploy, check the result with `curl -s https://<host> | grep '<title>'`.
- Nothing deploys automatically when you push to git. Deploying is always a manual step.

### Adding a new subdomain site

1. Copy an existing site folder, for example `cp -r charlie <name>`, but skip `node_modules` and `.cloudflare`.
2. Change the Worker name in `package.json`, `package-lock.json`, and `cloudflare.config.ts`, and set `domains` to `["<name>.mihran.com"]`.
3. Write `<name>/public/index.html`.
4. Run `npm install`, then `cf deploy` in that folder. The custom domain sets up its own DNS record and HTTPS certificate.

## Cloudflare setup

- The zone `mihran.com` is on the Free plan. To get the account ID, run `cf auth whoami` (it's under `accounts[0].id`). It isn't stored in this repo.
- The domain is **registered at Network Solutions**, and its nameservers point to Cloudflare (`meg.ns.cloudflare.com`, `olof.ns.cloudflare.com`). All DNS is managed in Cloudflare.
- The zone setting `always_use_https` is on, so every HTTP request redirects to HTTPS.
- Custom domains create the Worker DNS records automatically. They're the AAAA `100::` records, so don't edit them by hand.
- Costs: everything here is on the free tier. Requests for static files are free and unlimited. Free-plan limits are 100 Workers, 100 custom domains per zone, and 20,000 files per site.

### Redirects

Two zone redirect rules (phase `http_request_dynamic_redirect`, status 302, path and query preserved):

- `mihran.com` and `www.mihran.com` → `https://charlie.mihran.com/`
- `greg.mihran.com` → `https://kj6er.net/`

They are 302s (not 301s) on purpose, so browsers don't cache them permanently. Cloudflare only runs redirect rules for traffic through a proxied DNS record, so `mihran.com`, `www` and `greg` each have a proxied placeholder `AAAA 100::` record with no Worker behind it. Don't delete those records or the redirects stop working. View them with `cf rulesets entrypoint get http_request_dynamic_redirect --zone mihran.com`. Change them with `cf rulesets entrypoint update http_request_dynamic_redirect --zone mihran.com --body '<json>'`, which replaces the whole rule list, so send every rule.

### Email Routing (forwarding only)

Email Routing is enabled on the zone, and it manages the MX, SPF, and `cf2024-1._domainkey` records. There are no mailboxes; mail is only forwarded.

There are forwards for `charlie@` and `greg@`, each going to that person's personal inbox. The destination addresses live only in Cloudflare. To see them, run `cf email-routing rules list-account`. Any other address bounces, because the catch-all rule is off. To add a forward:

```sh
export CLOUDFLARE_ACCOUNT_ID=<from cf auth whoami>
cf email-routing addresses create --body '{"email":"dest@example.com"}'   # sends a verification email
cf email-routing addresses list                                          # wait for status "verified"
cf email-routing rules create --zone mihran.com --body '{"name":"x","enabled":true,
  "matchers":[{"type":"literal","field":"to","value":"x@mihran.com"}],
  "actions":[{"type":"forward","value":["dest@example.com"]}]}'
cf email-routing rules list-account                                      # list rules
```

A rule can only be created after its destination address is verified. A new rule takes a minute or two to start working, so wait before sending a test email.

## Using the `cf` CLI

- To find a command, use `cf cli search "<task>"`, not nested `--help` calls. Keep search queries generic and leave out domains, IDs, and emails.
- `cf schema <command>` shows the API request a command makes. When a command doesn't have a flag for a field, pass the raw JSON with `--body '<json>'`. For example, `cf zones settings edit always_use_https --zone mihran.com --body '{"value":"on"}'`.
- Some account-level commands don't accept `--account-id`. For those, set `CLOUDFLARE_ACCOUNT_ID` instead.

## Gotchas

- **Cloudflare WARP on the owner's PC.** It's a work install with its own DNS at 127.0.2.2, and it caches DNS answers and can block domains it hasn't seen before. If the site looks stale, shows TLS errors, or returns a 403 that the server isn't sending, check with `nslookup <host> 1.1.1.1` and with curl before assuming the site is broken.
- Domain ownership rests on the Network Solutions login. Don't change the nameservers there.
- **Never commit secrets or personal data.** This repo may be made public. Look up account IDs, email addresses, and tokens with `cf` when you need them. Don't write them into files.
