# The Grid — Copilot Instructions

## Project summary

The Grid is a private, invite-only social network where the user chats with four fictional AI characters (Nina, Hazel, Iris, Vale) via private DM threads. Dark cyberpunk aesthetic. No real users, no social graph — only the relationship between the user and the characters.

Live at: `https://the-grid-production-ce9c.up.railway.app`

---

## Stack

- Vanilla HTML/CSS/JS frontend — no framework, no bundler, no build step
- Node.js + Express backend (`server.js`) with ESM modules
- Multi-provider LLM: OpenRouter → Groq → Together → OpenAI (first key found in `.env` wins)
- Deployed on Railway via GitHub `master` auto-deploy

---

## File map

| File | Role |
| ---- | ---- |
| `index.html` | Full SPA markup — 5 sections: HOME, HUB, CONTACTS, INBOX, ROUTES |
| `styles.css` | All styling — glassmorphism, scanlines, avatar rings |
| `app.js` | All frontend logic — state, rendering, fetch to AI backend |
| `server.js` | Express entry point |
| `server/routes/characters.js` | Chat API routes |
| `server/services/openaiClient.js` | Multi-provider LLM client |
| `src/engine/brain/characterProfiles.js` | Personality anchors for all 4 characters |
| `src/engine/services/CharacterAIService.js` | System prompt builder + AI call + response normalization |
| `src/engine/systems/RelationshipEngine.js` | Updates relationship state from user input |
| `src/engine/systems/MemorySystem.js` | In-memory conversation history |
| `characters/*.json` | Character data files |

---

## API contract

All responses: `{ ok: true, ... }` or `{ ok: false, error: string }`.

```
GET    /api/characters           → { ok, characters[] }
POST   /api/characters/:id/chat  → { ok, reply, character }  body: { text }
DELETE /api/characters/:id/history → { ok }
GET    /api/health               → { ok, status }
```

---

## Characters

| id | Name | Color | Status | Voice |
| -- | ---- | ----- | ------ | ----- |
| `nina` | Nina | `#9f67ff` | ONLINE | Warm, familiar, shared history — easy and honest |
| `hazel` | Hazel | `#3b82f6` | OBSERVANT | Precise, self-possessed, slow to open |
| `iris` | Iris | `#a855f7` | LISTENING | Few words, heavy weight, melancholic undertone |
| `vale` | Vale | `#22d3ee` | UNSTABLE | Volatile, intense in brief flashes, disappears without warning |

Character voice and personality are defined in `CharacterAIService.js` (`buildVoiceGuide`) and `characterProfiles.js`. Do not override or neutralize these in routes or frontend.

---

## AI response shape

`CharacterAIService.generate()` always returns:

```js
{ spoken: string, thought: string|null, meta: { toneClass, subtextStrength } }
```

- `spoken`: plain dialogue, no markdown, no asterisks
- `thought`: short parenthetical action, max 7 words, e.g. `(glances away)`

The route combines them: `reply = thought ? \`*${thought}* ${spoken}\` : spoken`

---

## Frontend state

```js
characterDirectory   // character data + in-memory message history
relationshipState    // { state, pull, memory } per character
appState             // active page, active contact, active thread
```

Relationship state progression: `dormant → warming → pull-active → opening → open → faded`

`sendMessage()` is async — shows a typing indicator, fetches `/api/characters/:id/chat`, replaces with AI reply.

---

## Design language

- Dark background with glassmorphism (`.glass` class)
- Scanlines + ambient glow as CSS body overlays
- Avatar rings (`.avatar-ring[data-ring-state]`) reflect relationship state
- Vocabulary: **nodes**, **routes**, **signals**, **transmit**, **channels** — never "chat", "friends", "social"
- Character colors applied via `.avatar-nina`, `.avatar-hazel`, `.avatar-iris`, `.avatar-vale`

---

## Rules

- Do not add frameworks, bundlers, or TypeScript
- Do not change the `ok/result/error` API shape without updating the frontend
- Do not commit `.env` — use `.env.example`
- Do not split `app.js` into modules unless explicitly asked
- Do not soften or neutralize character voices — conflict, silence, and friction are intentional
- `escapeHtml()` in `app.js` is XSS protection — never remove it
- Conversation history files (`characters/*.history.json`) are ephemeral on Railway
