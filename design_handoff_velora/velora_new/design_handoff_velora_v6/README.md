# Handoff: Velora.ai — v6 Final

## Overview
Velora.ai is a private 18+ AI companion platform. Dark, cinematic product UI with real character photos (Hazel, Nina, Iris, Vale). Single hot pink accent `#f0308a`, Inter font, contour-only interactive states, premium depth treatment throughout.

## About the Design Files
`Velora v6.html` is the **final hi-fi interactive prototype**. Open in browser — all views are interactive, chat has live AI via persona prompts. Recreate in your production codebase. Do not ship the HTML directly.

---

## Design Tokens

```css
--bg:            #0a0a0f
--surface:       #111118
--surface-2:     #18181f
--surface-3:     #1e1e27
--border:        rgba(255,255,255,0.08)
--border-2:      rgba(255,255,255,0.14)
--text:          #f0edf2
--text-2:        #9990a0
--text-3:        #5e5868
--accent:        #f0308a   ← single brand accent
--accent-dim:    rgba(240,48,138,0.18)
--accent-border: rgba(240,48,138,0.42)
--green:         #22c55e   ← status only

Font: Inter (400/500/600/700/800)
Base: 14px / 1.5
Radius large (--r): 14px  |  small (--r-sm): 9px
Sidebar: 220px (250px > 1400px)  |  Topbar: 60px
Max width: 1600px (centered)
```

---

## Button / Interactive System
**Contour only — fill on hover.**
```
Default: transparent bg + 2px solid accent + accent text
Hover:   solid accent bg + white text
Ghost:   surface-2 + default border → surface-3 hover
Active nav: transparent + accent border (no fill)
Active sidebar thread: transparent + accent border + name glows pink
```

---

## Premium Depth Treatments
All cards use:
```css
box-shadow: 0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.055);
```
The `inset` top highlight gives surfaces physical weight.

Photo overlays use cinematic vignette (not simple gradient):
```css
background:
  radial-gradient(ellipse at 50% 0%, rgba(0,0,0,0.35) 0%, transparent 60%),
  linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.88) 100%);
```

Hero headline has pink glow:
```css
text-shadow: 0 0 60px rgba(240,48,138,0.35);
```

---

## Layout
```
┌────────────────────────────────────────────┐
│ SIDEBAR 220px                              │
│  SVG logo mark + "velora.ai"               │
│  Nav: Home / Discover / Chat↓ / Gallery    │
│    Chat → inline thread drawer             │
│    Active thread name glows pink           │
│  Footer: Profile / Settings                │
├────────────────────────────────────────────┤
│ TOPBAR 60px — tokens pill + My Profile     │
├────────────────────────────────────────────┤
│ CONTENT — 22px padding, max-width 1600px   │
└────────────────────────────────────────────┘
```

---

## Characters

| ID | Photo | Persona | Status |
|----|-------|---------|--------|
| hazel | hazel.png / hazel_large_picture.png | Warm but withholding. Notices everything. Gives nothing for free. | ONLINE NOW |
| nina | nina.png | Warm, familiar. You knew each other before. Closeness never left. | ONLINE NOW |
| iris | iris.png | Deeply attentive, almost impossible to reach. When she speaks, it lands. | LISTENING |
| vale | vale_profile.png | Unpredictable. Electric when present. Gone fast. No explanation. | UNSTABLE |

---

## Views

### Home
- **Hero** 280–420px — hazel_large_picture.png fills right 58%, cinematic dissolve, headline with pink glow, 2 CTAs
- **Avatar rail** — 64px rings, `linear-gradient(135deg, #f0308a, #c01465)` border, real photos
- **Featured** — 4-col `aspect-ratio:2/3` cards, real photos, vignette overlay, name/status/CTA
- **Messages** — 4 inbox rows with real photo avatars, unread pink dot

### Discover
- 4-col grid, same card format, filter pills
- Filters use `data-tags` attribute matching, `opacity + scale` hide animation

