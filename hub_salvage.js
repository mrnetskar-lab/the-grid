/* =========================================================
   HUB SALVAGE LAYER
   Uses existing appState + characterDirectory + relationshipState
   and targets the salvaged Hub HTML structure.
   ========================================================= */

const hubEls = {
  page: document.getElementById("hub"),
  nodeCount: document.getElementById("hubNodeCount"),
  search: document.getElementById("hubSearchInput"),
  rail: document.getElementById("presenceStack"),

  chatHead: document.getElementById("hubChatHead"),
  focusRing: document.getElementById("hubFocusRing"),
  focusImg: document.getElementById("hubFocusImg"),
  focusRoute: document.getElementById("hubFocusRoute"),
  focusWhisper: document.getElementById("hubFocusWhisper"),
  focusTone: document.getElementById("hubFocusTone"),
  focusTyping: document.getElementById("hubFocusTyping"),
  focusIdle: document.getElementById("hubFocusIdle"),

  sceneTitle: document.getElementById("hubSceneTitle"),
  sceneCopy: document.getElementById("hubSceneCopy"),
  sceneFocusAvatar: document.getElementById("sceneFocusAvatar"),
  sceneFocusName: document.getElementById("sceneFocusName"),
  sceneFocusPreview: document.getElementById("sceneFocusPreview"),
  mainActivityStrip: document.getElementById("mainActivityStrip"),

  thread: document.getElementById("hubChatThread"),
  form: document.getElementById("hubChatForm"),
  input: document.getElementById("hubChatInput"),

  dossier: document.getElementById("hubDossier"),
  hdPortrait: document.getElementById("hdPortrait"),
  hdEyebrow: document.getElementById("hdEyebrow"),
  hdName: document.getElementById("hdName"),
  hdBio: document.getElementById("hdBio"),
  hdPullBar: document.getElementById("hdPullBar"),
  hdPullVal: document.getElementById("hdPullVal"),
  hdMemoryBar: document.getElementById("hdMemoryBar"),
  hdMemoryVal: document.getElementById("hdMemoryVal"),
  hdContradiction: document.getElementById("hdContradiction"),
  hdWeakness: document.getElementById("hdWeakness"),
  hdRule: document.getElementById("hdRule"),

  spotlightAvatar: document.getElementById("spotlightAvatar"),
  spotlightName: document.getElementById("spotlightName"),
  spotlightStatus: document.getElementById("spotlightStatus"),
  spotlightCopy: document.getElementById("spotlightCopy"),
  spotlightTags: document.getElementById("spotlightTags"),
  spotlightOpenBtn: document.getElementById("spotlightOpenBtn"),

  quickOpenThreadBtn: document.getElementById("quickOpenThreadBtn"),
  enterFocusedBtn: document.getElementById("hubEnterFocusedBtn"),
};

const HUB_TONE_FALLBACK = {
  warming: "soft",
  "pull-active": "guarded",
  pull: "guarded",
  invited: "guarded",
  open: "tender",
  opening: "tender",
  faded: "cold",
  dormant: "neutral",
};

const HUB_TONE_MOD = {
  soft:    { hShift: 8,   border: 0.34, glow: 0.10 },
  tender:  { hShift: 14,  border: 0.38, glow: 0.14 },
  playful: { hShift: -12, border: 0.40, glow: 0.16 },
  guarded: { hShift: -6,  border: 0.30, glow: 0.08 },
  cold:    { hShift: -20, border: 0.26, glow: 0.06 },
  neutral: { hShift: 0,   border: 0.28, glow: 0.10 },
};

function getHubKeys() {
  return Object.keys(characterDirectory || {});
}

function getHubActiveKey() {
  if (appState?.activeContact && characterDirectory?.[appState.activeContact]) {
    return appState.activeContact;
  }
  const keys = getHubKeys();
  return keys[0] || "hazel";
}

function getHubCharacter(key = getHubActiveKey()) {
  return characterDirectory?.[key] || null;
}

function getHubRelationship(key = getHubActiveKey()) {
  return relationshipState?.[key] || {
    state: "warming", pull: 0.5, memory: 0.5,
    sharedOpen: false, openExpiresAt: null, note: "",
  };
}

function getHubAnchors(key = getHubActiveKey()) {
  return characterAnchors?.[key] || { contradiction: "", weakness: "", rule: "" };
}

