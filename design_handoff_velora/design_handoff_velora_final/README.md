# Handoff: Velora.ai — Final MVP

## Overview
Velora.ai is a private 18+ AI companion platform. Dark, minimal product UI. Single hot pink accent, Inter font, contour-only interactive states. Four views: Home, Discover, Chat, Gallery. Age gate on first visit. Live AI chat via persona prompts.

## About the Design Files
`Velora v5.html` is the **final hi-fi interactive prototype**. Open in a browser to explore all views and interactions. Recreate this in your production codebase — do not ship the HTML directly.

`Velora Logo Colors.html` shows all logo color variants with download button.

`logo-source.png` is the source logo (brown linework on white — recolor via CSS filter or export directly from the logo colors file).

---

## Design Tokens

```css
--bg:            #0a0a0f   /* page background */
--surface:       #111118   /* sidebar, panels, cards */
--surface-2:     #18181f   /* inputs, secondary surfaces */
--surface-3:     #1e1e27   /* their chat bubbles */
--border:        rgba(255,255,255,0.08)
--border-2:      rgba(255,255,255,0.14)
--text:          #f0edf2
--text-2:        #9990a0
--text-3:        #5e5868
--accent:        #f0308a   /* hot pink — single brand accent */
--accent-dim:    rgba(240,48,138,0.18)
--accent-border: rgba(240,48,138,0.42)
--green:         #22c55e   /* online status only */

Font: Inter (Google Fonts — 400/500/600/700/800)
Base: 14px / 1.5 line-height
Radius large: 14px  |  small: 9px
Sidebar: 220px  |  Topbar: 60px
```

---

## Button System
All interactive elements follow one rule — **contour, no fill. Fill on hover.**

```
Default: transparent bg + 2px solid accent border + accent text
Hover:   solid accent bg + white text
Ghost:   surface-2 bg + default border → surface-3 on hover
```

This applies to: primary buttons, chat send button, card CTAs, mobile nav active state, sidebar active nav items, sidebar active thread items, chat bubbles (mine).

---

## Layout

```
┌──────────────────────────────────────┐
│ SIDEBAR 220px (sticky, full height)  │
│  Logo mark + "velora.ai" wordmark    │
│  Nav: Home / Discover / Chat↓ / Gal  │
│    Chat → inline thread drawer       │
│  Footer: Profile / Settings          │
├──────────────────────────────────────┤
│ TOPBAR 60px (sticky, blur backdrop)  │
│  Left: hamburger (mobile)            │
│  Right: 41.4 tokens pill + Profile   │
├──────────────────────────────────────┤
│ CONTENT (22px padding)               │
└──────────────────────────────────────┘
```

---

## Views

### Home
- **Hero banner** 280px tall — dark bg, subtle pink border glow, CSS figure silhouette right side, text + 2 CTAs left
- **Active now** — horizontal scroll rail, avatar rings with pink gradient border (62×62px), name + mood label
- **Featured** — 4-col grid, `aspect-ratio: 2/3` portrait cards with CSS figure + gradient overlay + name + CTA
- **Messages (inbox)** — 4 thread rows, avatar + name + preview + timestamp, accent dot for unread

### Discover
- Filter pills (contour active state) + 3-col grid of `aspect-ratio: 2/3` cards
- Cards: CSS figure, gradient bg, tag badge, name + 1-line description + "Chat now" button
- Filter hides non-matching cards: `opacity 0 + scale(.96) + translateY(5px)` transition

### Chat
- Full-width panel. `height: calc(100vh - topbar - 40px)`
- Grid: `auto 1fr auto` (header / messages / input)
- **Thread list lives in sidebar** — expands inline below Chat nav on click (max-height transition + arrow rotation)
- **Empty state** when no thread selected: centered icon + "Choose a persona" + subtext
- **Their bubbles:** `#1e1e27` bg + `rgba(255,255,255,0.14)` border, `border-bottom-left-radius: 4px`
- **My bubbles:** `transparent` bg + `2px solid accent` border, `border-bottom-right-radius: 4px`
- Messages bg: `#07070c` (slightly darker than surface)
- Typing indicator: 3 bouncing dots in a "theirs" bubble
- Chat header tools: 📷 camera · ☆ star · ⋯ more

