# The Grid — AI Context

## Hva er dette

**The Grid** er et privat, invite-only sosialt nettverk der brukeren kommuniserer med fire fiktive AI-karakterer via private DM-kanaler. Estetikken er mørk cyberpunk — signal-metaforer, glassmorfisme, scanlines, neon-glow. Ingen sosiale features, ingen real users. Bare deg og karakterene.

Deployet på Railway: `https://the-grid-production-ce9c.up.railway.app`
Repo: `https://github.com/mrnetskar-lab/the-grid`

---

## Teknisk stack

- **Frontend**: Vanilla HTML/CSS/JS — ingen framework, ingen bundler
- **Backend**: Node.js + Express (`server.js`) — ESM modules (`"type": "module"`)
- **AI**: Multi-provider LLM via OpenAI-kompatibelt API (OpenRouter → Groq → Together → OpenAI)
- **Deploy**: Railway (auto-deploy fra GitHub `master`)

---

## Filstruktur

```text
the_grid/
├── index.html                          # Hele SPA-markupen — 5 sider
├── styles.css                          # All styling
├── app.js                              # All frontend-logikk (~820 linjer)
├── server.js                           # Express entry point
├── backround.jpg                       # Bakgrunnsbilde (NB: typo i filnavn, ikke rett)
├── profile_pictures/                   # Karakterbilder som deployes til Railway
│   ├── nina_profile.png
│   ├── hazel.png
│   ├── hazel_450x_auto__.mp4           # Hazel bruker video (autoplay loop muted)
│   ├── iris_profile.png
│   └── vale_profile.png
├── images/                             # 83 shot_*.png — lokal only, 1.4GB, IKKE i git
├── characters/
│   ├── nina.json                       # Karakterdata
│   ├── hazel.json
│   ├── iris.json
│   └── vale.json
├── server/
│   ├── routes/characters.js            # API: GET /api/characters, POST /:id/chat, DELETE /:id/history
│   └── services/openaiClient.js        # Multi-provider LLM-klient
└── src/engine/
    ├── brain/characterProfiles.js      # Personality-profiler for alle 4 karakterer
    ├── services/CharacterAIService.js  # System prompt builder + AI-kall + normalisering
    ├── systems/RelationshipEngine.js   # Oppdaterer relationship-state basert på brukerens input
    └── systems/MemorySystem.js         # In-memory samtalehistorikk
```

---

## API-ruter

| Metode | Rute | Beskrivelse |
| ------ | ---- | ----------- |
| GET | `/api/characters` | Hent alle karakterer fra `characters/*.json` |
| POST | `/api/characters/:id/chat` | Send melding, få AI-svar. Body: `{ text: string }` |
| DELETE | `/api/characters/:id/history` | Tøm samtalehistorikk |
| GET | `/api/health` | Helsesjekk — returnerer `{ ok: true, status: "online" }` |

Alle ruter returnerer `{ ok: true, ... }` eller `{ ok: false, error: string }`.

Spesiell input: `text: "__greeting__"` trigger en åpningsmelding fra karakteren (brukt av hub ved character-switch).

---

## Karakterer

| ID | Navn | Farge | Status | Arketype |
| -- | ---- | ----- | ------ | -------- |
| `nina` | Nina | `#9f67ff` | ONLINE | Familiar Stranger — varm, nostalgisk, delt historie |
| `hazel` | Hazel | `#3b82f6` | OBSERVANT | Still Water — presis, tilbakeholden, sakte å åpne seg |
| `iris` | Iris | `#a855f7` | LISTENING | The Watcher — få ord, tung vekt, melankolsk undertone |
| `vale` | Vale | `#22d3ee` | UNSTABLE | Brief Window — volatil, intense glimt, forsvinner uten varsel |

Karakterprofiler med fullstendige personality-anchors er i `src/engine/brain/characterProfiles.js`.
Voice guides og immersion-regler er hardkodet i `CharacterAIService.js` per karakter.

---

## AI-arkitektur

### Provider-prioritet (`server/services/openaiClient.js`)

```text
OPENROUTER_API_KEY → GROQ_API_KEY → TOGETHER_API_KEY → OPENAI_API_KEY
```

Første nøkkel som finnes i `.env` brukes. Modell kan overstyres med `AI_MODEL` eller per karakter med `NINA_MODEL`, `HAZEL_MODEL` etc.

### Svar-format

`CharacterAIService.generate()` returnerer alltid:

```js
{ spoken: string, thought: string|null, meta: { toneClass, subtextStrength } }
```

`spoken` = det karakteren sier ut loud (plain tekst, ingen markdown).
`thought` = kort parentes-handling, maks 7 ord, f.eks. `(glances away)`.

Route-laget i `characters.js` kombinerer disse til `reply`:

```js
reply = thought ? `*${thought}* ${spoken}` : spoken
```

`meta.toneClass` brukes av frontend til å beregne bubble-farge (contour system).
`meta.subtextStrength` (0–1) driver glow-intensiteten på chat-bubbler.

### Samtalehistorikk

Lagres i `characters/{id}.history.json` på serveren. Maks 200 meldinger. De siste 10 sendes som context til AI per kall. Ephemeral — Railway sletter ved re-deploy.

---

## Frontend-arkitektur (`app.js`)

### State

