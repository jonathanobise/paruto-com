# Rolling back paruto.com

paruto.com is a static site served by Cloudflare: the Worker `paruto-com` (static files plus a few lines in
`worker.js` that send www.paruto.com to paruto.com). paruto.com and www.paruto.com are the Worker's custom domains, so
Cloudflare manages their DNS records and certificates. There is no database, backend or migration, so a rollback is
only ever a code change. Never touch the zone's MX and TXT records (Zoho mail, SPF, verifications).

## Roll back the last deploy (fastest)

Cloudflare keeps every deployed version. Put the previous one back in seconds, without touching git:

```bash
npx -y wrangler@4.141.0 deployments list --name paruto-com
npx -y wrangler@4.141.0 rollback --name paruto-com
```

Then fix forward in git, so the next deploy doesn't bring the bad change back.

## Roll back a change in git

```bash
git revert --no-edit HEAD     # or: git revert --no-edit <bad-sha>
```

Then deploy `main` from a clean checkout (the command is in `CLAUDE.md`, "Deploying"). Pushing alone doesn't deploy.
`git revert` adds a new commit, so history stays intact and the rollback itself can be undone. To undo several
commits, revert each one, newest first.

## Confirm the rollback is live

```bash
curl -sI https://paruto.com/ | grep -iE "^HTTP|^server"   # 200, server: cloudflare
```

## Emergency: take the site offline

```bash
npx -y wrangler@4.141.0 delete --name paruto-com
```

paruto.com then stops answering until the Worker is deployed again (the command in `CLAUDE.md`).

## Kill switches without a revert

- **3D hero:** delete the `<script type="module" src="hero-gl.js">` line in `index.html`. The SVG mark shows instead.
- **Analytics:** delete the Cloudflare beacon loader `<script>` in `index.html`, `404.html` and `privacy.html`.

## After a rollback

Tell hello@paruto.com and anyone who shared links. There's no status page, so post an update on @parutogroup if the
outage was visible.

Note: on this Mac, `/usr/local/bin/git` is an Intel-only build that won't run. Use `/usr/bin/git`.
