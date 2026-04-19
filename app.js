// GRID — clean rewrite
// Relationship-first, contacts-based, invite/opening aware UI

// ---------------------------------------------------------
// DATA
// ---------------------------------------------------------

const characterDirectory = {
  nina: {
    key: "nina",
    name: "Nina",
    avatar: "N",
    status: "ONLINE",
    preview: "Still holding the thread.",
    mood: "Warm signal. Pulls you back.",
    scene: "Nina is closest right now.",
    sceneCopy: "She is still holding the thread.",
    tags: ["warm", "private", "holds the thread"],
    messages: [
      { side: "incoming", text: "You came back slower this time.", time: "20:38" },
      { side: "incoming", text: "Still — you came back.", time: "20:39" },
    ],
  },
  hazel: {
    key: "hazel",
    name: "Hazel",
    avatar: "H",
    status: "OBSERVANT",
    preview: "You disappeared too early.",
    mood: "Precise. Watching.",
    scene: "Hazel is closest right now.",
    sceneCopy: "Hazel notices what you avoid before you do.",
    tags: ["sharp", "watching", "pauses matter"],
    messages: [
      { side: "incoming", text: "There you are.", time: "20:21" },
      { side: "incoming", text: "You always return like you weren't going to.", time: "20:22" },
    ],
  },
  iris: {
    key: "iris",
    name: "Iris",
    avatar: "I",
    status: "LISTENING",
    preview: "Only clear in private.",
    mood: "Quiet. Slow. Intimate.",
    scene: "Iris is warming quietly.",
    sceneCopy: "Meaning appears only when you stop forcing it.",
    tags: ["quiet", "low signal", "clear"],
    messages: [
      { side: "incoming", text: "You don't have to speak quickly here.", time: "20:31" },
      { side: "incoming", text: "Let the thought finish forming first.", time: "20:32" },
    ],
  },
  vale: {
    key: "vale",
    name: "Vale",
    avatar: "V",
    status: "UNSTABLE",
    preview: "Open briefly. Then gone.",
    mood: "Brief windows. No comfort.",
    scene: "Vale opens briefly.",
    sceneCopy: "Access does not hold for long here.",
    tags: ["brief", "invite only", "unstable"],
    messages: [
      { side: "incoming", text: "You're late.", time: "now" },
      { side: "incoming", text: "Come in or lose it.", time: "now" },
    ],
  },
};

const relationshipState = {
  nina: {
    state: "warming",
    pull: 0.74,
    memory: 0.58,
    sharedOpen: false,
    openExpiresAt: null,
    note: "She is still holding the thread.",
  },
  hazel: {
    state: "pull-active",
    pull: 0.82,
    memory: 0.43,
    sharedOpen: false,
    openExpiresAt: null,
    note: "Hazel notices what you avoid before you do.",
  },
  iris: {
    state: "warming",
    pull: 0.53,
    memory: 0.41,
    sharedOpen: false,
    openExpiresAt: null,
    note: "Something is warming quietly.",
  },
  vale: {
    state: "faded",
    pull: 0.22,
    memory: 0.17,
    sharedOpen: false,
    openExpiresAt: null,
    note: "A brief window closed.",
  },
};

const signalLogSeed = [
  "Hazel stayed present without replying",
  "Iris warmed a quiet route",
  "Nina reopened an intimate thread",
  "Vale let a window collapse",
];

// ---------------------------------------------------------
// APP STATE
// ---------------------------------------------------------

const appState = {
  page: "home",
  activeContact: "hazel",
  activeThread: "hazel",
};

// ---------------------------------------------------------
// DOM
// ---------------------------------------------------------

const navButtons = document.querySelectorAll("[data-nav]");
const pages = document.querySelectorAll(".page");

const menuToggle = document.getElementById("menuToggle");
const nav = document.getElementById("primaryNav");

const dmThread = document.getElementById("dmThread");
const dmName = document.getElementById("dmName");
const dmStatus = document.getElementById("dmStatus");
const dmAvatar = document.getElementById("dmAvatar");
const dmForm = document.getElementById("dmForm");
const dmInput = document.getElementById("dmInput");

const stats = {
  nodes: document.getElementById("statNodes"),
  rooms: document.getElementById("statRooms"),
  invites: document.getElementById("statInvites"),
};

const nodeRailList = document.getElementById("nodeRailList");
const presenceStack = document.getElementById("presenceStack");
const signalFeed = document.getElementById("signalFeed");