- `characterDirectory` — karakterdata med meldingshistorikk (in-memory, resettes ved reload)
- `relationshipState` — `{ state, pull, memory, sharedOpen }` per karakter
- `appState` — aktiv side, aktiv kontakt, aktiv thread

### Relationship states (i rekkefølge)

`dormant` → `warming` → `pull-active` → `opening` → `open` → `faded`

`pull` øker 0.05 per melding, `memory` 0.04. State eskalerer automatisk ved terskler (0.75 → pull-active, 0.9 → opening).

### Viktige funksjoner

- `sendMessage(contactKey, text)` — asynkron, viser typing-indikator, kaller API, oppdaterer alle views
- `focusContact(contactKey)` — setter aktiv karakter, trigger `triggerCharacterGreeting` i hub hvis ingen meldinger ennå
- `triggerCharacterGreeting(contactKey)` — sender `__greeting__` til AI og viser svaret som åpningsmelding i hub
- `applyContour(el, charKey, toneClass, subtextStrength)` — setter CSS custom properties for gradient bubble-borders
- `renderHubChat()` — renderer siste 8 meldinger i hub med contour-system
- `escapeHtml(value)` — XSS-beskyttelse, aldri fjern

### Contour bubble-system

Karakterens hue-base (`CHAR_HUE`) + tone-modifikator (`TONE_MOD`) + subtextStrength → CSS vars på hver boble:
`--msg-hue-a/b/c`, `--msg-sat`, `--msg-light`, `--msg-border-alpha`, `--msg-glow-alpha`

### Sider

| ID | Navn | Innhold |
| -- | ---- | ------- |
| `home` | HOME | Stats, node-rail, signal feed |
| `hub` | HUB | Sidebar (CHANNELS) + live chat + AI-greeting ved switch |
| `rooms` | CONTACTS | Liste over alle karakterer |
| `inbox` | INBOX | Full DM-thread + input |
| `routes` | PROFILES | 4 karakterkort med bilder/video + bildegalleri |

---

## UI-arkitektur (nåværende)

### Topbar

- `position: fixed`, pill-form (`border-radius: 999px`), sentrert
- Aktiv side: svart tekst på cyan bakgrunn
- Wayfinder er skjult (`display: none`)

### Hub (HUB-siden)

- Layout: `grid-template-columns: 280px minmax(0, 1fr)`
- Venstre: `.hub-sidebar` — CHANNELS-tittel, søk, filter-chips, karakterliste
- Høyre: `.hub-chat-panel` — chat-header, meldinger, composer
- Chat-panel har `max-width: 620px` så det ikke blir tomt void på wide screens
- Mobil (<600px): sidebar kollapser til horisontal avatar-strip

### Profiles-siden (`#routes`)

- 4 karakterkort øverst med `aspect-ratio: 3/4` portrettbilder
- Hazel bruker `<video autoplay loop muted playsinline>`
- Gallery-grid under (lokal only — vises ikke på Railway)

---

## Design-regler

- Mørk bakgrunn (`#020206`) + bakgrunnsbilde (`/backround.jpg`) med dark overlay
- Glassmorfisme (`.glass`-klasse med `backdrop-filter: blur`)
- Scanlines + ambient glow som CSS-overlay på `body`
- Avatar-ringer (`.avatar-ring[data-ring-state]`) viser relationship-state visuelt
- Terminologi: **nodes**, **routes**, **signals**, **transmit**, **channels** — aldri "chat", "friends", "social"
- Font: Inter
- Karakterfarger: nina `#9f67ff`, hazel `#3b82f6`, iris `#a855f7`, vale `#22d3ee`

---

## Git-regler

- Push alltid til `master` — ingen feature branches
- Push alltid **hele filen**, aldri fragment/partial
- `images/` er i `.gitignore` (1.4GB, lokal only)
- `Sublime Text/` er i `.gitignore`
- `.env` skal aldri committes

---

## Konvensjoner

- Aldri bruk frameworks eller build-steg
- Aldri endre API-kontrakten (`ok/result/error`-shape) uten å oppdatere frontend
- Aldri commit `.env` — bruk `.env.example` som mal
- Karakterstemmer og personality-anchors eies av `CharacterAIService.js` og `characterProfiles.js` — endre der, ikke i route-laget
- `app.js` er bevisst én stor fil — split kun etter eksplisitt instruksjon fra eier
- `escapeHtml()` i `app.js` er XSS-sikring — aldri fjern

---

## Miljøvariabler

```env
OPENROUTER_API_KEY=   # Primær anbefalt
GROQ_API_KEY=         # Gratis fallback
TOGETHER_API_KEY=     # Alternativ
OPENAI_API_KEY=       # Siste fallback

AI_MODEL=             # Overstyr modell globalt
NINA_MODEL=           # Overstyr per karakter
HAZEL_MODEL=
IRIS_MODEL=
VALE_MODEL=

PORT=3001             # Settes automatisk av Railway
```

---

## Hva som ikke skal røres

- `RelationshipEngine.js` og `MemorySystem.js` — fungerer, ikke endre uten grunn
- Voice guides per karakter i `CharacterAIService.js` (`buildVoiceGuide`) — tonen er nøye kalibrert
- `escapeHtml()` i `app.js` — XSS-sikring, aldri fjern
- Railway-konfigurasjon er implisitt (`npm start` + `package.json`) — ingen `railway.toml` nødvendig
- `profile_pictures/` — ikke endre filnavn, de er hardkodet i `index.html`
