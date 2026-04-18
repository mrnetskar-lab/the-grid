# Copilot Tasks — The Grid

Live: `https://the-grid-production-ce9c.up.railway.app`
Stack: Vanilla HTML/CSS/JS + Node/Express. No framework, no bundler.
Branch: always push to `master`. Push the **complete file**, never a fragment.

---

## TASK 1 — Profiles page: gallery images (CSS only)

**File:** `styles.css`, `index.html`

The gallery section under PROFILES (`#routes` page) shows images from `/images/shot_*.png`.
These files are local-only (1.4GB total, not in git). The gallery grid renders but images 404 on Railway.

### Fix options (pick one)
**A — Remove the gallery section entirely** until a CDN solution exists:
- In `index.html`: delete the `<div class="profiles-gallery">` block and the `<div class="profiles-gallery-head">` above it
- In `styles.css`: remove `.profiles-gallery`, `.profiles-shot`, `.profiles-gallery-head`, `.profiles-gallery-title` rules
- Keep the 4 profile cards (Nina, Hazel, Iris, Vale) — those images ARE in git under `/profile_pictures/`

**B — Replace gallery with a "coming soon" placeholder:**
- Replace the gallery grid with a single styled div: `<div class="profiles-gallery-empty">More signals incoming.</div>`
- Style it: centered text, muted color, 2rem padding, subtle border

### Do NOT touch
- The 4 profile cards at the top of the page — they use `/profile_pictures/` which is deployed
- `app.js` — no JS changes needed
- The lightbox code in `app.js` — leave it

---

## TASK 2 — Inbox: mobile composer input too small

**File:** `styles.css`

On iPhone the message composer at the bottom of the inbox is hard to tap and the send button clips.

### Fix
In the `@media (max-width: 600px)` block, add:
```css
.tb-form { padding: 0.55rem 0.55rem 0.55rem 0.75rem; }
.tb-input { font-size: 1rem; min-height: 44px; }
.tb-send  { min-width: 44px; min-height: 44px; }
```

### Do NOT touch
- `.tb-form` styles outside the media query
- Any JS

---

## TASK 3 — Hub: contact row preview text truncation

**File:** `styles.css`

`.hub-contact-preview` text overflows on narrow sidebar widths (200px column).

### Fix
Ensure these rules exist on `.hub-contact-preview`:
```css
.hub-contact-preview {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}
```
Check they aren't being overridden at any breakpoint.

---

## TASK 4 — Home page: node cards overlap topbar on scroll

**File:** `styles.css`

`.home-nodes-visual` position absolute cards can peek behind the fixed topbar (`z-index: 200`) on some viewports.

### Fix
Add to `.home-nodes-visual`:
```css
.home-nodes-visual { z-index: 1; }
```
And to `.home-node-card`:
```css
.home-node-card { z-index: 1; }
```

---

## Rules for all tasks
- Edit only the files listed per task
- Always push the **complete file content** — never a partial/fragment
- Push to `master` branch only (no feature branches)
- Do not add comments unless logic is genuinely non-obvious
- Do not change color values, font choices, or design tokens
- Do not touch `app.js`, `server.js`, or any file under `server/`
- Validate: app loads without console errors after your change
