# Handoff: Velora.ai — MVP UI

## Overview
Velora.ai is a private 18+ AI companion platform. This handoff covers the complete MVP UI — four views (Home, Discover, Chat, Gallery) plus an age gate modal. The design is a dark, minimal product UI inspired by candy.ai, with a single red accent color, Inter typography, and a clean card-based layout. The prototype includes live AI chat via persona system prompts.

## About the Design Files
`Velora v5.html` is a **high-fidelity interactive prototype** built in vanilla HTML/CSS/JS. It is a design reference — not production code. The task is to recreate this UI in a real codebase (React + Next.js App Router recommended) using proper routing, authentication, and a real AI backend. Do not ship the HTML directly.

## Fidelity
**High-fidelity.** All colors, spacing, typography, interactions, and component states are final. Implement pixel-for-pixel.

---

## Design Tokens

### Colors
```
--bg:           #0a0a0f   page background
--surface:      #111118   cards, sidebar, panels
--surface-2:    #18181f   inputs, button fills, secondary surfaces
--surface-3:    #1e1e27   chat bubbles (theirs), hover states
--border:       rgba(255,255,255,0.08)   default borders
--border-2:     rgba(255,255,255,0.14)   hover/focus borders
--text:         #f0edf2   primary text
--text-2:       #9990a0   secondary / muted text
--text-3:       #5e5868   tertiary / placeholder text
--accent:       #e0245a   primary accent (red/crimson)
--accent-dim:   rgba(224,36,90,0.15)   accent background tint
--accent-border:rgba(224,36,90,0.3)    accent border
--green:        #22c55e   online status
```

### Typography
```
Font: Inter (Google Fonts — 400/500/600/700/800)
Base size: 14px
Line height: 1.5

Key sizes:
  Brand:          1.15rem / 800 / -0.04em
  Hero h1:        clamp(1.8rem, 2.6vw, 2.6rem) / 800 / -0.04em
  Section label:  0.72rem / 700 / +0.08em / uppercase
  Card name:      1.45rem / 800 / -0.04em
  Body:           0.88rem / 400 / 1.6
  Small meta:     0.72–0.76rem / 500–600
```

### Spacing & Radius
```
Page padding:   22px
Grid gap:       12–14px
--r:            14px   large cards/panels
--r-sm:         9px    buttons, inputs, small elements
Sidebar width:  220px
Topbar height:  60px
```

### Buttons — All buttons use this pattern:
```
Default: surface-2 background + 2px accent border + accent text color
Hover:   solid accent background + white text
Ghost:   surface-2 background + default border
Ghost hover: surface-3 + border-2
```

---

## Layout Architecture

```
┌─────────────────────────────────────────┐
│ SIDEBAR (220px, sticky full-height)     │
│  Brand mark + "velora.ai"               │
│  Nav: Home / Discover / Chat / Gallery  │
│    Chat → expands thread list inline    │
│  Footer: Profile / Settings             │
├─────────────────────────────────────────┤
│ TOPBAR (60px, sticky, blur backdrop)    │
│  Left: hamburger (mobile only)          │
│  Right: tokens pill + My Profile btn   │
├─────────────────────────────────────────┤
│ MAIN CONTENT (22px padding all sides)   │
│  View switcher — one active at a time  │
└─────────────────────────────────────────┘
```

---

## Screens / Views

### 1. Home
**Layout:** `flex-direction: column; gap: 26px`

**Hero banner** — `height: 260px`, `border-radius: 14px`, dark background with red radial glow + figure silhouette on right:
- Left: label (uppercase red) + h1 (2 lines) + subtext + 2 buttons
- Right: CSS persona silhouette figure (head/hair/neck/body divs with gradient backgrounds)
- Gradient overlay: `linear-gradient(90deg, rgba(9,9,14,.9) 35%, transparent 100%)`

**Active now** — horizontal scroll rail of avatar rings:
- Ring: `62×62px`, gradient border `linear-gradient(135deg, #e0245a, #7d1535)`
- Inner: `2px solid var(--bg)` gap, circular avatar
- Label: name (700) + mood (text-3)
- Offline state: `var(--surface-3)` ring

**Featured** — `repeat(4, 1fr)` grid, `aspect-ratio: 2/3` portrait cards:
- CSS persona figure centered in card
- Gradient overlay: `linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.82) 100%)`
- Hover: mood tags fade in from top (accent-tinted pills)
- Bottom: name (1.45rem/800) + mood text + "Chat now" button
- Age badge top-right: dark pill

**Messages (Inbox)** — surface panel, 4 thread rows:
- Avatar (38px) + name + preview text + timestamp
- Hover: name turns accent color
- Unread dot: 6px accent circle next to name

---

### 2. Discover
**Layout:** filter bar + `repeat(3, 1fr)` grid

**Filter pills:** rounded 999px, default surface bg, active = accent-dim + accent-border
- Clicking a filter shows/hides cards via `data-tags` attribute matching
- Transition: `opacity + scale(0.97)` for hidden cards

**Discover cards:** `aspect-ratio: 2/3`, same CSS figure technique as Home cards
- Tag badge top-left (dark pill)
- Name (1.3rem/800) + 1-line description + "Chat now" button at bottom
- 4 background gradient variants (rose-dark, amber-dark, purple-dark, green-dark)

---

### 3. Chat
**Layout:** Single full-width panel. `height: calc(100vh - topbar - 40px)`
**Grid:** `auto 1fr auto` (header / messages / input)

