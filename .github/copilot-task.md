# Copilot Task — Hub Layout Debug & Mobile Fix

## Status: OPEN

## Context
The Grid is a vanilla HTML/CSS/JS app (no framework, no bundler). Live at:
`https://the-grid-production-ce9c.up.railway.app`

The Hub page (`#hub`) has three problems visible in screenshot:
1. **Chat panel is too large** — takes up the full remaining width, messages sit in a giant black void
2. **Left sidebar is not responsive** — on small screens it doesn't collapse or adapt
3. **Background image missing** ✅ FIXED (CSS was pointing to wrong filename — already corrected to `/backround.jpg`)

---

## Files to edit
- `styles.css` — all layout fixes go here
- `index.html` — only if structure needs changing (avoid if possible)
- Do NOT touch `app.js`, `server.js`, or any server files

---

## Problem 1: Hub chat panel too large / empty

### What's happening
`#hub.page` is `height: calc(100vh - var(--topbar-h) - 1.5rem)` with `display: flex; flex-direction: column`.
Inside is `.hub-v2` (flex: 1) → `.hub-world` (grid: 280px + 1fr).
The chat panel fills `1fr` of the remaining width — on a wide screen that's 1100px+. Messages are tiny blobs in a vast black space.

### Fix
- Cap `.hub-chat-panel` max-width or make the grid proportional (e.g. `280px minmax(0, 620px)` instead of `280px 1fr`)
- Or: add `max-width: 680px` to `.hub-chat-panel` and let it not stretch
- Messages should feel snug, not floated in space

---

## Problem 2: Mobile responsiveness — sidebar

### What's happening
`.hub-world` is `grid-template-columns: 280px minmax(0, 1fr)`. On iPhone (375–430px wide) this is completely broken — both columns try to render, sidebar overflows.

### Fix
Below `600px`:
- `.hub-world` → `grid-template-columns: 1fr` (single column)
- `.hub-sidebar` → `display: none` by default, or collapse to a horizontal strip at top
- Show only the chat panel on mobile
- OR: make sidebar a slide-in drawer triggered by a button (only if simple to implement)

Below `800px`:
- `.hub-world` → `grid-template-columns: 200px minmax(0, 1fr)` (narrower sidebar)
- `.hub-sidebar-title` → reduce font size

### Must preserve
- All `data-room` buttons and their click handlers still work
- `id="presenceStack"` element still exists in DOM (even if hidden)
- `id="signalFeed"` element still exists

---

## Problem 3: Topbar on mobile

The topbar is `position: fixed; top: 0.5rem; left: 50%; transform: translateX(-50%)`.
On iPhone this is fine but `flex-wrap: wrap` when nav opens may push content too far down.

### Fix
- On `< 600px`: reduce topbar padding, hide `.topbar-live` text, keep GRID brand + nav toggle
- Ensure `.page-stack { padding-top }` accounts for taller wrapped topbar on mobile

---

## Layout variables to know

```css
:root {
  --topbar-h: 56px;
}
```

Hub height: `calc(100vh - var(--topbar-h) - 1.5rem)`
Page stack offset: `padding-top: calc(var(--topbar-h) + 1rem)`

---

## Existing breakpoints in styles.css (reference, update these)

```css
@media (max-width: 980px) {
  .hub-world { grid-template-columns: 220px minmax(0, 1fr); }
}

@media (max-width: 760px) {
  .topbar { top: 0.35rem; border-radius: 8px; flex-wrap: wrap; }
  .hub-world { grid-template-columns: 1fr; }
  .hub-sidebar { order: 2; max-height: 280px; overflow-y: auto; }
}
```

The `760px` breakpoint already collapses hub-world to 1col but sidebar goes to `order: 2` (below chat) with 280px max-height — this needs to either be hidden or become a compact horizontal strip.

---

## Design constraints
- Dark background, glassmorphism — don't change colors or aesthetics
- Font: Inter
- Vocabulary: nodes, signals, channels, transmit — not chat/friends
- `escapeHtml()` in app.js is XSS protection — never remove
- Keep `ok/result/error` API shape unchanged

---

## Done when
- [ ] Hub chat panel is not a vast empty void on desktop (max ~640-680px wide or proportional)
- [ ] Hub works on iPhone 375px without horizontal overflow
- [ ] Topbar doesn't break mobile layout
- [ ] Background image shows (already fixed in CSS — just needs deploy)
- [ ] No JS files changed