### Chat
- **Layout:** `1fr 280px` grid — chat panel left, character panel right
- Chat panel: `height: calc(100vh - topbar - 44px)`, full height
- **Character panel (right):** photo `3/4` aspect, Profile/Gallery tabs, name, status, bio, "Private Content" CTA, 4 stat tiles
- Panel updates on thread switch
- **Input bar:** full-width input + send button row, then action pills row (Image · Video · Scene)
- Hidden right panel on < 1100px

**AI prompts per character:**
- Hazel: "Warm but withholding. Notices everything. Gives nothing for free. Max 2 sentences."
- Nina: "Warm and familiar, knew user before, closeness never left, emotionally honest. Max 2 sentences."
- Iris: "Deeply attentive, almost impossible to reach. Goes silent. When speaks, it lands. Max 2 sentences."
- Vale: "Unpredictable, brief, electric when present. Connects fast, closes fast. No apology. Max 2 sentences."

**Greetings on thread switch:**
- hazel: "I noticed you were gone for a while. I didn't say anything."
- nina: "It's strange — it feels like we never stopped talking."
- iris: "…"
- vale: "You're here. Good. I have maybe five minutes."

### Gallery
- 4-col `aspect-ratio:2/3` grid, real photos, vignette, lock badge, name + mood
- Right sidebar: Premium card $24/month, 4 perks, unlock CTA

---

## Logo
Inline SVG in sidebar — spade/posterior shape with center line + two dimple-of-venus arcs, hot pink gradient stroke. No image file needed for sidebar use.

```svg
<svg viewBox="0 0 200 228" fill="none">
  <defs>
    <linearGradient id="lg" x1="100" y1="12" x2="100" y2="218" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#ff85b8"/>
      <stop offset="50%" stop-color="#f0308a"/>
      <stop offset="100%" stop-color="#7d1535"/>
    </linearGradient>
  </defs>
  <path d="M 100,14 C 115,14 186,55 186,98 C 186,123 166,123 140,123 A 52,52 0 1 1 100,208 A 52,52 0 1 1 60,123 C 34,123 14,123 14,98 C 14,55 85,14 100,14 Z"
    stroke="url(#lg)" stroke-width="10" stroke-linejoin="round"/>
  <line x1="100" y1="16" x2="100" y2="208" stroke="url(#lg)" stroke-width="5" stroke-linecap="round"/>
  <path d="M 68,152 C 78,164 90,168 100,165" stroke="url(#lg)" stroke-width="5" stroke-linecap="round"/>
  <path d="M 132,152 C 122,164 110,168 100,165" stroke="url(#lg)" stroke-width="5" stroke-linecap="round"/>
</svg>
```

`logo-source.png` included for other use cases (recolor with CSS filter).

---

## Responsive
- **< 1400px:** sidebar 220px
- **< 1280px:** all grids → 2-col
- **< 1100px:** chat right panel hidden
- **< 980px:** sidebar off-canvas, mobile bottom nav (4 tabs)
- **< 720px:** all grids → 2-col

---

## State
| Key | Storage |
|-----|---------|
| Age gate | `localStorage: v_in` |
| Active view | `localStorage: v_view` |
| Active chat thread | JS in-memory |
| Sidebar drawer open | JS in-memory |

---

## Developer Notes
1. **Replace `window.claude.complete()`** with Anthropic/OpenAI API
2. **Replace JS view-switching** with Next.js App Router
3. **Replace localStorage** with proper auth/session
4. **Image/Video/Scene action pills** in chat input are UI stubs — wire to fal.ai generation
5. **Camera icon** in chat header is redundant with Image pill — remove one or repurpose as live video
6. More persona photos coming via fal.ai + ComfyUI (FLUX.1 dev recommended for commercial use)

---

## Files
| File | Description |
|------|-------------|
| `Velora v6.html` | Final interactive prototype |
| `logo-source.png` | Logo source PNG |
| `profile_pictures/hazel.png` | Hazel portrait |
| `profile_pictures/hazel_large_picture.png` | Hazel wide (hero use) |
| `profile_pictures/nina.png` | Nina portrait |
| `profile_pictures/iris.png` | Iris portrait |
| `profile_pictures/vale_profile.png` | Vale portrait |
| `profile_pictures/nina_profile.png` | Nina alternate |
| `profile_pictures/iris_profile.png` | Iris alternate |
