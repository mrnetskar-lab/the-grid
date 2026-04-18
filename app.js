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
  renderInbox();
  syncAvatarRings();
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

  let reply;
  try {
    const res = await fetch(`/api/characters/${contactKey}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text.trim() }),
    });
    const data = await res.json();
    reply = data.ok ? data.reply : null;
  } catch {
    reply = null;
  }

  // Remove typing indicator
  contact.messages = contact.messages.filter((m) => !m.typing);

  contact.messages.push({
    side: "incoming",
    text: reply || "...",
    time: nowClock(),
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

    bubble.className = `chat-bubble ${message.side}${latest ? " is-latest" : ""}${message.typing ? " typing" : ""}`;
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
// INIT
// ---------------------------------------------------------

function init() {
  bootFromHash();
  renderStats();
  renderSignalFeed();
  renderPresenceStack();
  renderContactsPage();
  renderHub();
  renderInbox();
  syncAvatarRings();
}

window.addEventListener("hashchange", bootFromHash);
window.addEventListener("DOMContentLoaded", init);
