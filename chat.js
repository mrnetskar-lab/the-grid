(function initVeloraChat(global) {
  const MAX_CHAT_IMAGE_BYTES = 5 * 1024 * 1024;
  const IMG_REACTIONS = [
    'You look stunning in this.',
    'I like this side of you.',
    'Now that is hard to ignore.',
    'You always know how to get my attention.'
  ];

  let currentThread = 'hazel';
  let currentAvatar = '/profile_pictures/hazel.png';
  let currentPersona = '';

  function getConfig() {
    return global.VeloraChatConfig || {};
  }

  function getCharacters() {
    const fromConfig = getConfig().getCharacters?.();
    if (fromConfig && typeof fromConfig === 'object' && Object.keys(fromConfig).length) return fromConfig;
    const fallback = global.VeloraCharacters?.loadCharacters?.() || global.VeloraCharacters?.DEFAULT_CHARACTERS || {};
    return fallback && typeof fallback === 'object' ? fallback : {};
  }

  function getApiJson() {
    if (typeof global.VeloraApi?.apiJson === 'function') return global.VeloraApi.apiJson;
    return async (url, options = {}) => {
      const response = await fetch(url, options);
      const raw = await response.text();
      const isJson = (response.headers.get('content-type') || '').toLowerCase().includes('application/json');
      let data = null;
      if (raw && isJson) {
        try { data = JSON.parse(raw); } catch { throw new Error('Invalid JSON from server'); }
      } else if (raw && !isJson) {
        const preview = raw.replace(/\s+/g, ' ').slice(0, 160);
        throw new Error(`Expected JSON from ${url}, got ${response.headers.get('content-type') || 'unknown'}: ${preview}`);
      }
      if (!response.ok || data?.ok === false) throw new Error(data?.error || `Request failed: ${response.status}`);
      return data || { ok: true };
    };
  }

  function getMessageState() {
    return global.VeloraState?.messageState || {};
  }

  function getChatEls() {
    return {
      chatMsgs: document.getElementById('chatMsgs'),
      chatAv: document.getElementById('chatAv'),
      chatName: document.getElementById('chatName'),
      chatStatus: document.getElementById('chatStatus')
    };
  }

  function ts() {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }

  function renderChat(options = {}) {
    const { clear = false, side = 'theirs', text = '', avSrc = '', extraEl = null } = options;
    const { chatMsgs } = getChatEls();
    if (!chatMsgs) return null;

    if (clear) {
      chatMsgs.innerHTML = '';
      return null;
    }

    const row = document.createElement('div');
    row.className = 'msg' + (side === 'mine' ? ' mine' : '');

    if (side !== 'mine') {
      const avatar = document.createElement('img');
      avatar.src = avSrc;
      avatar.className = 'msg-av';
      avatar.alt = '';
      row.appendChild(avatar);
    }

    const wrap = document.createElement('div');
    const bubble = document.createElement('div');
    const time = document.createElement('div');
    const isMedia = !text && extraEl && extraEl.tagName === 'IMG';

    bubble.className = 'bubble ' + (isMedia ? 'media' : (side === 'mine' ? 'mine' : 'theirs'));

    if (text) {
      const escaped = String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      const actionColor = side !== 'mine' ? '#7a5c3a' : '#f0c8b0';
      bubble.innerHTML = escaped.replace(/\*([^*]+)\*/g, `<span style="color:${actionColor};font-style:italic">*$1*</span>`);
    }

    if (extraEl) bubble.appendChild(extraEl);

    time.className = 'msg-time';
    time.textContent = ts();
    if (side === 'mine') time.style.textAlign = 'right';

    wrap.appendChild(bubble);
    wrap.appendChild(time);
    row.appendChild(wrap);
    chatMsgs.appendChild(row);
    chatMsgs.scrollTop = chatMsgs.scrollHeight;
    return row;
  }

  function addTyping(avSrc) {
    const row = renderChat({ side: 'theirs', text: '', avSrc });
    if (!row) return null;
    row.id = 'trow';

    const bubble = row.querySelector('.bubble');
    if (!bubble) return row;

    bubble.className = 'typing-wrap';
    bubble.innerHTML = '';
    for (let i = 0; i < 3; i += 1) {
      const dot = document.createElement('div');
      dot.className = 'tdot';
      bubble.appendChild(dot);
    }
    return row;
  }

  function buildImageElement(src, alt = '') {
    const img = document.createElement('img');
    img.src = src;
    img.alt = alt;
    img.loading = 'lazy';
    return img;
  }

  function persistMessage(thread, text, role = 'assistant') {
    const messageState = getMessageState();
    const now = Date.now();
    const slot = messageState[thread] || { messages: [], lastAt: 0 };
    slot.messages.push({ text, role, ts: now });
    slot.lastAt = now;
    messageState[thread] = slot;
    localStorage.setItem('v_message_state', JSON.stringify(messageState));
    getConfig().onMessagesUpdated?.();
  }

  function normalizeImageData(imageData) {
    if (!imageData) return null;
    if (typeof imageData !== 'string') return null;
    const value = imageData.trim();
    if (!value) return null;
    return value;
  }

  async function selectThread(thread) {
    const characters = getCharacters();
    const t = String(thread || '').trim();
    if (!t || !characters[t]) return false;

    const c = characters[t];
    const item = document.querySelector(`.drawer-item[data-thread="${CSS.escape(t)}"]`);
    if (!item) return false;

    document.querySelectorAll('.drawer-item').forEach(x => x.classList.toggle('active', x === item));

    currentThread = t;
    currentAvatar = c.photo || item.querySelector('img')?.src || currentAvatar;

    const rel = getConfig().relationshipState || global.VeloraState?.relationshipState || {};
    const tier = getConfig().tierState || global.VeloraState?.tierState || { tier: 'signal' };
    const promptBuilder = getConfig().buildSystemPrompt || global.VeloraCharacters?.buildSystemPrompt;
    currentPersona = typeof promptBuilder === 'function'
      ? promptBuilder(c, { relationship: rel[t] ?? 'unknown', memoryContinuity: rel[t] ?? 'unknown', tier: tier.tier })
      : (c.persona || '');

    localStorage.setItem('v_last_thread', t);

    const { chatAv, chatName, chatStatus } = getChatEls();
    if (chatAv) chatAv.src = currentAvatar;
    if (chatName) chatName.textContent = c.name || item.dataset.name || t;
    if (chatStatus) chatStatus.textContent = item.dataset.status || c.status || 'Online';

    getConfig().applyCharAccent?.(t);
    getConfig().updateCharPanel?.(t);
    renderChat({ clear: true });
    getConfig().goTo?.('chat');

    const apiJson = getApiJson();

    function showGreeting() {
      const tr = addTyping(currentAvatar);
      apiJson(`/api/characters/${encodeURIComponent(t)}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: '__greeting__' })
      })
        .then(d => {
          tr?.remove();
          const reply = String(d.reply || c.greeting || '...').trim();
          renderChat({ side: 'theirs', text: reply, avSrc: currentAvatar });
          persistMessage(t, reply, 'assistant');
        })
        .catch(() => {
          tr?.remove();
          const fallback = c.greeting || '...';
          renderChat({ side: 'theirs', text: fallback, avSrc: currentAvatar });
          persistMessage(t, fallback, 'assistant');
        });
    }

    try {
      const d = await apiJson(`/api/characters/${encodeURIComponent(t)}/history`);
      const hasBackend = Array.isArray(d.messages) && d.messages.length > 0;
      const messageState = getMessageState();
      const hasLocal = !!messageState[t]?.messages?.length;

      if (hasBackend) {
        d.messages.forEach(m => {
          renderChat({
            side: m.role === 'user' ? 'mine' : 'theirs',
            text: String(m.content || ''),
            avSrc: m.role === 'user' ? '' : currentAvatar
          });
        });
        if (!messageState[t]?.lastAt) {
          const last = d.messages[d.messages.length - 1];
          if (last) {
            messageState[t] = {
              messages: [{ text: String(last.content || ''), role: last.role, ts: Date.now() }],
              lastAt: Date.now()
            };
            localStorage.setItem('v_message_state', JSON.stringify(messageState));
            getConfig().onMessagesUpdated?.();
          }
        }
      }

      if (!hasBackend && !hasLocal) showGreeting();
    } catch {
      const messageState = getMessageState();
      if (!messageState[t]?.messages?.length) showGreeting();
    }

    return true;
  }

  async function sendMessage(payload = {}) {
    const text = String(payload.text || '').trim();
    const imageData = normalizeImageData(payload.imageData);
    const hasText = !!text;
    const hasImage = !!imageData;
    if (!hasText && !hasImage) return { ok: false, reason: 'empty' };

    const thread = currentThread || 'hazel';
    const apiJson = getApiJson();

    if (hasImage && hasText) {
      renderChat({ side: 'mine', text, extraEl: buildImageElement(imageData, 'Attached image') });
    } else if (hasImage) {
      renderChat({ side: 'mine', text: '', extraEl: buildImageElement(imageData, 'Attached image') });
    } else {
      renderChat({ side: 'mine', text });
    }

    persistMessage(thread, hasText ? text : '[Image]', 'user');

    if (hasImage && !hasText) {
      const localReply = IMG_REACTIONS[Math.floor(Math.random() * IMG_REACTIONS.length)];
      renderChat({ side: 'theirs', text: localReply, avSrc: currentAvatar });
      persistMessage(thread, localReply, 'assistant');
      return { ok: true, localOnly: true };
    }

    const typing = addTyping(currentAvatar);

    try {
      const data = await apiJson(`/api/characters/${encodeURIComponent(thread)}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, image: hasImage ? imageData : undefined })
      });

      const reply = String(data.reply || data.result || '...').trim();
      typing?.remove();
      renderChat({ side: 'theirs', text: reply, avSrc: currentAvatar });
      persistMessage(thread, reply, 'assistant');
      getConfig().onReplyReceived?.(thread, reply);
      getConfig().onReward?.(thread);
      return { ok: true, reply };
    } catch (err) {
      typing?.remove();
      renderChat({
        side: 'theirs',
        text: 'I am having trouble replying right now. Try again in a moment.',
        avSrc: currentAvatar
      });
      console.error(err);
      return { ok: false, error: err };
    }
  }

  function getCurrentThread() {
    return currentThread;
  }

  function getCurrentPersona() {
    return currentPersona;
  }

  function getCurrentAvatar() {
    return currentAvatar;
  }

  global.VeloraChat = {
    selectThread,
    sendMessage,
    renderChat,
    getCurrentThread,
    getCurrentPersona,
    getCurrentAvatar,
    MAX_CHAT_IMAGE_BYTES
  };

  global.Velora = {
    ...(global.Velora || {}),
    Chat: global.VeloraChat
  };
})(window);
