# Handoff: Velora.ai — Final (Scene Builder + Full Feature Set)

## Stack
React + Next.js App Router recommended. Vanilla HTML prototype provided as pixel-perfect reference.

---

## What's in this build

### Core views
- Home, Discover, Chat, Gallery, Character Profile

### Characters
| ID | Photo | Color | Status |
|----|-------|-------|--------|
| hazel | hazel.png / hazel_large_picture.png | Pink `#f0308a` | ONLINE NOW |
| nina | nina.png | Rose `#e8407a` | ONLINE NOW |
| iris | iris.png | Violet `#7060e0` | LISTENING |
| vale | vale_profile.png | Teal `#00c8c0` | UNSTABLE |

### Navigation flow
```
Home → avatar rail / cards → Chat
Discover → click card → Profile → Start chatting → Chat
Chat → right panel → View full profile → Profile
```

---

## Scene Builder

The "Scene" pill in the chat input opens a bottom sheet with:
- **Mood** — Intimate / Playful / Mysterious / Electric / Tender
- **Setting** — Bedroom / Studio / Outdoor / Rooftop / Bar
- **Style** — Cinematic / Editorial / Soft focus / Dark & moody
- **Free text detail** field (optional)
- **Generate** button

### Integration with fal.ai (REPLACE THIS IN PRODUCTION)
In `Velora v6.html`, find `document.getElementById('sceneGenerate').addEventListener`:

```js
// CURRENT: placeholder timeout
await new Promise(r => setTimeout(r, 2200));

// REPLACE WITH:
const result = await fal.run('fal-ai/flux/dev', {
  input: {
    prompt: `${s.style} portrait photo, ${s.mood} mood, ${s.setting} setting${s.detail ? ', ' + s.detail : ''}, ${d?.name} character, cinematic lighting, high quality, 4k`,
    image_size: 'portrait_4_3',
    num_inference_steps: 28,
  }
});
// Then show result.images[0].url as an <img> in the bubble
```

The prompt string is already assembled correctly — just swap the mock for the real API call.

**Recommended model:** `fal-ai/flux/dev` (FLUX.1 dev — commercial license, best portrait quality)

**Character consistency:** Use IP-Adapter or PuLID in ComfyUI with the character's reference photo to lock the face across generated scenes.

---

## Paywall Strategy
**Chat is FREE — no message limits.**
Paywall triggers on:
- Locked gallery tiles (profile page + character panel Gallery tab)
- "Unlock all photos" CTA in Gallery tab
- Future: Scene generation (premium feature)

`openPaywall(thread)` — call with character ID to show paywall with that character's photo.

---

## Business Model Notes
- Subscription ($24/month) unlocks galleries + generated scenes
- Credits system for per-scene generation on top of subscription
- Chat is the hook — content is the monetization
- Do NOT gate conversations — let users get attached first

---

## Onboarding Flow
3 steps: Welcome → Pick companion → First message
- `localStorage: v_onboarded` — set after completion or skip
- `skipOnboard()` — bypasses flow
- Fires after age gate on first visit only

## Age Gate
- `localStorage: v_in` — set on confirm
- Fires before onboarding

## Important: localStorage Reset
The prototype previously had a message limit system that has been removed. If users are locked out of chat, clear:
```js
localStorage.removeItem('v_free_msgs')
```
The app now auto-clears this key on load. In production, do not implement any message limits on chat.

---

## Character Color System
Each character has their own accent color:
```css
.av-ring.hazel { background: linear-gradient(135deg, #f0308a, #c01465); }
.av-ring.nina  { background: linear-gradient(135deg, #e8407a, #ff85a0); }
.av-ring.iris  { background: linear-gradient(135deg, #7060e0, #a080ff); }
.av-ring.vale  { background: linear-gradient(135deg, #00c8c0, #4080ff); }
```
Iris and Vale get different active colors in sidebar. Vale's status flickers (CSS animation).

---

## Chat Bubble Design
```css
/* Their bubble — warm dark plum */
.bubble.theirs {
  background: linear-gradient(135deg, #1c1428, #181224);
  border: 1px solid rgba(180,140,220,0.18);
  color: #ede8f4;
}
/* My bubble — dark pink-tinted */
.bubble.mine {
  background: linear-gradient(135deg, #1e0f1a, #170c16);
  border: 1.5px solid rgba(240,48,138,0.45);
  color: #f5eef2;
}
/* Action text *like this* renders purple */
// In addMsg(), text.replace(/\*([^*]+)\*/g, '<span style="color:#9d80c8;font-style:italic">*$1*</span>')
```

---

## Mood Bar
Fills as conversation deepens: Guarded → Cautious → Warming → Open → Trusting → Connected
- DOM: `#cpMoodFill` (width%), `#cpMoodLabel`
- Resets on thread switch
- Label turns pink at 52%+

---

## Typing Delay by Character
```js
const typingDelay = { hazel: 2200, nina: 1400, iris: 3800, vale: 500 };
```
Delay fires before AI call — typing indicator shows for minimum this duration.

---

## Memory Pill
Second+ visit to a persona shows `♥ she remembered` after greeting.
```js
localStorage: v_met_{thread}  // set after first visit
```

---

## Status Animations
```css
.cp-status { animation: statusPulse 3s ease-in-out infinite; }
.unstable-status { animation: statusFlicker 1.8s ease-in-out infinite; color: #ff9940; }
```
`applyStatusStyle(thread)` — call on thread switch.

---

## Files
| File | Notes |
|------|-------|
| `Velora v6.html` | Complete prototype — open in browser |
| `logo-source.png` | Logo source (recolor with CSS filter) |
| `profile_pictures/*.png` | All character photos |