const hubSceneTitle = document.getElementById("hubSceneTitle");
const hubSceneCopy = document.getElementById("hubSceneCopy");
const sceneFocusAvatar = document.getElementById("sceneFocusAvatar");
const sceneFocusName = document.getElementById("sceneFocusName");
const sceneFocusPreview = document.getElementById("sceneFocusPreview");
const mainActivityStrip = document.getElementById("mainActivityStrip");

const spotlightAvatar = document.getElementById("spotlightAvatar");
const spotlightName = document.getElementById("spotlightName");
const spotlightStatus = document.getElementById("spotlightStatus");
const spotlightCopy = document.getElementById("spotlightCopy");
const spotlightTags = document.getElementById("spotlightTags");
const spotlightOpenBtn = document.getElementById("spotlightOpenBtn");

const quickOpenThreadBtn = document.getElementById("quickOpenThreadBtn");
const hubEnterFocusedBtn = document.getElementById("hubEnterFocusedBtn");

// ---------------------------------------------------------
// HELPERS
// ---------------------------------------------------------

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// ---------------------------------------------------------
// CONTOUR SYSTEM
// ---------------------------------------------------------

// Character identity hues (HSL base)
const CHAR_HUE = { nina: 264, hazel: 217, iris: 280, vale: 186 };

// Tone modifiers: how each tone bends the hue and shifts lightness
const TONE_MOD = {
  soft:     { hShift:  8, lShift:  8, sat: 70 },
  tender:   { hShift: 14, lShift: 12, sat: 65 },
  playful:  { hShift:-12, lShift:  6, sat: 85 },
  guarded:  { hShift: -6, lShift: -8, sat: 50 },
  cold:     { hShift:-20, lShift:-14, sat: 40 },
  neutral:  { hShift:  0, lShift:  0, sat: 55 },
};

function applyContour(el, charKey, toneClass = "neutral", subtextStrength = 0) {
  const hue = CHAR_HUE[charKey] ?? 260;
  const mod = TONE_MOD[toneClass] || TONE_MOD.neutral;

  const baseHue = hue + mod.hShift;
  const sat     = mod.sat;
  const light   = 62 + mod.lShift;
  const strength = Math.max(0, Math.min(1, Number(subtextStrength) || 0));

  const borderAlpha      = 0.48 + strength * 0.20;
  const glowAlpha        = 0.14 + strength * 0.10;
  const glowStrongAlpha  = 0.20 + strength * 0.12;
  const fillAlpha        = 0.02 + strength * 0.015;

  el.style.setProperty("--msg-hue-a",            `${baseHue - 22}`);
  el.style.setProperty("--msg-hue-b",            `${baseHue}`);
  el.style.setProperty("--msg-hue-c",            `${baseHue + 28}`);
  el.style.setProperty("--msg-sat",              `${sat}%`);
  el.style.setProperty("--msg-light",            `${light}%`);
  el.style.setProperty("--msg-border-alpha",     `${borderAlpha}`);
  el.style.setProperty("--msg-glow-alpha",       `${glowAlpha}`);
  el.style.setProperty("--msg-glow-strong-alpha",`${glowStrongAlpha}`);
  el.style.setProperty("--msg-fill-alpha",       `${fillAlpha}`);
}