**AI integration:**
Replace `window.claude.complete()` with your production AI API.

Persona system prompts:
| Name | Persona |
|------|---------|
| Elara | Warm, romantic, soft, intimate, slightly poetic. Max 2 sentences. |
| Mara | Luxurious, sophisticated, upscale lounge energy. Max 2 sentences. |
| Nyra | Mysterious, poetic, lyrical, cryptic. Max 2 sentences. |
| Rose | Playful, flirty, bright, teasing. Max 2 sentences. |
| Mina | Creative, dreamy, loves art and poetry. Max 2 sentences. |

Greetings on thread switch:
- Elara: "I kept this room quiet, just for us."
- Mara: "Welcome back. The lounge is ready."
- Nyra: "You came. I wondered if you would."
- Rose: "Hey! What mood are you in tonight?"
- Mina: "I was just thinking about you."

### Gallery
- `1fr 210px` grid. Main: 3-col `aspect-ratio: 2/3` tiles, character-based (Elara, Mara, Nyra, Rose, Siena, Mina)
- Each tile: CSS figure + gradient bg + lock badge (top-right) + name + mood label (bottom)
- Click opens lightbox: blur overlay, card slides up, persona name + description + unlock CTA
- Side panel: Premium card — $24/month, 4 perks, unlock button

---

## Age Gate
- Fixed overlay z-index 300, first visit only
- `localStorage` key: `v_in`
- Logo mark + "18+ only" + body text + confirm button (contour style) + leave button

---

## Logo
`logo-source.png` — brown linework on white background.

**CSS filter to recolor:**
```css
/* Hot pink */
filter: brightness(0) saturate(100%) invert(30%) sepia(90%) saturate(2500%) hue-rotate(300deg) brightness(1.15);

/* Rose gold */
filter: brightness(0) saturate(100%) invert(62%) sepia(40%) saturate(600%) hue-rotate(310deg) brightness(0.95);

/* White */
filter: brightness(0) invert(1);
```

In the sidebar, the logo is used as a `background-image` with `background-size: 350%` to crop out the transparent padding:
```css
.brand-dot {
  width: 26px; height: 26px;
  background: url('logo-source.png') center / 350% auto no-repeat;
  filter: /* hot pink filter above */;
}
```

---

## Responsive
- **< 1280px:** Grids → 2-col
- **< 980px:** Sidebar off-canvas (slide from left), mobile bottom nav (4 tabs, contour active state)
- **< 720px:** All grids → 2-col, avatar rail compresses

---

## Key State
| State | Storage |
|---|---|
| Active view | `localStorage: v_view` |
| Age gate dismissed | `localStorage: v_in` |
| Active chat thread | JS in-memory |
| Sidebar drawer open | JS in-memory |
| Discover filter | JS in-memory |

---

## Files
| File | Description |
|---|---|
| `Velora v5.html` | Final interactive prototype — open in browser |
| `logo-source.png` | Logo source (recolor with CSS filter) |
| `Velora Logo Colors.html` | All logo color variants + SVG download |
| `README.md` | This document |

---

## Notes for Claude Code / Codex
1. **Replace `window.claude.complete()`** with Anthropic/OpenAI API call
2. **Replace JS view-switching** with Next.js App Router routes
3. **Replace localStorage age gate** with proper auth
4. **CSS figures are placeholders** — swap with `<img>` tags + `object-fit: cover` when real photos arrive. The gradient overlay system works unchanged
5. **Logo padding** — `logo-source.png` has ~94% transparent padding around the mark. Use `background-size: 350%` trick or crop the PNG tightly before using at small sizes
