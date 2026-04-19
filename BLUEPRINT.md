# Hub Blueprint — Page Module Architecture

## Objective

Refactor the existing Hub so it becomes the canonical page-module pattern for the rest of the application. The result should not be a one-off page merge. It should establish the structural, styling, and rendering conventions that future pages will follow.

## Primary outcome

- The Hub should match the design quality and internal structure of `Page.html`.
- The Hub must remain integrated with the existing app shell in `index.html`.
- The Hub must use the existing app state/data model in `app.js`.
- The final Hub implementation should serve as the reference architecture for future pages.

## Core principle

Treat the Hub as the first proper page module in the app.

Every page should clearly separate:

1. Global app shell
2. Page wrapper
3. Page-local layout
4. Page-local render logic

## Required architectural pattern

- Global shell stays global
- Each page owns one top-level section
- Each page has one page-local layout wrapper
- Each page uses page-local class names
- Each page renders from shared app state through page-local functions
- Each page avoids leaking styles or assumptions into other pages

## Implementation requirements

### 1. Preserve the global app shell

- Keep the existing topbar, navigation, and page switching system in `index.html`.
- Do not duplicate the shell from `Page.html`.
- Do not add a second topbar or second full-page wrapper.

### 2. Rebuild Hub as a self-contained page module

Inside the existing Hub page section, use a clear structure:

- `hub-layout`
- `hub-sidebar`
- `hub-main`
- `hub-chat-head`
- `hub-thread`
- `hub-composer`
- `hub-dossier`

Use Hub-specific class names consistently. Avoid generic names like `.chat`, `.sidebar`, `.topbar`, `.status` unless strictly scoped.

### 3. Use Page.html as the layout/design donor only

- Import the internal Hub structure and design language from `Page.html`.
- Do not import `Page.html` as a whole standalone document.
- Do not keep prototype wrappers, duplicate head/body content, duplicate scripts, or edit-mode scaffolding.

### 4. Keep one data model only

- The existing `app.js` state/data model is the source of truth.
- Do not keep parallel prototype constants or duplicate character/thread models.
- Adapt Hub rendering to the current app state instead of preserving a second standalone prototype data layer.

### 5. Create page-local rendering boundaries

Refactor Hub logic so it is understandable as a page module. Prefer:

- `renderHub()`
- `renderHubSidebar()`
- `renderHubThread()`
- `renderHubDossier()`
- `bindHubEvents()`

### 6. Consolidate Hub CSS into one canonical block

- Move Hub styling into a clear, page-scoped section in `styles.css`.
- Remove overlapping, contradictory, or legacy Hub rules where safe.
- Scope all Hub styles under `#hub` or use `hub-*` class names.
- Prevent prototype style collisions with the rest of the app.

### 7. Make mobile behavior part of the page blueprint

- No major reliance on `100vh` or `overflow:hidden` for scrollable layouts
- Single-column behavior on smaller screens
- Stable chat/composer behavior on phone
- Usable touch targets
- No horizontal overflow
- No trapped scroll

### 8. Remove prototype-only features

Strip anything that does not belong in long-term architecture:

- Dev/edit-mode hooks
- Tweaks panels
- Parent postMessage integrations
- Prototype-only shell elements
- Dead controls that are not wired

### 9. Normalize naming and assets

- Standardize asset path conventions
- Standardize Hub DOM naming
- Standardize render/state mapping

### 10. Leave the codebase in a reusable state

The final Hub should demonstrate the exact pattern future pages follow:

- One page section
- One page layout wrapper
- Scoped CSS
- Page-specific render functions
- Shared global state, page-local rendering
- Minimal global leakage
- Clear mobile behavior

## Deliverables

1. Updated `index.html`
2. Updated `styles.css`
3. Updated `app.js`
4. A short implementation summary describing:
   - What was kept from the real app
   - What was borrowed from `Page.html`
   - What was intentionally discarded
   - What page-module conventions were established for future pages

## Success criteria

- Hub visually reflects the quality and structure of `Page.html`
- Hub lives cleanly inside the existing app shell
- Hub is modular and understandable
- Hub works well on mobile
- Hub does not duplicate shell, styles, or data models
- Hub can be used as the template for future pages