function nowClock() {
  return new Date().toLocaleTimeString("no-NO", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getRelationship(contactKey) {
  return relationshipState[contactKey] || {
    state: "dormant",
    pull: 0,
    memory: 0,
    sharedOpen: false,
    openExpiresAt: null,
    note: "",
  };
}

function getStateLabel(state) {
  switch (state) {
    case "warming": return "WARMING";
    case "pull-active": return "PULL ACTIVE";
    case "opening": return "OPENING";
    case "open": return "OPEN NOW";
    case "faded": return "CLOSED";
    case "dormant":
    default: return "NO OPENING YET";
  }
}

function getContactCTA(state) {
  switch (state) {
    case "opening":
    case "open": return "ENTER SHARED SPACE";
    case "pull-active": return "FOLLOW SIGNAL";
    case "warming":
    case "faded":
    case "dormant":
    default: return "CONTINUE IN DMs";
  }
}

function canEnterSharedSpace(contactKey) {
  const rel = getRelationship(contactKey);
  return rel.state === "opening" || rel.state === "open";
}

function setActivePage(pageName) {
  appState.page = pageName;

  pages.forEach((page) => {
    page.classList.toggle("active", page.dataset.page === pageName);
  });

  document.querySelectorAll(".nav-link").forEach((button) => {
    button.classList.toggle("active", button.dataset.nav === pageName);
  });

  window.location.hash = pageName;

  if (nav?.classList.contains("open")) {
    nav.classList.remove("open");
    menuToggle?.setAttribute("aria-expanded", "false");
  }
}

function bootFromHash() {
  const hash = window.location.hash.replace("#", "");
  const valid = ["home", "hub", "rooms", "inbox", "routes"];
  setActivePage(valid.includes(hash) ? hash : "home");
}

function focusContact(contactKey) {
  if (!characterDirectory[contactKey]) return;
  appState.activeContact = contactKey;
  appState.activeThread = contactKey;

  renderPresenceStack();
  renderContactsPage();
  renderHub();
  renderHubChat();
  renderInbox();
  syncAvatarRings();

  // Fire an AI greeting when switching to a character in hub with no prior exchange
  const contact = characterDirectory[contactKey];
  const hasUserMessages = contact.messages.some((m) => m.side === "outgoing");
  if (!hasUserMessages && appState.page === "hub") {
    triggerCharacterGreeting(contactKey);
  }
}

async function triggerCharacterGreeting(contactKey) {
  const contact = characterDirectory[contactKey];
  if (!contact) return;

  // Show typing indicator
  contact.messages.push({ side: "incoming", text: "...", time: "", typing: true });
  renderHubChat();

  let reply = null, toneClass = "neutral", subtextStrength = 0;
  try {
    const res = await fetch(`/api/characters/${contactKey}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "__greeting__" }),
    });
    const data = await res.json();
    if (data?.ok) {
      reply = data.reply;
      toneClass = data.meta?.toneClass || "neutral";
      subtextStrength = data.meta?.subtextStrength || 0;
    }
  } catch { /* silent fallback */ }

  contact.messages = contact.messages.filter((m) => !m.typing);
  if (reply) {
    contact.messages.push({
      side: "incoming",
      text: reply,
      time: nowClock(),
      toneClass,
      subtextStrength,
      char: contactKey,
    });
  }
  renderHubChat();
  renderInbox();
}

function pushSignalEvent(text) {
  const item = document.createElement("div");
  item.className = "signal-item";
  item.innerHTML = `<strong>${escapeHtml(text)}</strong><time>${escapeHtml(nowClock())}</time>`;
  signalFeed?.prepend(item);

  if (signalFeed && signalFeed.children.length > 8) {
    signalFeed.lastElementChild?.remove();
  }
}

async function sendMessage(contactKey, text) {
  const contact = characterDirectory[contactKey];
  if (!contact || !text.trim()) return;

  contact.messages.push({
    side: "outgoing",
    text: text.trim(),
    time: nowClock(),
  });

  // Typing indicator
  contact.messages.push({ side: "incoming", text: "...", time: "", typing: true });
  renderInbox();

  let reply, toneClass, subtextStrength;
  try {
    const res = await fetch(`/api/characters/${contactKey}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text.trim() }),
    });
    const data = await res.json();
    reply = data?.ok ? data.reply : null;
    const meta = data?.meta || {};
    toneClass = meta?.toneClass || 'neutral';
    subtextStrength = typeof meta?.subtextStrength === 'number' ? meta.subtextStrength : 0;
  } catch {
    reply = null;
    toneClass = 'neutral';
    subtextStrength = 0;
  }

  // Remove typing indicator
  contact.messages = contact.messages.filter((m) => !m.typing);

  contact.messages.push({
    side: "incoming",
    text: reply || "...",
    time: nowClock(),
    toneClass,
    subtextStrength,
    char: contactKey,
  });

  const rel = getRelationship(contactKey);
  rel.memory = Math.min(1, rel.memory + 0.04);
  rel.pull = Math.min(1, rel.pull + 0.05);

  if (rel.pull > 0.75 && rel.state === "warming") {
    rel.state = "pull-active";
    pushSignalEvent(`${contact.name} moved closer`);
  }

  if (rel.pull > 0.9 && rel.state === "pull-active") {
    rel.state = "opening";
    pushSignalEvent(`${contact.name} opened something shared`);
  }

  renderHub();
  renderHubChat();
  renderContactsPage();
  renderInbox();
  syncAvatarRings();
}

// ---------------------------------------------------------
// RINGS
// ---------------------------------------------------------

const ringStateMap = {
  dormant: "locked",
  warming: "warming",
  "pull-active": "invited",
  opening: "invited",
  open: "open",
  faded: "expired",
};