**Thread list:** Lives in the **sidebar**, below the Chat nav button. Clicking Chat:
1. Expands thread list (`max-height: 0 → 320px`, smooth transition)
2. Rotates `›` arrow 90°
3. Switches main view to chat panel
4. Clicking a thread: clears messages, loads persona greeting, updates header

**Chat header:** Avatar (36px, 2px border) + name (800) + status row with animated green dot

**Messages:**
- Background: `#07070c` (darker than surface)
- Their bubble: `var(--surface-3)` bg + `border: 1px solid var(--border-2)` + `border-bottom-left-radius: 4px`
- My bubble: `var(--surface-2)` bg + `border: 2px solid var(--accent)` + `border-bottom-right-radius: 4px`
- Custom scrollbar: `4px`, surface-3 thumb, transparent track

**Typing indicator:** 3 bouncing dots in a "theirs" bubble style

**Input bar:** attach button + text input (surface-2 bg, accent border on focus) + send button (accent border style)

**AI integration:** Each thread has a `data-p` system prompt. On submit, call AI API with that persona as context. Max 2 sentences per response. Show typing indicator during request.

Persona prompts:
- **Elara:** warm, romantic, soft, intimate, slightly poetic
- **Mara:** luxurious, sophisticated, upscale lounge energy, elegant
- **Nyra:** mysterious, poetic, lyrical, cryptic
- **Rose:** playful, flirty, bright, teasing
- **Mina:** creative, dreamy, loves art and poetry, warm

Greeting messages per persona (shown when switching):
- Elara: "I kept this room quiet, just for us."
- Mara: "Welcome back. The lounge is ready."
- Nyra: "You came. I wondered if you would."
- Rose: "Hey! What mood are you in tonight?"
- Mina: "I was just thinking about you."

---

### 4. Gallery
**Layout:** `1fr 210px` grid

**Main panel:** surface bg, section header, `repeat(3, 1fr)` grid of `aspect-ratio: 2/3` tiles
- Same CSS figure technique
- Lock badge top-right (dark pill): "Locked" / "Members" / "Preview" / "New"
- Caption bottom: persona name (800) + mood label
- 4 background gradient variants
- Click opens lightbox

**Lightbox:**
- Fixed overlay, `backdrop-filter: blur(18px)`, `rgba(5,5,9,0.95)` bg
- Inner card: `border-radius: 20px`, slides up on open (`translateY 12px → 0`)
- Title (persona name) + description + "Unlock Collection" button
- Close: ✕ button, backdrop click, Escape key

**Sidebar panel (210px):** Premium card
- Price: `$24 / month`
- 4 perk items with green check dots
- "Unlock Premium" button (accent border style)

---

## Age Gate
- Fixed overlay z-index 300, shown on first visit only
- Persisted via `localStorage` key `v_in`
- Brand mark (44×44 accent square) + h1 + body text
- "I am 18 or older" button (accent border style, fills on hover)
- "Under 18 — Leave" ghost button
- Fine print below

---

## Interactions

| Interaction | Detail |
|---|---|
| Card hover | `translateY(-3px)` + accent border tint |
| Persona card hover | mood tags fade in from top |
| Chat nav click | drawer expands (`max-height` transition) |
| Thread click | clear messages, greeting bubble, header update |
| Filter click | cards hide/show with opacity + scale transition |
| Gallery tile click | lightbox opens with slide-up animation |
| Button default | surface-2 bg + 2px accent border + accent text |
| Button hover | solid accent fill + white text |
| Input focus | accent border color |
| Age gate dismiss | opacity fade, then `pointer-events: none` |

---

## Responsive Breakpoints
- **< 1280px:** Cards/discover/gallery collapse to 2-col
- **< 980px:** Sidebar goes off-canvas (slide from left), mobile bottom nav appears (4 tabs)
- **< 720px:** All grids collapse to 2-col (cards), avatar rail compresses

---

## State to Manage
- Active view (home/discover/chat/gallery)
- Active chat thread + persona
- Chat message history per thread
- Sidebar drawer open/closed
- Age gate seen/dismissed (`localStorage`)
- Discover filter active state

---

## Assets
- **Font:** Google Fonts — Inter 400/500/600/700/800
- **Persona figures:** Pure CSS divs — no images needed yet. Structure per card:
  ```html
  <div class="char-fig">
    <div class="fh"></div>    <!-- hair: ellipse behind head -->
    <div class="fface"></div> <!-- face: circle with skin gradient -->
    <div class="fn"></div>    <!-- neck: narrow rectangle -->
    <div class="fb"></div>    <!-- body: rounded trapezoid -->
  </div>
  ```
  Replace with real photos when available — the layout and overlay system is already designed for it.
- **Gallery sidebar (210px):** Reserved for ad units or featured persona photos.

---

## Files
| File | Description |
|---|---|
| `Velora v5.html` | Full hi-fi interactive prototype. Open in browser to explore all views. |
| `README.md` | This document. |

---

## Developer Notes
1. Replace `window.claude.complete()` (design-env only) with your production AI API (Anthropic, OpenAI, etc.)
2. Navigation is currently JS classList toggling — replace with Next.js App Router routes
3. Age gate → replace localStorage with proper auth/session layer
4. CSS figures are placeholders — swap in real `<img>` tags with `object-fit: cover` when photos are ready. The overlay gradient system will work unchanged.
5. The sidebar thread list is a key UX pattern — keep the expand/collapse behaviour, it's intentional