function hubStatusLabel(key) {
  const c = getHubCharacter(key);
  return String(c?.status || "ONLINE").toUpperCase();
}

function hubPreviewCopy(key) {
  const c = getHubCharacter(key);
  const msgs = Array.isArray(c?.messages) ? c.messages : [];
  return c?.preview || msgs[msgs.length - 1]?.text || "";
}

function hubStateLabel(rawState) {
  const state = String(rawState || "").toLowerCase();
  if (state === "pull-active" || state === "pull") return "PULL ACTIVE";
  if (state === "open") return "OPEN";
  if (state === "opening") return "OPENING";
  if (state === "faded") return "FADED";
  if (state === "dormant") return "DORMANT";
  return "WARMING";
}

function hubRingState(key) {
  const rel = getHubRelationship(key);
  if (rel?.sharedOpen) return "open";
  if (rel?.state === "pull-active") return "pull";
  return rel?.state || "warming";
}

function hubToneForCharacter(key) {
  const rel = getHubRelationship(key);
  return HUB_TONE_FALLBACK[rel?.state] || "neutral";
}

function hubHueForCharacter(key, tone = hubToneForCharacter(key)) {
  const c = getHubCharacter(key);
  const baseHue = Number(c?.hue ?? 264);
  const mod = HUB_TONE_MOD[tone] || HUB_TONE_MOD.neutral;
  return baseHue + mod.hShift;
}

function setHubChannelHue(key) {
  document.documentElement.style.setProperty("--channel-hue", String(hubHueForCharacter(key)));
}

function hubMessageTone(msg, key) {
  const explicitTone = msg?.toneClass || msg?.tone;
  if (explicitTone && HUB_TONE_MOD[explicitTone]) return explicitTone;
  return hubToneForCharacter(key);
}

function hubBubbleStyle(msg, key) {
  const tone = hubMessageTone(msg, key);
  const c = getHubCharacter(key);
  const baseHue = Number(c?.hue ?? 264);
  const mod = HUB_TONE_MOD[tone] || HUB_TONE_MOD.neutral;
  const msgHue = baseHue + mod.hShift;
  return `--msg-hue:${msgHue};--msg-border-alpha:${mod.border};--msg-glow-alpha:${mod.glow}`;
}

function hubIsTyping(key) {
  return Boolean(getHubCharacter(key)?.typing);
}

function hubGoToPage(page) {
  const btn = document.querySelector(`[data-nav="${page}"]`);
  if (btn) { btn.click(); return; }
  if (appState) appState.page = page;
  document.querySelectorAll(".page").forEach((node) => {
    node.classList.toggle("active", node.id === page);
  });
  document.querySelectorAll("[data-nav]").forEach((node) => {
    node.classList.toggle("active", node.getAttribute("data-nav") === page);
  });
}

function renderHubRail(filterText = "") {
  if (!hubEls.rail) return;
  const query = String(filterText || "").trim().toLowerCase();
  const activeKey = getHubActiveKey();
  const keys = getHubKeys().filter((key) => {
    if (!query) return true;
    const c = getHubCharacter(key);
    return [c?.name, c?.preview, c?.whisper, c?.status, c?.route, hubPreviewCopy(key)]
      .filter(Boolean).join(" ").toLowerCase().includes(query);
  });

  hubEls.rail.innerHTML = keys.map((key) => {
    const c = getHubCharacter(key);
    const isActive = key === activeKey;
    return `
      <button type="button" class="hub-contact-row${isActive ? " active" : ""}"
        data-room="${escapeHtml(key)}" data-active="${isActive}"
        style="--ch-hue:${Number(c?.hue ?? 264)};"
        ${isActive ? 'aria-current="true"' : ""}>
        <span class="hub-contact-avatar">
          ${c?.img ? `<img src="${escapeHtml(c.img)}" alt="" onerror="this.remove()" />` : ""}
          <span class="hub-contact-initial">${escapeHtml(c?.avatar || c?.name?.[0] || "?")}</span>
        </span>
        <div class="hub-contact-info">
          <span class="hub-contact-name">${escapeHtml(c?.name || key)}</span>
          <span class="hub-contact-preview" data-contact-preview="${escapeHtml(key)}">${escapeHtml(hubPreviewCopy(key))}</span>
        </div>
        <span class="hub-contact-time">${escapeHtml(hubStatusLabel(key))}</span>
        <span class="hub-contact-divider"></span>
      </button>`;
  }).join("");

  if (hubEls.nodeCount) hubEls.nodeCount.textContent = String(keys.length);
}

