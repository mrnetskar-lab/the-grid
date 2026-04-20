# Handoff: Velora.ai — v6b (Profile Page + Chat Panel)

## What's new since v6
- **Character profile page** — full dedicated page per character
- **Discover → Profile → Chat** funnel
- **"View full profile →"** link in chat's right character panel
- Back button returns to whichever page you came from (Discover or Chat)

---

## Navigation Flow

```
Home
 └─ Avatar rail / Featured cards → Chat (direct)
Discover
 └─ Click card (not button) → Profile page
      └─ "Start chatting" → Chat
      └─ "Back to Discover" → Discover
Chat
 └─ Right panel → "View full profile →" → Profile
      └─ "Back" → Chat
```

---

## Profile Page (`#view-profile`)

**Layout:** `grid-template-columns: 340px 1fr` (sticky photo left, scrollable info right)

**Left column (sticky):**
- Portrait photo `aspect-ratio: 3/4`, cinematic bottom fade, name + status overlay
- "Start chatting" CTA (accent contour → fills on hover)
- "Unlock gallery" secondary button

**Right column sections (each in a surface panel with inset highlight):**
1. **About** — full bio paragraph
2. **Mood & style** — tag pills (first 2 in accent pink, rest neutral)
3. **Details** — 2×2 stat grid (Mood / Style / Speaks / Route)
4. **Gallery preview** — 3×2 grid, first tile unlocked, rest show "Locked" / "Members" blur overlay + label

**Responsive:** collapses to 1-col below 900px, photo becomes `aspect-ratio: 4/3`

---

## Character Data

```js
hazel: {
  photo: 'hazel.png', wide: 'hazel_large_picture.png',
  status: '● ONLINE NOW',
  bio: 'Warm but withholding. She notices everything...',
  tags: ['Observant','Slow burn','Late night','Voice notes','Warm'],
  stats: [{Mood: Observant}, {Style: Slow burn}, {Speaks: English}, {Route: After the pause}]
}
nina: { status: '● ONLINE NOW', tags: ['Familiar','Romantic','Emotionally honest','Nostalgic'] }
iris: { status: '● LISTENING',  tags: ['Silent','Watcher','Melancholic','Hard to reach'] }
vale: { status: '● UNSTABLE',   tags: ['Volatile','Electric','Intense','Brief'] }
```

---

## Chat Character Panel (right sidebar, 280px)

Visible on desktop (hidden < 1100px). Updates on thread switch.

- Photo `aspect-ratio: 3/4` at top
- Profile / Gallery tabs (Gallery is stub — wire to generated images)
- Name + status + bio
- "♥ Private Content" CTA button
- **"View full profile →"** ghost button — opens profile page for active thread
- 2×2 stat tiles

---

## CSS additions (profile page)

```css
/* Layout */
.profile-layout { display: grid; grid-template-columns: 340px 1fr; gap: 20px; align-items: start; }
.profile-photo-col { position: sticky; top: calc(var(--topbar) + 20px); }
.profile-photo { border-radius: 14px; aspect-ratio: 3/4; overflow: hidden; }

/* Sections */
.profile-section { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 20px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04); }

/* Tags */
.profile-tag { border: 1px solid var(--border); color: var(--text-2); background: var(--surface-2); }
.profile-tag.accent { border-color: var(--accent-border); color: var(--accent); background: var(--accent-dim); }

/* Gallery tiles */
.profile-gallery-tile .tile-lock { background: rgba(0,0,0,0.55); backdrop-filter: blur(2px); }
```

---

## Developer Notes
1. `openProfile(id)` populates and navigates to `#view-profile` — call with character ID string
2. `window._profileFrom` stores the origin view for back navigation
3. `startChat(thread)` clicks the sidebar drawer item programmatically
4. Gallery tiles in profile are placeholders — replace `src` with actual generated image URLs per character
5. `cpViewProfile` button reads `data-thread` from active `.drawer-item`
6. Profile page is not in mobile nav — access only via Discover card click or chat panel link

---

## Files
| File | Notes |
|------|-------|
| `Velora v6.html` | Full prototype — open in browser |
| `logo-source.png` | Logo asset |
| `profile_pictures/*.png` | All 7 character photos |
