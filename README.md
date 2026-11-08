# mihran.com

The Mihran family's websites. They're plain static HTML pages hosted on Cloudflare Workers.

| Site | Folder |
|---|---|
| [mihran.com](https://mihran.com) | `family/` |
| [charlie.mihran.com](https://charlie.mihran.com) | `charlie/` |
| [greg.mihran.com](https://greg.mihran.com) | `greg/` |

## Editing and deploying

Edit `<site>/public/index.html`, then deploy that site:

```sh
npm install -g cf    # Cloudflare CLI (one-time)
cf auth login        # one-time
cd family && npm install && cf deploy
```

Pushing to GitHub does not deploy anything. You have to run the deploy command yourself.

For the full setup, including DNS, email forwarding, and adding a new subdomain, see [AGENTS.md](AGENTS.md).