function renderHubHero() {
  const key = getHubActiveKey();
  const c = getHubCharacter(key);
  const rel = getHubRelationship(key);
  const tone = hubToneForCharacter(key);
  const ring = hubRingState(key);
  if (!c) return;

  setHubChannelHue(key);

  if (hubEls.focusRing) {
    hubEls.focusRing.setAttribute("data-ring", ring);
    hubEls.focusRing.setAttribute("data-ring-state", ring);
    hubEls.focusRing.setAttribute("data-char", key);
    hubEls.focusRing.style.setProperty("--ch-hue", String(Number(c.hue ?? 264)));
  }
  if (hubEls.focusImg && c.img) { hubEls.focusImg.src = c.img; hubEls.focusImg.alt = `${c.name} portrait`; }
  if (hubEls.focusRoute) hubEls.focusRoute.textContent = c.route || "";
  if (hubEls.sceneFocusName) hubEls.sceneFocusName.textContent = c.name || "";
  if (hubEls.focusWhisper) hubEls.focusWhisper.textContent = c.whisper || "";
  if (hubEls.sceneTitle) hubEls.sceneTitle.textContent = hubStateLabel(rel.state);
  if (hubEls.focusTone) hubEls.focusTone.textContent = String(tone).toUpperCase();

  const typing = hubIsTyping(key);
  if (hubEls.focusTyping) hubEls.focusTyping.style.display = typing ? "inline-flex" : "none";
  if (hubEls.focusIdle) hubEls.focusIdle.style.display = typing ? "none" : "inline";
  if (hubEls.sceneCopy) hubEls.sceneCopy.textContent = c.sceneCopy || rel.note || c.mood || "";
  if (hubEls.sceneFocusPreview) hubEls.sceneFocusPreview.textContent = c.preview || hubPreviewCopy(key);
  if (hubEls.spotlightAvatar) hubEls.spotlightAvatar.textContent = c.avatar || c.name?.[0] || "";
  if (hubEls.spotlightName) hubEls.spotlightName.textContent = c.name || "";
  if (hubEls.spotlightStatus) hubEls.spotlightStatus.textContent = c.status || "";
  if (hubEls.spotlightCopy) hubEls.spotlightCopy.textContent = c.sceneCopy || rel.note || "";
  if (hubEls.spotlightTags) hubEls.spotlightTags.textContent = Array.isArray(c.tags) ? c.tags.join(" · ") : "";
  if (hubEls.sceneFocusAvatar) hubEls.sceneFocusAvatar.textContent = c.avatar || c.name?.[0] || "";
}

function renderHubThread() {
  if (!hubEls.thread) return;
  const key = getHubActiveKey();
  const c = getHubCharacter(key);
  const messages = Array.isArray(c?.messages) ? c.messages : [];

  hubEls.thread.innerHTML = messages.map((msg) => {
    const sideRaw = String(msg?.side || "incoming").toLowerCase();
    const side = sideRaw === "outgoing" || sideRaw === "out" ? "outgoing" : "incoming";
    const style = side === "incoming" ? ` style="${hubBubbleStyle(msg, key)}"` : "";
    return `<div class="bubble ${side}" data-side="${side}"${style}>
      <p>${escapeHtml(msg?.text || "")}</p>
      <time>${escapeHtml(msg?.time || "")}</time>
    </div>`;
  }).join("");

  hubEls.thread.scrollTop = hubEls.thread.scrollHeight;
}

