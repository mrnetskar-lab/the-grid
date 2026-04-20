# Handoff: Velora.ai — Companion Platform UI

## Overview
Velora.ai is a luxury 18+ AI companion platform with a dark, premium "private members' club" aesthetic. This handoff covers the full product UI: Home dashboard, Discover, Chat, and Gallery — plus an age gate, gallery lightbox, and live AI chat integration.

## About the Design Files
The file `Velora v3.html` is a **high-fidelity design reference built in HTML/CSS/JS**. It is a working prototype, not production code. The task is to **recreate this UI in your target codebase** (React, Next.js, Vue, etc.) using its established patterns, component libraries, and routing — or, if starting fresh, React + Next.js App Router is recommended.

Do not ship the HTML file directly. Use it as a pixel-level reference for layout, color, spacing, typography, and interactions.

---

## Fidelity
**High-fidelity.** Colors, typography, spacing, shadows, animations, and interactions are all finalised and should be implemented as closely as possible. The prototype is fully interactive and demonstrates all key flows.

---

## Design Tokens

### Colors
```
--bg:           #08080c   (page background)
--panel:        #0f0f15   (card / panel background)
--panel-2:      #13131b   (secondary panel)
--stroke:       rgba(255,255,255,0.07)   (default border)
--stroke-2:     rgba(255,255,255,0.12)   (hover border)
--text:         #f4f0f2   (primary text)
--muted:        #a89ea6   (secondary text)
--muted-2:      #6e6470   (tertiary / meta text)
--pink:         #ff4f9a   (primary accent)
--pink-2:       #ff8cc3   (light pink / icons)
--gold:         #ffcb70   (secondary accent)
--violet:       #7a5cff   (tertiary accent)
--green:        #49d17d   (online / success)
```

### Typography
```
Display / headings:   'Cormorant Garamond', Georgia, serif
  — Use italic weight for all hero headings and persona names
  — Sizes: hero h1 clamp(2.6rem, 4vw, 4.8rem), section h2 ~2.2rem, card names ~2rem

Body / UI:            'DM Sans', ui-sans-serif, system-ui, sans-serif
  — Weights: 400 (body), 500 (labels), 600 (buttons/nav), 700 (names/titles)
  — Base size: 0.9rem–1rem
```

### Spacing & Radius
```
Page padding:    22px
Card gap:        18–20px
--rx:            26px   (large cards)
--rx-md:         18px   (medium elements)
--rx-sm:         12px   (small elements, tags)
Sidebar width:   252px
Topbar height:   68px
```

### Shadows
```
--shadow:    0 20px 60px rgba(0,0,0,0.50)
--shadow-sm: 0 8px 24px rgba(0,0,0,0.35)
Pink glow:   0 10px 26px rgba(255,79,154,0.26)
```

### Background effect
- Two radial gradients on `<body>` for ambient pink/gold/violet glow (top-left pink, top-right gold, bottom violet)
- SVG fractalNoise grain texture overlay at ~3.5% opacity for premium feel

---

## Layout Architecture

```
┌─────────────────────────────────────────────┐
│  SIDEBAR (252px, sticky, full height)       │
│  └─ Brand mark + "Velora.ai" wordmark       │
│  └─ Nav: Home / Discover / Chat / Gallery   │
│     └─ Chat expands inline thread list      │
│  └─ Upgrade card                            │
│  └─ Footer buttons                          │
├─────────────────────────────────────────────┤
│  TOPBAR (68px, sticky, blur backdrop)       │
│  └─ Search bar + Credits pill + CTA         │
├─────────────────────────────────────────────┤
│  MAIN CONTENT AREA (scrollable)             │
│  └─ View switcher (no routing, JS classList)│
└─────────────────────────────────────────────┘
```

---

## Screens / Views

### 1. Home
**Layout:** CSS Grid, `gap: 18px`

**Hero section** — 2-col grid (`1.1fr 0.9fr`):
- Left card: Pink radial gradient bg, italic serif h1, body copy, 2 CTA buttons, 3 stat tiles at bottom
- Right card: Dark gradient bg, CSS portrait silhouette figure, caption overlay, 3 mini feature tiles (3-col grid)

**Tonight's Highlights** — 6-col responsive grid of story cards:
- Each: 22px radius, dark bg, coloured gradient overlay, avatar + name/mood + animated green pulse dot
- Hover: translateY(-3px), brighter border, shadow

**Featured Personas** — 4-col grid (`repeat(4,1fr)`), collapses to 2-col at 1200px:
- Each card: 400px min-height, absolute-positioned CSS figure (head/hair/neck/body made from divs with gradient backgrounds), badge row (mood + age), name + sub + actions
- Hover: card lifts, mood tags fade in from top

**Lower Grid** — 2-col (`1.2fr 0.8fr`):
- Inbox preview panel (thread list)
- Brand direction card with feature checklist

---

### 2. Discover
**Layout:** 3-col grid, collapses to 2-col at 1200px

**Filter toolbar:** Pill buttons, active state: pink tint bg + border. Clicking a filter hides cards that don't match `data-tags` attribute. Use CSS opacity + scale transition for hide/show.

**Discover cards:** Same figure technique as persona cards. Each has a `data-tags` attribute (e.g. `"romantic latenight"`) for filtering.

Card colour variants:
- Default: rose-dark gradient (`#432433 → #191520`)
- `.tone-gold`: warm amber (`#5a3c22 → #1c1714`)
- `.tone-violet`: deep purple (`#2f275c → #171422`)
- `.tone-blush`: dusky rose (`#62303d → #1c151c`)

---

### 3. Chat
**Layout:** Full-width single panel (no thread list in the view itself)

