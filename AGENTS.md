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

1. **Hub** — current task. Get it to 100% match `Page.html`. This is the foundation.
2. **Inbox** — redesign after Hub is solid. Reference will be provided.
3. **Home** — redesign after Inbox. Reference will be provided.
4. **Profiles** — last. Reference will be provided.

Do not touch pages outside the current task.

---

## Current Task: Hub Visual Polish

Bring the Hub page (`#hub`) to 100% visual match with the reference design in `Page.html`. This page is the foundation — get it right before anything else.

### Reference

`Page.html` is the ground truth. Read its CSS and HTML structure carefully before making changes.

### Agent assignments

Tasks are split to avoid conflicts. Each agent owns specific files/sections:

**Copilot owns:**

- Hero header — portrait ~132×168px, `border-radius: 14px`, large name (~44px), italic whisper line, subline with state · tone · typing
- Dossier panel — full portrait `aspect-ratio: 3/4`, bio text, pull/memory meter bars, anchor field notes, ring state legend
- Files: `index.html`, `styles.css` (dossier + hero sections only)

**Codex owns:**

- Background — warm radial gradients (amber top-left, character-hue bottom-right), match `.backdrop` in `Page.html`
- Topbar — full-width flat, not pill/centered, match `Page.html` topbar when hub is active
- Sidebar — flat, no glass card, blends into backdrop, match `.channel` style in `Page.html`
- Mobile — below 720px single column, below 1100px dossier hides
- Files: `styles.css` (background, topbar, sidebar, responsive sections only)

Both agents: do not edit sections owned by the other agent.

### Files you may edit

- `index.html` — HTML structure
- `styles.css` — All styling (scope hub changes under `#hub` or `.site-shell:has(#hub.page.active)`)
- `app.js` — Only if JS wiring needs to match new element IDs/classes

### Do not touch

- `server.js`, `server/`, `src/engine/` — backend, leave as-is
- `characters/*.json` — character data
- `escapeHtml()` in `app.js` — XSS protection, never remove
- API shape (`ok/result/error`) — never change

### Conventions

- No frameworks, no build step
- Match existing naming style in the files
- Scope all hub CSS with `#hub` prefix to avoid affecting other pages
- CSS custom properties in use: `--channel-hue`, `--ch-hue`, `--msg-hue-a/b/c`, `--msg-border-alpha`, `--msg-glow-alpha`