function syncAvatarRings() {
  Object.keys(characterDirectory).forEach((contactKey) => {
    const rel = getRelationship(contactKey);
    const ringState = ringStateMap[rel.state] || "locked";

    document
      .querySelectorAll(`.avatar-ring[data-char="${contactKey}"]`)
      .forEach((ring) => {
        ring.dataset.ringState = ringState;
      });
  });
}

// ---------------------------------------------------------
// RENDER: HOME STATS
// ---------------------------------------------------------

function renderStats() {
  if (stats.nodes) stats.nodes.textContent = "12";
  if (stats.rooms) stats.rooms.textContent = String(Object.keys(characterDirectory).length);
  if (stats.invites) {
    const invites = Object.values(relationshipState).filter(
      (x) => x.state === "opening" || x.state === "open"
    ).length;
    stats.invites.textContent = String(invites);
  }
}

// ---------------------------------------------------------
// RENDER: HUB
// ---------------------------------------------------------

function renderPresenceStack() {
  if (!presenceStack) return;

  const buttons = presenceStack.querySelectorAll("[data-room]");
  buttons.forEach((button) => {
    const room = button.dataset.room;
    button.classList.toggle("active", room === appState.activeContact);
  });
}

function renderHub() {
  const contactKey = appState.activeContact;
  const contact = characterDirectory[contactKey];
  const rel = getRelationship(contactKey);

  if (!contact) return;

  if (hubSceneTitle) hubSceneTitle.textContent = contact.scene;
  if (hubSceneCopy) hubSceneCopy.textContent = contact.sceneCopy;

  if (sceneFocusAvatar) {
    sceneFocusAvatar.textContent = contact.avatar;
    sceneFocusAvatar.className = `avatar avatar-${contact.key}`;
  }

  if (sceneFocusName) sceneFocusName.textContent = contact.name;
  if (sceneFocusPreview) sceneFocusPreview.textContent = contact.preview;

  if (spotlightAvatar) {
    spotlightAvatar.textContent = contact.avatar;
    spotlightAvatar.className = `avatar avatar-${contact.key}`;
  }

  if (spotlightName) spotlightName.textContent = contact.name;
  if (spotlightStatus) spotlightStatus.textContent = getStateLabel(rel.state);
  if (spotlightCopy) spotlightCopy.textContent = rel.note || contact.mood;

  if (spotlightTags) {
    spotlightTags.innerHTML = "";
    contact.tags.forEach((tag) => {
      const span = document.createElement("span");
      span.className = "activity-chip";
      span.textContent = tag;
      spotlightTags.appendChild(span);
    });
  }

  if (spotlightOpenBtn) {
    spotlightOpenBtn.textContent = getContactCTA(rel.state);
  }

  if (mainActivityStrip) {
    mainActivityStrip.innerHTML = "";

    const chips = [
      `${getStateLabel(rel.state)}`,
      `PULL ${(rel.pull * 100).toFixed(0)}%`,
      `MEMORY ${(rel.memory * 100).toFixed(0)}%`,
      `${contact.name.toUpperCase()} SELECTED`,
    ];

    chips.forEach((chipText) => {
      const chip = document.createElement("span");
      chip.className = "activity-chip";
      chip.textContent = chipText;
      mainActivityStrip.appendChild(chip);
    });
  }
}

// ---------------------------------------------------------
// RENDER: CONTACTS PAGE
// ---------------------------------------------------------

function renderContactsPage() {
  const cards = document.querySelectorAll(".room-card");

  cards.forEach((card) => {
    const contactKey = card.dataset.room;
    const contact = characterDirectory[contactKey];
    const rel = getRelationship(contactKey);
    const cta = card.querySelector(".room-cta");
    const stateText = card.querySelector(".room-access-state");
    const moodText = card.querySelector(".room-mood");

    if (!contact || !cta || !stateText || !moodText) return;

    card.dataset.state = rel.state;
    stateText.textContent = getStateLabel(rel.state);
    moodText.textContent = rel.note || contact.preview;
    cta.textContent = getContactCTA(rel.state);

    cta.onclick = (event) => {
      event.preventDefault();

      focusContact(contactKey);

      if (canEnterSharedSpace(contactKey)) {
        setActivePage("hub");
        pushSignalEvent(`${contact.name} opened a shared space`);
      } else {
        setActivePage("inbox");
        pushSignalEvent(`${contact.name} redirected to DMs`);
      }
    };
  });
}

