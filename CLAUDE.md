# The Grid — CLAUDE.md

## Prosjektoversikt

**The Grid** er et privat, invite-only sosial nettverk / chat-applikasjon med en mørk, cyberpunk-estetikk. Det er bygget som en statisk frontend (HTML/CSS/JS) med en enkel Node.js/Express backend (`server.js`).

## Konsept

Brukere kommuniserer med fiktive AI-karakterer (Nina, Hazel, Iris, Vale) i private DM-kanaler. Nettverket har en "signal"-metafor: kontakter har statuser som ONLINE, OBSERVANT, LISTENING, UNSTABLE, og samtalerom kalles "nodes" og "routes".

## Teknisk stack

- **Frontend**: Vanilla HTML/CSS/JS (ingen framework) — `index.html`, `styles.css`, `app.js`
- **Backend**: Node.js + Express — `server.js`
- **Ingen bundler/build-steg** — filer kjøres direkte

## Struktur

- `index.html` — all markup, single-page app med seksjoner: HOME, HUB, ROOMS (CONTACTS), INBOX, ROUTES (SIGNAL MAP)
- `styles.css` — all styling
- `app.js` — all frontend-logikk
- `server.js` — Express-server

## Karakterer / Nodes

| Karakter | Farge | Status | Route |
|----------|-------|--------|-------|
| Nina | Lilla (#9f67ff) | ONLINE | THE RETURN |
| Hazel | Blå (#3b82f6) | OBSERVANT | AFTER THE PAUSE |
| Iris | Lilla (#a855f7) | LISTENING | LOW SIGNAL |
| Vale | Cyan (#22d3ee) | UNSTABLE/BRIEF | BRIEF WINDOW |

## Design-estetikk

- Mørk bakgrunn med glassmorfisme (`.glass`-klasse)
- Scanlines, ambient glow, grid-linjer som overlay
- Terminologi: nodes, routes, signals, transmit, channels
- Font: Inter