**Thread list location:** Lives in the sidebar, below the Chat nav button. Clicking Chat in the nav:
1. Expands the thread list with a smooth `max-height` transition (0 → 360px)
2. Rotates the `›` arrow icon 90°
3. Switches the main view to the Chat panel

**Chat panel:**
- Grid: `auto 1fr auto` (header / messages / input)
- Height: `calc(100vh - topbar-height - 44px)`, min 600px
- Background: dark with subtle pink radial at top-right

**Chat header:** Avatar + name (italic Cormorant) + animated status dot + tools (star, gallery, more)

**Message bubbles:**
- Theirs: `#15151f` bg, 1px border, `border-bottom-left-radius: 6px`
- Mine: pink-gold gradient, `border-bottom-right-radius: 6px`
- Max width: `min(560px, 72%)`

**Typing indicator:** 3 bouncing dots animation (`typingBounce` keyframes) shown while AI is responding

**AI integration:** Each thread has a `data-persona` system prompt string. On send, call the AI API with that persona as context. Show typing indicator during request.

Persona system prompts:
- **Elara:** "warm and romantic, soft intimate poetic voice, 1-2 sentences, alluring"
- **Mara:** "luxurious sophisticated upscale lounge energy, elegant and refined, 1-2 sentences"
- **Nyra:** "mysterious poetic, lyrical slightly cryptic, 1-2 sentences"
- **Rose:** "playful flirty bright teasing energy, light and fun, 1-2 sentences"
- **Mina:** "creative dreamy, loves art and poetry, imaginative and warm, 1-2 sentences"

---

### 4. Gallery
**Layout:** `1fr 240px` grid

**Main:** 3-col masonry-style grid of tiles (some `.tall` at 340px min-height)
- Tile variants: default (rose), `.alt` (gold/amber), `.violet` (plum)
- Each has a lock badge (top-right) and a caption overlay (bottom)
- Click opens lightbox

**Sidebar:** Price card + next-drop note card. Keep slim — space reserved for future ads/images.

**Lightbox:**
- Fixed overlay, `backdrop-filter: blur(18px)`, dark bg
- Inner card slides up on open (`translateY(14px → 0)`)
- Close on: ✕ button, backdrop click, Escape key

---

## Age Gate
- Fixed overlay, z-index 300, shown on first visit
- Persisted via `localStorage` key `velora_entered`
- Two buttons: confirm (gradient CTA) + deny (ghost)
- Fade out + `pointer-events: none` on confirm

---

## CSS Persona Figures
The silhouette figures on cards are **pure CSS divs**, no images needed:

```html
<div class="persona-figure">
  <div class="fig-hair"></div>   <!-- ellipse behind head -->
  <div class="fig-head"></div>   <!-- circle with skin gradient -->
  <div class="fig-neck"></div>   <!-- narrow rectangle -->
  <div class="fig-body"></div>   <!-- rounded trapezoid shape -->
</div>
```

Each tone variant (`[data-tone="gold"]`, `[data-tone="violet"]`, `[data-tone="rose"]`) overrides the gradient colours on `.fig-head`, `.fig-neck`, `.fig-body`.

On hover: `transform: translateY(-4px)` on the card lifts the whole figure subtly (figure inherits via absolute positioning).

---

## Interactions & Animations

| Interaction | Behaviour |
|---|---|
| Card hover | `translateY(-3px or -4px)`, brighter border, deeper shadow |
| Persona hover | mood tags fade in from top (`opacity 0→1, translateY(-5px→0)`) |
| Nav Chat click | sidebar thread list slides open (`max-height 0→360px`) |
| Thread click | clears chat body, loads greeting bubble, switches active state |
| Filter pill | hides non-matching cards (`opacity 0, scale 0.96`) |
| Gallery tile click | opens lightbox with blur overlay |
| Lightbox open | inner card slides up (`translateY 14px→0`) |
| Status / pulse dots | `box-shadow` pulse animation, 2.2s loop |
| Typing indicator | 3-dot bounce animation, 1.2s stagger |
| Solid buttons | `translateY(-1px)` + brighter shadow on hover |
| Age gate dismiss | `opacity 0` fade, then `display:none` |

---

## Responsive Behaviour
- **< 1200px:** Cards grid → 2-col, stories → 3-col, gallery → 2-col
- **< 980px:** Sidebar becomes off-canvas drawer (slides in from left), mobile bottom nav appears (4 tabs), views get reduced padding
- **< 720px:** All grids collapse to 1-col

---

## Assets
- **Fonts:** Google Fonts — `Cormorant Garamond` (400/600/700, italic) + `DM Sans` (400/500/600/700)
- **Persona figures:** Pure CSS — no image assets required
- **Gallery tiles:** Pure CSS gradient placeholders — replace with real photography
- **Gallery sidebar:** 240px — designed for ad units or persona photos (placeholder for now)
- **Brand mark:** CSS-only logo mark (gradient square with clip-path cutout)

---

## Files in this Package
| File | Description |
|---|---|
| `Velora v3.html` | Full hi-fi interactive prototype. Open in browser to explore all views and interactions. |
| `README.md` | This document. |

---

## Notes for the Developer
1. The prototype uses `window.claude.complete()` — a built-in API available only in the design environment. Replace this with your production AI API calls (OpenAI, Anthropic, etc.).
2. All navigation is JS `classList` toggling — replace with your router (Next.js App Router, React Router, etc.).
3. The CSS is intentionally monolithic in the prototype. In production, split into component-level styles or a Tailwind config.
4. The grain texture uses an inline SVG data URL — in production, use a real texture PNG for performance.
5. Replace `localStorage` persistence with your auth/session layer.