// ---------------------------------------------------------
// RENDER: SIGNAL FEED
// ---------------------------------------------------------

function renderSignalFeed() {
  if (!signalFeed) return;
  signalFeed.innerHTML = "";

  signalLogSeed.forEach((entry) => {
    const item = document.createElement("div");
    item.className = "signal-item";
    item.innerHTML = `<strong>${escapeHtml(entry)}</strong><time>just now</time>`;
    signalFeed.appendChild(item);
  });
}

// ---------------------------------------------------------
// RENDER: THREAD RAIL
// ---------------------------------------------------------

function renderThreadRail() {
  if (!nodeRailList) return;

  nodeRailList.innerHTML = "";

  Object.keys(characterDirectory).forEach((contactKey, index) => {
    const contact = characterDirectory[contactKey];
    const rel = getRelationship(contactKey);
    const latest = contact.messages[contact.messages.length - 1];

    const button = document.createElement("button");
    button.type = "button";
    button.dataset.thread = contactKey;
    button.dataset.index = String(index + 1);
    button.className = "node-strip";
    button.classList.toggle("active", appState.activeThread === contactKey);

    button.innerHTML = `
      <div class="avatar-ring" data-char="${escapeHtml(contactKey)}" data-ring-state="${escapeHtml(ringStateMap[rel.state] || "locked")}">
        <div class="avatar avatar-${escapeHtml(contactKey)} ns-avatar">${escapeHtml(contact.avatar)}</div>
      </div>
      <div class="ns-body">
        <div class="ns-name-row">
          <strong class="ns-name">${escapeHtml(contact.name)}</strong>
          <span class="ns-time">${escapeHtml(latest?.time || "now")}</span>
        </div>
        <p class="ns-preview">${escapeHtml(latest?.text || contact.preview)}</p>
        <span class="ns-state-tag">${escapeHtml(getStateLabel(rel.state))}</span>
      </div>
    `;

    button.addEventListener("click", () => {
      focusContact(contactKey);
      setActivePage("inbox");
    });

    nodeRailList.appendChild(button);
  });
}

// ---------------------------------------------------------
// RENDER: INBOX
// ---------------------------------------------------------

function renderInbox() {
  const contactKey = appState.activeThread;
  const contact = characterDirectory[contactKey];
  const rel = getRelationship(contactKey);

  if (!contact || !dmThread) return;

  renderThreadRail();

  if (dmName) dmName.textContent = `${contact.name}`;
  if (dmStatus) dmStatus.textContent = getStateLabel(rel.state);

  if (dmAvatar) {
    dmAvatar.textContent = contact.avatar;
    dmAvatar.className = `avatar avatar-${contact.key}`;
  }

  dmThread.innerHTML = "";

  contact.messages.forEach((message, index) => {
    const bubble = document.createElement("div");
    const latest = index === contact.messages.length - 1;

    bubble.className = [
      "chat-bubble",
      message.side,
      latest ? "is-latest" : "",
      message.typing ? "typing" : "",
    ].filter(Boolean).join(" ");

    if (message.side === "incoming") {
      bubble.dataset.char    = contactKey;
      bubble.dataset.tone    = message.toneClass || "neutral";
      bubble.dataset.subtext = String(message.subtextStrength ?? 0);
      // expose numeric subtext to CSS and apply JS contour for fine control
      bubble.style.setProperty('--subtext', String(message.subtextStrength ?? 0));
      applyContour(bubble, contactKey, message.toneClass || "neutral", message.subtextStrength ?? 0);
    }

    bubble.innerHTML = `
      <p>${escapeHtml(message.text)}</p>
      ${message.typing ? "" : `<time>${escapeHtml(message.time)}</time>`}
    `;
    dmThread.appendChild(bubble);
  });

  dmThread.scrollTop = dmThread.scrollHeight;
}

// ---------------------------------------------------------
// EVENTS
// ---------------------------------------------------------

navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const target = button.dataset.nav;
    if (!target) return;
    setActivePage(target);
  });
});

menuToggle?.addEventListener("click", () => {
  const expanded = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!expanded));
  nav?.classList.toggle("open");
});

presenceStack?.querySelectorAll("[data-room]").forEach((button) => {
  button.addEventListener("click", () => {
    const contactKey = button.dataset.room;
    if (!contactKey) return;
    focusContact(contactKey);
  });
});

quickOpenThreadBtn?.addEventListener("click", () => {
  setActivePage("inbox");
});