function renderHubDossier() {
  const key = getHubActiveKey();
  const c = getHubCharacter(key);
  const rel = getHubRelationship(key);
  const anchors = getHubAnchors(key);
  if (!c) return;

  if (hubEls.hdPortrait && c.img) { hubEls.hdPortrait.src = c.img; hubEls.hdPortrait.alt = `${c.name} dossier portrait`; }
  if (hubEls.hdEyebrow) hubEls.hdEyebrow.textContent = c.route || "";
  if (hubEls.hdName) hubEls.hdName.textContent = c.name || "";
  if (hubEls.hdBio) hubEls.hdBio.textContent = rel.note || c.bio || c.whisper || "";
  if (hubEls.hdPullBar) hubEls.hdPullBar.style.setProperty("--v", String(Number(rel.pull || 0)));
  if (hubEls.hdPullVal) hubEls.hdPullVal.textContent = String(Math.round(Number(rel.pull || 0) * 100));
  if (hubEls.hdMemoryBar) hubEls.hdMemoryBar.style.setProperty("--v", String(Number(rel.memory || 0)));
  if (hubEls.hdMemoryVal) hubEls.hdMemoryVal.textContent = String(Math.round(Number(rel.memory || 0) * 100));
  if (hubEls.hdContradiction) hubEls.hdContradiction.textContent = anchors.contradiction || "";
  if (hubEls.hdWeakness) hubEls.hdWeakness.textContent = anchors.weakness || "";
  if (hubEls.hdRule) hubEls.hdRule.textContent = anchors.rule || "";
}

function renderHubActivityStrip() {
  if (!hubEls.mainActivityStrip) return;
  const key = getHubActiveKey();
  const c = getHubCharacter(key);
  const rel = getHubRelationship(key);
  hubEls.mainActivityStrip.textContent = [
    c?.status || "",
    hubStateLabel(rel.state),
    `${Math.round(Number(rel.pull || 0) * 100)}% pull`,
    `${Math.round(Number(rel.memory || 0) * 100)}% memory`,
  ].filter(Boolean).join(" · ");
}

function renderHubSalvage() {
  if (!hubEls.page) return;
  renderHubRail(hubEls.search?.value || "");
  renderHubHero();
  renderHubThread();
  renderHubDossier();
  renderHubActivityStrip();
}

function setHubActiveCharacter(key) {
  if (!characterDirectory?.[key]) return;
  appState.activeContact = key;
  appState.activeThread = key;
  renderHubSalvage();
}

function bindHubRailClicks() {
  if (!hubEls.rail || hubEls.rail.dataset.bound === "true") return;
  hubEls.rail.dataset.bound = "true";
  hubEls.rail.addEventListener("click", (event) => {
    const btn = event.target.closest(".hub-contact-row[data-room]");
    if (!btn) return;
    setHubActiveCharacter(btn.getAttribute("data-room"));
  });
}

function bindHubSearch() {
  if (!hubEls.search || hubEls.search.dataset.bound === "true") return;
  hubEls.search.dataset.bound = "true";
  hubEls.search.addEventListener("input", () => renderHubRail(hubEls.search.value));
}

function bindHubComposer() {
  if (!hubEls.form || hubEls.form.dataset.bound === "true") return;
  hubEls.form.dataset.bound = "true";

  hubEls.form.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = String(hubEls.input?.value || "").trim();
    if (!text) return;

    const key = getHubActiveKey();
    appState.activeContact = key;
    appState.activeThread = key;

    const dmInputEl = document.getElementById("dmInput");
    const dmFormEl = document.getElementById("dmForm");
    if (dmInputEl && dmFormEl) {
      dmInputEl.value = text;
      if (typeof dmFormEl.requestSubmit === "function") {
        dmFormEl.requestSubmit();
      } else {
        dmFormEl.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      }
      if (hubEls.input) hubEls.input.value = "";
      setTimeout(() => renderHubSalvage(), 80);
      return;
    }

    const c = getHubCharacter(key);
    if (!Array.isArray(c.messages)) c.messages = [];
    c.messages.push({ side: "outgoing", text, time: "now" });
    if (hubEls.input) hubEls.input.value = "";
    renderHubThread();
  });
}

function bindHubActions() {
  [hubEls.enterFocusedBtn, hubEls.quickOpenThreadBtn, hubEls.spotlightOpenBtn].forEach((btn) => {
    if (!btn || btn.dataset.bound === "true") return;
    btn.dataset.bound = "true";
    btn.addEventListener("click", () => {
      appState.activeThread = getHubActiveKey();
      hubGoToPage("inbox");
    });
  });
}

function initHubSalvage() {
  if (!hubEls.page) return;
  bindHubRailClicks();
  bindHubSearch();
  bindHubComposer();
  bindHubActions();
  renderHubSalvage();
}

window.renderHubSalvage = renderHubSalvage;
window.initHubSalvage = initHubSalvage;
