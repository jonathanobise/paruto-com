# Rolling back paruto.com

paruto.com is a static site on GitHub Pages, built from `main` of
[jonathanobise/paruto-com](https://github.com/jonathanobise/paruto-com). Every push to `main` deploys
in about a minute. There is no database, backend or migration, so a rollback is only ever a code revert.

## Roll back the last deploy

```bash
git revert --no-edit HEAD     # or: git revert --no-edit <bad-sha>
git push origin main
```

`git revert` adds a new commit, so history stays intact and the rollback itself can be undone.
Check the build at <https://github.com/jonathanobise/paruto-com/deployments> or with:

```bash
gh api repos/jonathanobise/paruto-com/pages/builds/latest --jq '.status+" "+.commit'
```

## Roll back several deploys

```bash
git log --oneline -10                     # find the last good commit
git revert --no-edit <good-sha>..HEAD     # revert everything after it
git push origin main
```

## Emergency: take the site offline

GitHub → repo **Settings → Pages** → set the source to **None**. paruto.com then shows GitHub's 404 until
Pages is turned back on. Don't touch DNS at DreamHost: the A records and MX/TXT (Zoho mail) must stay.

## Kill switches without a revert

- **3D hero:** delete the `<script type="module" src="hero-gl.js">` line in `index.html`. The SVG mark shows instead.
- **Analytics:** delete the Cloudflare beacon `<script>` in `index.html`, `404.html` and `privacy.html`.

## After a rollback

Tell hello@paruto.com and anyone who shared links. There's no status page, so post an update on @parutogroup if the
outage was visible.
