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

## Current Task: Hub Visual Polish

Bring the Hub page (`#hub`) visually in line with the reference design in `Page.html`.

### Reference

`Page.html` is the ground truth. Read its CSS and HTML structure carefully before making changes.

### Hero header (chat panel top)

- Portrait should be ~132×168px with `border-radius: 14px`
- Character name should be large (~44px), tight line-height
- Italic whisper line should be visible below the name
- Subline: state · tone · typing indicator

### Dossier (right panel)

- Full portrait filling the top with `aspect-ratio: 3/4`
- Bio text, pull/memory meter bars, anchor field notes below
- Ring state legend at the bottom

### Background

- Warm radial gradients: amber top-left, character-hue bottom-right
- Not flat black — match the `backdrop` div in `Page.html`

### Sidebar

- Flat — no glass card, no background, blends into the backdrop
- Channel rows match `Page.html` `.channel` style

### Mobile

- Below 720px: single column, sidebar collapses to compact strip
- Below 1100px: dossier hides, two-column layout

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
