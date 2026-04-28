(function initVeloraUserState(global) {
  // ── Keys ─────────────────────────────────────────────────────────────────────
  const K = {
    onboarded:     'v_onboarded',
    ageGate:       'v_in',
    lastThread:    'v_last_thread',
    messageState:  'v_message_state',
    sparks:        'v_sparks',
    pulses:        'v_pulses',
    sceneUsage:    'v_scene_usage',
    lastLogin:     'v_last_login',
    streakCount:   'v_streak_count',
    streakLast:    'v_streak_last',
    userName:      'v_user_name',
    userAvatar:    'v_user_avatar',
    funnelStage:   'v_funnel_stage',
    premiumSeen:   'v_premium_prompt_seen',
  };

  function ls(key, fallback = null) {
    try { const v = localStorage.getItem(key); return v !== null ? v : fallback; }
    catch { return fallback; }
  }
  function lsSet(key, value) {
    try { localStorage.setItem(key, String(value)); } catch {}
  }
  function lsRemove(key) {
    try { localStorage.removeItem(key); } catch {}
  }
  function lsJson(key, fallback = {}) {
    try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; }
    catch { return fallback; }
  }

  // ── Auth ─────────────────────────────────────────────────────────────────────
  function getAuthStatus() {
    return ls(K.ageGate) === '1' ? 'user' : 'guest';
  }

  // ── Onboarding ───────────────────────────────────────────────────────────────
  function getOnboardingStatus() {
    if (ls(K.onboarded) === '1') return 'completed';
    if (ls(K.lastThread)) return 'started';
    return 'new';
  }
  function completeOnboarding() { lsSet(K.onboarded, '1'); }

  // ── Character / thread ───────────────────────────────────────────────────────
  function getSelectedCharacter() { return ls(K.lastThread); }
  function setSelectedCharacter(id) { lsSet(K.lastThread, id); }

  // ── Chat state ───────────────────────────────────────────────────────────────
  function getMessageState() { return lsJson(K.messageState, {}); }

  function getTotalMessageCount() {
    const state = getMessageState();
    return Object.values(state).reduce((sum, t) => sum + (t.messages?.length || 0), 0);
  }

  function hasStartedChat() { return getTotalMessageCount() > 0; }

  function getLastActiveThread() { return ls(K.lastThread); }

  function getLastMessagePreview(threadId) {
    const state = getMessageState();
    const msgs = state[threadId]?.messages || [];
    const last = msgs[msgs.length - 1];
    return last?.text?.slice(0, 80) || null;
  }

  // ── Economy ──────────────────────────────────────────────────────────────────
  // Frontend caches only. Server is authoritative for costs and quotas.
  function getSparks() { return parseInt(ls(K.sparks, '120'), 10); }
  function getPulses() { return parseInt(ls(K.pulses, '0'), 10); }
  function setSparks(n) { lsSet(K.sparks, n); }
  function setPulses(n) { lsSet(K.pulses, n); }

  function getSubscriptionTier() {
    return (global.VeloraState?.tierState || { tier: 'signal' }).tier;
  }

  // ── Scene usage (local cache — server is authoritative) ───────────────────────
  function getSceneUsage() { return lsJson(K.sceneUsage, {}); }

  // ── Streak / return ──────────────────────────────────────────────────────────
  function getStreak() { return parseInt(ls(K.streakCount, '0'), 10); }

  function getReturnStatus() {
    const lastLogin = ls(K.lastLogin);
    if (!lastLogin) return 'new';
    const daysSince = Math.floor((Date.now() - new Date(lastLogin).getTime()) / 86400000);
    if (daysSince === 0) return 'returning';
    if (daysSince <= 7) return 'returning';
    return 'inactive';
  }

  // ── Funnel stage ─────────────────────────────────────────────────────────────
  function getFunnelStage() {
    if (!hasStartedChat()) {
      const onb = getOnboardingStatus();
      if (onb === 'new') return 'landing';
      if (onb === 'started') return 'onboarding';
      return 'first-chat';
    }
    const msgs = getTotalMessageCount();
    if (msgs < 5) return 'activation';
    if (msgs < 20) return 'engagement';
    const premiumSeen = ls(K.premiumSeen) === '1';
    if (!premiumSeen) return 'premium-prompt';
    return 'retained';
  }
  function setFunnelStage(stage) { lsSet(K.funnelStage, stage); }

  function markPremiumPromptSeen() { lsSet(K.premiumSeen, '1'); }

  // ── Profile ──────────────────────────────────────────────────────────────────
  function getUserName() { return ls(K.userName, 'You'); }
  function setUserName(name) { lsSet(K.userName, name); }
  function getUserAvatar() { return ls(K.userAvatar); }
  function setUserAvatar(src) { lsSet(K.userAvatar, src); }

  // ── What should user do next ──────────────────────────────────────────────────
  function getNextAction() {
    const stage = getFunnelStage();
    const map = {
      'landing':       { action: 'start_onboarding',    label: 'Meet your first companion' },
      'onboarding':    { action: 'complete_onboarding', label: 'Choose a companion' },
      'first-chat':    { action: 'start_chat',          label: 'Start your first chat' },
      'activation':    { action: 'keep_chatting',       label: 'Keep the conversation going' },
      'engagement':    { action: 'try_scene',           label: 'Create a scene' },
      'premium-prompt':{ action: 'show_upgrade',        label: 'Unlock premium scenes' },
      'retained':      { action: 'return_to_chat',      label: 'Continue where you left off' },
    };
    return map[stage] || map['landing'];
  }

  // ── Snapshot ─────────────────────────────────────────────────────────────────
  function getSnapshot() {
    return {
      authStatus:        getAuthStatus(),
      onboardingStatus:  getOnboardingStatus(),
      selectedCharacter: getSelectedCharacter(),
      lastActiveThread:  getLastActiveThread(),
      hasStartedChat:    hasStartedChat(),
      messageCount:      getTotalMessageCount(),
      sparks:            getSparks(),
      pulses:            getPulses(),
      subscriptionTier:  getSubscriptionTier(),
      returnStatus:      getReturnStatus(),
      streak:            getStreak(),
      funnelStage:       getFunnelStage(),
      nextAction:        getNextAction(),
    };
  }

  const userState = {
    K,
    getAuthStatus,
    getOnboardingStatus, completeOnboarding,
    getSelectedCharacter, setSelectedCharacter,
    getMessageState, getTotalMessageCount, hasStartedChat,
    getLastActiveThread, getLastMessagePreview,
    getSparks, getPulses, setSparks, setPulses,
    getSubscriptionTier,
    getSceneUsage,
    getStreak, getReturnStatus,
    getFunnelStage, setFunnelStage,
    markPremiumPromptSeen,
    getUserName, setUserName, getUserAvatar, setUserAvatar,
    getNextAction,
    getSnapshot,
  };

  global.VeloraUserState = userState;
  global.Velora = { ...(global.Velora || {}), UserState: userState };
})(window);
