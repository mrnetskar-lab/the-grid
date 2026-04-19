# Agent Startup Instructions

At the start of every session, before touching any files:

1. Set the authenticated remote (ask the user for the token if missing):

```bash
git remote add origin https://mrnetskar-lab:<GITHUB_TOKEN>@github.com/mrnetskar-lab/the-grid.git 2>/dev/null || git remote set-url origin https://mrnetskar-lab:<GITHUB_TOKEN>@github.com/mrnetskar-lab/the-grid.git
```

1. Sync to the latest remote state:

```bash
git fetch origin
git reset --hard origin/master
```

1. Confirm you are on the correct base before making changes:

```bash
git log --oneline -3
```

1. To push, always use:

```bash
git push origin HEAD:master
```

Never force push.

---

## Roadmap

1. **CSS surgery** — current task. Clean up `styles.css` Hub conflicts into one canonical system.
2. **Hub blueprint refactor** — after CSS is clean. Read `BLUEPRINT.md`.
3. **Inbox / Home / Profiles** — new HTML is already in `index.html`, CSS foundation is in `styles.css`. Polish after Hub is clean.

Do not touch pages outside the current task.

---

## Current Task: CSS Surgery — Hub single canonical system

`styles.css` is fighting itself. The Hub layout is being forced into place by stacked overrides and `!important`. Fix it by deleting all conflicting Hub blocks and replacing with one clean system.

### What to delete

- Every `.topbar` block using `top: 0.5rem`, `left: 50%`, `transform: translateX(-50%)`, rounded corners, or limited width — the old pill navbar shape
- Every `#hub .hub-world` grid column definition except the final one
- Every `#hub .hub-hero-portrait` width/height override except the final one
- Every `#hub .hub-dossier` padding/spacing block except the final one
- Every `@media` block containing Hub rules except one consolidated mobile block at the end
- All `!important` from Hub rules

### What the single system must define

- **Topbar:** `position: fixed; top: 0; left: 0; right: 0; width: 100%; border-radius: 0;` — full-width flat bar always. Hub-active state only adjusts opacity/blur via `.site-shell:has(#hub.page.active) .topbar`
- **Hub grid:** `grid-template-columns: 260px minmax(0, 1fr) 320px` — one definition only
- **Hero portrait:** `width: 132px; height: 168px` — one definition only
- **Dossier:** flat, no glass, one padding system
- **Mobile (`max-width: 720px`):** single block — sidebar becomes horizontal avatar strip, dossier hidden, hero portrait 72×92px, single column grid

### Do not touch

- Everything below the comment `/* HOME / INBOX / PROFILES */` — new and correct, leave it
- `app.js`
- `index.html`
- `hub_salvage.js`

### Files you may edit

- `styles.css` only

### Push when done

```bash
git push origin HEAD:master
```

---

## Copilot Task: Wire hub_salvage.js into app.js

`hub_salvage.js` is a complete Hub render layer that exists as a standalone file but is not yet connected to the app. Wire it in so it runs on startup.

### Steps

1. In `index.html`, add a script tag loading `hub_salvage.js` **after** the `app.js` script tag:

```html
<script src="hub_salvage.js"></script>
```

2. In `app.js`, find the startup/init block (look for `focusContact`, `renderHub`, or `DOMContentLoaded`) and call `initHubSalvage()` at the end of that block — after existing hub render calls, not before.

3. Wrap in a guard before calling:

```js
if (typeof initHubSalvage === 'function') initHubSalvage();
```

### Copilot — do not touch

- `styles.css`
- Any backend files
- `escapeHtml()` — never remove

### Copilot — files you may edit

- `index.html` — script tag only
- `app.js` — startup call only

### Copilot — push when done

```bash
git push origin HEAD:master
```
