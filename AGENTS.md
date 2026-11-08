# AGENTS.md

This repo holds the Mihran family's websites on `mihran.com`. Each site is a plain static HTML site, and each one is deployed as its own Cloudflare Worker.

> **Both the repo and the sites are public.** The GitHub repo `cmihran/mihran.com` is public, and so is everything served from `mihran.com` and its subdomains. Never commit secrets, tokens, account IDs, or personal email addresses, and don't put them in commit messages. Look them up with `cf` when you need them. Remember that git history is public too: removing something in a later commit doesn't hide it.

## Layout

| Folder     | Worker name      | Domains                          | What it is                         |
|------------|------------------|----------------------------------|------------------------------------|
| `family/`  | `mihran-family`  | `mihran.com`, `www.mihran.com`   | Family homepage, with a card for each person's site |
| `charlie/` | `charlie-mihran` | `charlie.mihran.com`             | Charlie's personal page            |
| `greg/`    | `greg-mihran`    | `greg.mihran.com`                | Greg's page (call sign KJ6ER), which links to https://kj6er.net/ |

### Shared style and navigation

All the sites share one look and one navigation menu. Both come from files in `family/public/_shared/`, which are served from mihran.com:

- `site.css` (`https://mihran.com/_shared/site.css`): the colors, fonts, and layout. The style is a dark "liquid glass" look: a blue-sky photo (`_shared/sky.webp`) shown heavily blurred under a navy tint, with frosted-glass panels on top. There is one style only, with no light mode. The blur strength is `--sky-blur`, and the tint is `--sky-wash`. The navigation is a floating glass bar at the top of every page, with a burger (☰) button that opens a popup menu. The `<aside>` still has `class="sidebar"` for historical reasons. The stylesheet also styles the page pieces: `.eyebrow`, `h1`, `.lede`, `.cards`/`.card`, and `.pills`. LinkedIn and GitHub links in `.pills` or the menu get their brand icon automatically, matched by the link's `href`, so don't add icon markup. To support another site, add a matching `a[href*="…"] { --icon: url(...) }` rule.
- `nav.js` (`https://mihran.com/_shared/nav.js`): the **only place the menu links are defined** (the `SITE` array). It builds the burger button and popup menu and highlights the current page.

Every page loads both from `https://mihran.com/...` and uses this skeleton:

```html
<aside class="sidebar" id="site-nav"><a class="brand" href="https://mihran.com/">mihran.com</a></aside>
<div class="content"><main>…</main><footer>…</footer></div>
```

To change the style or the menu links, edit `_shared/` and **deploy `family/` only**. Every site picks up the change right away. Don't copy the CSS into individual pages.

Every site folder has the same files:

- `public/`: the files that get served. Start with `public/index.html`. Each page is one file with its CSS inline. There's no build step and no framework.
- `cloudflare.config.ts`: the Worker name, its custom domains (`domains: [...]`), and its compatibility date.
- `wrangler.config.ts`: sets `assetsDirectory: "public"`. It was generated, so leave it alone.
- `package.json`: has `cf` and `wrangler` as dev dependencies. It must keep `"type": "module"`.

`node_modules/` and `.cloudflare/` (build output) are gitignored.

## Local preview

Run `node preview.mjs` from the repo root (no dependencies) and open http://localhost:4321/. Each person's site is served at `http://<name>.localhost:4321/`. The server rewrites every `https://…mihran.com` URL to the local server, so the pages use `_shared/` from your working copy instead of production. Pass a port as an argument if 4321 is taken.

## Working rules

- **Commit eagerly, without asking.** When you finish a feature or fix, commit it right away with a clear message. Don't wait for the user to say so, and don't ask first.
- **Deploy only when asked.** Never run `cf deploy` unless the user explicitly asks for a deploy. Finishing or committing a change is not a request to deploy it.

## Deploying

Deploys use Cloudflare's `cf` CLI, which is still in beta. Each site deploys separately from its own folder:

```sh
cd family && cf deploy     # or charlie/, greg/
```

- Run `cf auth whoami` to check the login. If it has expired, ask the user to run `! cf auth login`.
- `cf deploy` reads `cloudflare.config.ts`. It does **not** read `wrangler.jsonc` or `wrangler.toml`.
- On Windows, close stdin (`cf deploy < /dev/null`) when running it outside a terminal, so it can't stop at a prompt.
- After a deploy, check the result with `curl -s https://<host> | grep '<title>'`.
- Nothing deploys automatically when you push to git. Deploying is always a manual step.

### Adding a new person's subdomain

1. Copy an existing site folder, for example `cp -r charlie <name>`, but skip `node_modules` and `.cloudflare`.
2. Change the Worker name in `package.json`, `package-lock.json`, and `cloudflare.config.ts`, and set `domains` to `["<name>.mihran.com"]`.
3. Write `<name>/public/index.html`, using the shared skeleton above.
4. Run `npm install`, then `cf deploy` in that folder. The custom domain sets up its own DNS record and HTTPS certificate.
5. Add the person to the `SITE` array in `family/public/_shared/nav.js` and add a `.card` for them in `family/public/index.html`. Then redeploy `family/`.

## Cloudflare setup

- The zone `mihran.com` is on the Free plan. To get the account ID, run `cf auth whoami` (it's under `accounts[0].id`). It isn't stored in this repo.
- The domain is **registered at Network Solutions**, and its nameservers point to Cloudflare (`meg.ns.cloudflare.com`, `olof.ns.cloudflare.com`). All DNS is managed in Cloudflare.
- The zone setting `always_use_https` is on, so every HTTP request redirects to HTTPS.
- Custom domains create the Worker DNS records automatically. They're the AAAA `100::` records, so don't edit them by hand.
- Costs: everything here is on the free tier. Requests for static files are free and unlimited. Free-plan limits are 100 Workers, 100 custom domains per zone, and 20,000 files per site.

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