hubEnterFocusedBtn?.addEventListener("click", () => {
  setActivePage("inbox");
});

spotlightOpenBtn?.addEventListener("click", () => {
  const active = appState.activeContact;
  if (canEnterSharedSpace(active)) {
    pushSignalEvent(`${characterDirectory[active].name} shared space entered`);
    setActivePage("hub");
    return;
  }
  setActivePage("inbox");
});

dmForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!dmInput) return;

  const text = dmInput.value.trim();
  if (!text) return;

  sendMessage(appState.activeThread, text);
  dmInput.value = "";
});

// ---------------------------------------------------------
// HUB CHAT
// ---------------------------------------------------------

const hubChatThread = document.getElementById("hubChatThread");
const hubChatForm   = document.getElementById("hubChatForm");
const hubChatInput  = document.getElementById("hubChatInput");
const hubFocusRing  = document.getElementById("hubFocusRing");

function renderHubChat() {
  const contactKey = appState.activeContact;
  const contact    = characterDirectory[contactKey];
  if (!contact || !hubChatThread) return;

  // Update header
  const nameEl   = document.getElementById("sceneFocusName");
  const statusEl = document.getElementById("hubSceneTitle");
  if (nameEl)   nameEl.textContent = contact.name;
  if (statusEl) statusEl.textContent = getStateLabel(getRelationship(contactKey).state);

  if (hubFocusRing) {
    hubFocusRing.dataset.char      = contactKey;
    hubFocusRing.dataset.ringState = ringStateMap[getRelationship(contactKey).state] || "locked";
    const avatarEl = hubFocusRing.querySelector(".avatar");
    if (avatarEl) {
      avatarEl.className = `avatar avatar-${contactKey}`;
      avatarEl.textContent = contact.avatar;
    }
  }

  // Render last 8 messages
  hubChatThread.innerHTML = "";
  const msgs = contact.messages.slice(-8);
  msgs.forEach((message, i) => {
    const bubble = document.createElement("div");
    const latest = i === msgs.length - 1;
    bubble.className = [
      "chat-bubble",
      message.side,
      latest ? "is-latest" : "",
      message.typing ? "typing" : "",
    ].filter(Boolean).join(" ");

    if (message.side === "incoming") {
      applyContour(bubble, contactKey, message.toneClass || "neutral", message.subtextStrength ?? 0);
    }

    bubble.innerHTML = `<p>${escapeHtml(message.text)}</p>${message.typing ? "" : `<time>${escapeHtml(message.time)}</time>`}`;
    hubChatThread.appendChild(bubble);
  });

  hubChatThread.scrollTop = hubChatThread.scrollHeight;
}

hubChatForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = hubChatInput?.value.trim();
  if (!text) return;
  hubChatInput.value = "";
  await sendMessage(appState.activeContact, text);
  renderHubChat();
});

// ---------------------------------------------------------
// INIT
// ---------------------------------------------------------

function init() {
  bootFromHash();
  renderStats();
  renderSignalFeed();
  renderPresenceStack();
  renderContactsPage();
  renderHub();
  renderHubChat();
  renderInbox();
  syncAvatarRings();
}

window.addEventListener("hashchange", bootFromHash);
window.addEventListener("DOMContentLoaded", init);

// ---------------------------------------------------------
// PROFILES LIGHTBOX
// ---------------------------------------------------------

(function () {
  const lb    = document.getElementById("profilesLightbox");
  const lbImg = document.getElementById("profilesLightboxImg");
  const lbClose = document.getElementById("profilesLightboxClose");
  if (!lb || !lbImg || !lbClose) return;

  function openLb(src) {
    lbImg.src = src;
    lb.setAttribute("aria-hidden", "false");
  }
  function closeLb() {
    lb.setAttribute("aria-hidden", "true");
    lbImg.src = "";
  }

  document.getElementById("profilesGallery")?.addEventListener("click", (e) => {
    const btn = e.target.closest(".profiles-shot");
    if (btn) openLb(btn.dataset.src);
  });

  lbClose.addEventListener("click", closeLb);
  lb.addEventListener("click", (e) => { if (e.target === lb) closeLb(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && lb.getAttribute("aria-hidden") === "false") closeLb(); });

  // MESSAGE buttons on profile cards → navigate to inbox with correct contact
  document.querySelectorAll(".profile-card .btn[data-contact]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const contact = btn.dataset.contact;
      if (contact) {
        focusContact(contact);
        navigateTo("inbox");
      }
    });
  });
})();
