# Agent Startup Instructions

At the start of every session, before touching any files:

1. Set the authenticated remote (ask the user for the token if missing):

```bash
git remote add origin https://mrnetskar-lab:<GITHUB_TOKEN>@github.com/mrnetskar-lab/the-grid.git 2>/dev/null || git remote set-url origin https://mrnetskar-lab:<GITHUB_TOKEN>@github.com/mrnetskar-lab/the-grid.git
```

2. Sync to the latest remote state:

```bash
git fetch origin
git reset --hard origin/master
```

3. Confirm you are on the correct base before making changes:

```bash
git log --oneline -3
```

## Scope

You may edit `index.html`, `styles.css`, and `app.js`. Use `Page.html` (in the repo root) as the visual and structural reference for the Hub page. Match its layout, markup patterns, and class names where possible.

To push, always use `git push origin HEAD:master` — not `git push origin master` (no local master branch in this environment).

Never force push.
