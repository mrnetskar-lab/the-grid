# The Grid — AI Context

## Hva er dette

**The Grid** er et privat, invite-only sosialt nettverk der brukeren kommuniserer med fire fiktive AI-karakterer via private DM-kanaler. Estetikken er mørk cyberpunk — signal-metaforer, glassmorfisme, scanlines. Ingen sosiale features, ingen real users. Bare deg og karakterene.

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
├── app.js                              # All frontend-logikk
├── server.js                           # Express entry point
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

### Samtalehistorikk

Lagres i `characters/{id}.history.json` på serveren. Maks 200 meldinger. De siste 10 sendes som context til AI per kall.

---

## Frontend-arkitektur (`app.js`)

### State

- `characterDirectory` — karakterdata med meldingshistorikk (in-memory, resettes ved reload)
- `relationshipState` — `{ state, pull, memory, sharedOpen }` per karakter
- `appState` — aktiv side, aktiv kontakt, aktiv thread

### Relationship states (i rekkefølge)

`dormant` → `warming` → `pull-active` → `opening` → `open` → `faded`

`pull` og `memory` øker med 0.05/0.04 per melding. State eskalerer automatisk ved terskler.

### Sende melding (`sendMessage`)

Asynkron. Viser typing-indikator (`...`), kaller `/api/characters/:id/chat`, erstatter med AI-svar. Feil vises som `...`.

### Sider

| ID | Navn | Innhold |
| -- | ---- | ------- |
| `home` | HOME | Stats, node-rail, signal feed |
| `hub` | HUB | Scene-fokus på aktiv kontakt, spotlight |
| `rooms` | CONTACTS | Liste over alle karakterer |
| `inbox` | INBOX | DM-thread + input |
| `routes` | ROUTES | Signal map |

---

## Design-regler

- Mørk bakgrunn, glassmorfisme (`.glass`-klasse med `backdrop-filter: blur`)
- Scanlines og ambient glow som CSS-overlay på `body`
- Avatar-ringer (`.avatar-ring[data-ring-state]`) viser relationship-state visuelt
- Terminologi: **nodes**, **routes**, **signals**, **transmit**, **channels** — aldri "chat", "friends", "social"
- Font: Inter
- Karakterfarger brukes konsekvent i CSS via `.avatar-nina`, `.avatar-hazel` etc.

---

## Konvensjoner

- **Aldri** bruk frameworks eller build-steg
- **Aldri** endre API-kontrakten (`ok/result/error`-shape) uten å oppdatere frontend
- **Aldri** commit `.env` — bruk `.env.example` som mal
- Karakterstemmer og personality-anchors eies av `CharacterAIService.js` og `characterProfiles.js` — endre der, ikke i route-laget
- `app.js` er bevisst én stor fil — ikke del opp uten eksplisitt instruksjon
- Samtalehistorikk på disk (`characters/*.history.json`) er ephemeral — Railway sletter ved re-deploy

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
