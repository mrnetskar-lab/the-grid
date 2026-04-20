const sidebar = document.getElementById("sidebar");
const menuBtn = document.getElementById("menuBtn");
const sidebarBackdrop = document.getElementById("sidebarBackdrop");
const navButtons = document.querySelectorAll("[data-view-target]");
const jumpButtons = document.querySelectorAll("[data-view-jump]");
const views = {
  home: document.getElementById("view-home"),
  discover: document.getElementById("view-discover"),
  chat: document.getElementById("view-chat"),
  gallery: document.getElementById("view-gallery")
};

const mobileMq = window.matchMedia("(max-width: 980px)");

function closeSidebar() {
  sidebar?.classList.remove("open");
  document.body.classList.remove("sidebar-open");
  menuBtn?.setAttribute("aria-expanded", "false");
}

function openSidebar() {
  sidebar?.classList.add("open");
  document.body.classList.add("sidebar-open");
  menuBtn?.setAttribute("aria-expanded", "true");
}

function toggleSidebar() {
  if (!sidebar || !mobileMq.matches) return;
  if (sidebar.classList.contains("open")) {
    closeSidebar();
  } else {
    openSidebar();
  }
}

function setActiveView(name) {
  Object.entries(views).forEach(([key, view]) => {
    view.classList.toggle("active", key === name);
  });

  navButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.viewTarget === name);
  });

  closeSidebar();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

navButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    setActiveView(btn.dataset.viewTarget);
  });
});

jumpButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    setActiveView(btn.dataset.viewJump);
  });
});

menuBtn?.addEventListener("click", toggleSidebar);
sidebarBackdrop?.addEventListener("click", closeSidebar);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeSidebar();
});

mobileMq.addEventListener("change", (event) => {
  if (!event.matches) closeSidebar();
});

const filterPills = document.querySelectorAll(".filter-pill");
filterPills.forEach((pill) => {
  pill.addEventListener("click", () => {
    filterPills.forEach((item) => item.classList.remove("active"));
    pill.classList.add("active");
  });
});

const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const chatBody = document.getElementById("chatBody");

function appendMessage(text) {
  const row = document.createElement("div");
  row.className = "msg-row me";

  const wrapper = document.createElement("div");

  const bubble = document.createElement("div");
  bubble.className = "bubble me";
  bubble.textContent = text;

  const time = document.createElement("div");
  time.className = "msg-time";

  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  time.textContent = `${hours}:${minutes}`;

  wrapper.appendChild(bubble);
  wrapper.appendChild(time);
  row.appendChild(wrapper);
  chatBody.appendChild(row);
  chatBody.scrollTop = chatBody.scrollHeight;

  setTimeout(() => {
    const replyRow = document.createElement("div");
    replyRow.className = "msg-row";

    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.style.width = "34px";
    avatar.style.height = "34px";

    const replyWrap = document.createElement("div");
    const replyBubble = document.createElement("div");
    replyBubble.className = "bubble them";
    replyBubble.textContent =
      "That message flow works well for the mockup — clean, intimate, and premium.";

    const replyTime = document.createElement("div");
    replyTime.className = "msg-time";
    replyTime.textContent = `${hours}:${minutes}`;

    replyWrap.appendChild(replyBubble);
    replyWrap.appendChild(replyTime);
    replyRow.appendChild(avatar);
    replyRow.appendChild(replyWrap);

    chatBody.appendChild(replyRow);
    chatBody.scrollTop = chatBody.scrollHeight;
  }, 600);
}

chatForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;
  appendMessage(text);
  chatInput.value = "";
  chatInput.focus();
});
