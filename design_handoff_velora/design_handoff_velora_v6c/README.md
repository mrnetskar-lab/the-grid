# Handoff: Velora.ai — v6c (Full Feature Patch)

## What's new since v6b

### Patch 1: Conversion features
- **Message limit wall** — free users get 5 messages, then a character-specific paywall card
- **Gallery tab in character panel** — working 3×2 grid, locked tiles open paywall
- **Mood shift bar** — fills as conversation deepens (Guarded → Connected)

### Patch 2: Micro personality features
- **Unread badge** — pulsing pink dot on Chat nav when AI replies while away
- **"♥ she remembered" pill** — appears on return visits (tracked via localStorage)
- **Typing delay by character** — Vale 0.5s, Nina 1.4s, Hazel 2.2s, Iris 3.8s
- **Vale status flickers** — UNSTABLE label has erratic flicker animation
- **Chat blur on lock** — messages blur + frosted glass overlay when limit hit

---

## Message Limit System

```js
const FREE_MSG_LIMIT = 5;
let freeMessagesUsed = parseInt(localStorage.getItem('v_free_msgs') || '0');

// On each send:
if (!checkMsgLimit()) return; // blocks send, shows wall

// Wall shows:
// - Character photo + name
// - "She wants to keep talking" copy
// - Upgrade CTA → openPaywall(thread)
// - "Maybe later" → dismisses wall

// Reset on thread switch:
resetMsgState(); // clears wall, re-enables input, resets mood bar
```

localStorage key: `v_free_msgs` (integer, persists across sessions)

---

## Mood Shift Bar

Stages (every 2 messages):
```
0%   → Guarded
18%  → Cautious
35%  → Warming
52%  → Open       ← label turns pink
70%  → Trusting
88%  → Connected
```

DOM: `#cpMoodFill` (width%), `#cpMoodLabel` (text + color)
Resets on thread switch via `resetMsgState()`

---

## Character Panel Gallery Tab

- `cpSwitchTab(0)` → Profile, `cpSwitchTab(1)` → Gallery
- Gallery: 6 tiles, first free (`class="cp-gallery-tile free"`), rest locked
- Locked tiles: `onclick → openPaywall(thread)`
- Tile photos: `#cpg0` through `#cpg4` — update on thread switch
- "Unlock all photos" CTA at bottom

---

## Typing Delay by Character

```js
const typingDelay = { hazel: 2200, nina: 1400, iris: 3800, vale: 500 };
```

Delay fires BEFORE the AI call completes — typing indicator shows for at least this long regardless of API speed.

---

## Memory Pill

```js
// On thread switch:
if (localStorage.getItem('v_met_' + thread)) {
  // show "♥ she remembered" pill after 600ms
}
localStorage.setItem('v_met_' + thread, '1');
```

First visit: no pill. Every subsequent visit: pill appears.

---

## Status Animations

```css
/* Default (all characters) */
.cp-status { animation: statusPulse 3s ease-in-out infinite; }

/* Vale only */
.unstable-status { animation: statusFlicker 1.8s ease-in-out infinite; color: #ff9940; }
```

Applied via `applyStatusStyle(thread)` on thread switch.

---

## Chat Lock (blur on message limit)

```css
.chat-msgs.locked .msg:not(:last-child) { filter: blur(1.5px); opacity: 0.5; }
.chat-form.locked::before { /* frosted glass overlay */ }
```

`lockChat()` / `unlockChatBlur()` — called on limit hit / dismiss / thread switch.

---

## Onboarding Flow (from v6b)

3 steps: Welcome → Pick character → First message
- Triggers after age gate on first visit
- localStorage key: `v_onboarded`
- `skipOnboard()` bypasses flow

## Paywall (from v6b)

- `openPaywall(thread)` — opens with that character's photo
- Triggered by: locked gallery tiles, message limit wall, "Unlock all photos"
- $24/month + 3-day free trial copy
- localStorage key: `v_in` (age gate, not paywall state)

---

## Files
| File | Notes |
|------|-------|
| `Velora v6.html` | Full prototype with all patches |
| `logo-source.png` | Logo asset |
| `profile_pictures/*.png` | Character photos |
