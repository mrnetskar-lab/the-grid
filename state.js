(function initVeloraState(global) {
  const USER_STATE_KEY = 'v_user_state';

  function readUserState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(USER_STATE_KEY) || '{}');
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  function writeUserState(next) {
    localStorage.setItem(USER_STATE_KEY, JSON.stringify(next || {}));
  }

  const userState = {
    read() {
      const state = readUserState();
      const fallbackThread = localStorage.getItem('v_last_thread') || null;
      const fallbackTier = state.subscriptionTier || state.tier || 'signal';
      const fallbackSparks = Number(localStorage.getItem('v_sparks') || 120);
      const fallbackPulses = Number(localStorage.getItem('v_pulses') || 0);
      const fallbackOnboarded = localStorage.getItem('v_onboarded') === '1';
      const fallbackAdultVerified = localStorage.getItem('v_in') === '1';
      const fallbackMessageState = JSON.parse(localStorage.getItem('v_message_state') || '{}');
      const fallbackMessageCount = Number(state.messageCount ?? Object.values(fallbackMessageState).reduce((sum, entry) => {
        const size = Array.isArray(entry?.messages) ? entry.messages.length : 0;
        return sum + size;
      }, 0));
      const fallbackSceneUsage = JSON.parse(localStorage.getItem('v_scene_usage') || '{}');

      return {
        authStatus: state.authStatus || 'guest',
        onboardingStatus: state.onboardingStatus || (fallbackOnboarded ? 'completed' : 'new'),
        selectedCharacter: state.selectedCharacter || fallbackThread,
        lastActiveThread: state.lastActiveThread || fallbackThread,
        hasStartedChat: Boolean(state.hasStartedChat || state.firstChatDone || fallbackMessageCount > 0),
        messageCount: fallbackMessageCount,
        relationshipLevel: Number(state.relationshipLevel ?? 0),
        sparks: Number.isFinite(Number(state.sparks)) ? Number(state.sparks) : fallbackSparks,
        pulses: Number.isFinite(Number(state.pulses)) ? Number(state.pulses) : fallbackPulses,
        subscriptionTier: fallbackTier,
        sceneUsage: state.sceneUsage || fallbackSceneUsage,
        returnStatus: state.returnStatus || (fallbackMessageCount > 0 ? 'returning' : 'new'),
        premiumPromptSeen: Boolean(state.premiumPromptSeen),
        isPremium: Boolean(state.isPremium),
        funnelStage: state.funnelStage || 'homepage',
        adultVerified: Boolean(state.adultVerified ?? fallbackAdultVerified),
        lastView: state.lastView || localStorage.getItem('v_view') || 'home'
      };
    },
    write(next) {
      writeUserState(next);
    },
    get(key, fallback = null) {
      const state = readUserState();
      return key in state ? state[key] : fallback;
    },
    set(key, value) {
      const state = readUserState();
      state[key] = value;
      writeUserState(state);
      return state;
    },
    patch(values = {}) {
      const state = readUserState();
      const next = { ...state, ...(values || {}) };
      writeUserState(next);
      return next;
    },
    completeOnboarding(characterId = '') {
      const state = readUserState();
      state.onboarded = true;
      state.onboardingStatus = 'completed';
      if (characterId) state.selectedCharacter = characterId;
      if (!state.funnelStage || state.funnelStage === 'onboarding') state.funnelStage = 'first_chat';
      writeUserState(state);
      localStorage.setItem('v_onboarded', '1');
      if (characterId) localStorage.setItem('v_last_thread', characterId);
      return state;
    },
    selectCharacter(characterId = '') {
      if (!characterId) return readUserState();
      const state = readUserState();
      state.selectedCharacter = characterId;
      state.lastActiveThread = characterId;
      state.onboardingStatus = state.onboardingStatus === 'completed' ? 'completed' : 'started';
      if (!state.funnelStage || ['onboarding', 'character_choice'].includes(state.funnelStage)) {
        state.funnelStage = 'first_chat';
      }
      writeUserState(state);
      localStorage.setItem('v_last_thread', characterId);
      return state;
    },
    markFirstChatComplete(characterId = '') {
      const state = readUserState();
      state.firstChatDone = true;
      state.hasStartedChat = true;
      state.firstChatAt = state.firstChatAt || Date.now();
      if (characterId) {
        state.selectedCharacter = characterId;
        state.lastActiveThread = characterId;
      }
      if (!state.engagedAt) state.engagedAt = Date.now();
      state.onboardingStatus = 'completed';
      state.funnelStage = state.isPremium ? 'return' : 'premium_scene';
      writeUserState(state);
      return state;
    },
    markPremiumPromptSeen() {
      const state = readUserState();
      state.premiumPromptSeen = true;
      if (!state.premiumPromptAt) state.premiumPromptAt = Date.now();
      if (!state.isPremium) state.funnelStage = 'upgrade';
      writeUserState(state);
      return state;
    },
    setPremium(isPremium) {
      const state = readUserState();
      state.isPremium = !!isPremium;
      state.subscriptionTier = state.isPremium ? 'premium' : 'signal';
      state.funnelStage = state.isPremium ? 'return' : 'upgrade';
      writeUserState(state);
      return state;
    },
    setLastView(viewName) {
      const state = readUserState();
      state.lastView = viewName;
      writeUserState(state);
      localStorage.setItem('v_view', viewName);
      return state;
    },
    touchMessage(threadId = '') {
      const state = readUserState();
      state.hasStartedChat = true;
      state.messageCount = Number(state.messageCount || 0) + 1;
      if (threadId) {
        state.selectedCharacter = state.selectedCharacter || threadId;
        state.lastActiveThread = threadId;
      }
      state.returnStatus = state.messageCount > 3 ? 'returning' : (state.returnStatus || 'new');
      if (!state.funnelStage || ['first_chat', 'character_choice', 'homepage'].includes(state.funnelStage)) {
        state.funnelStage = 'engagement';
      }
      writeUserState(state);
      return state;
    },
    setRelationshipLevel(level) {
      const state = readUserState();
      if (Number.isFinite(Number(level))) state.relationshipLevel = Number(level);
      writeUserState(state);
      return state;
    },
    setReturnStatus(status = 'new') {
      const state = readUserState();
      if (['new', 'returning', 'inactive'].includes(status)) state.returnStatus = status;
      writeUserState(state);
      return state;
    },
    setAdultVerified(isVerified) {
      const state = readUserState();
      state.adultVerified = !!isVerified;
      state.onboardingStatus = state.onboardingStatus || (state.adultVerified ? 'new' : 'new');
      if (state.adultVerified) {
        localStorage.setItem('v_in', '1');
      } else {
        localStorage.removeItem('v_in');
      }
      writeUserState(state);
      return state;
    },
    getRetention() {
      const state = readUserState();
      return {
        lastLoginKey: state.lastLoginKey || localStorage.getItem('v_last_login') || null,
        streakLastKey: state.streakLastKey || localStorage.getItem('v_streak_last') || null,
        streakCount: Number(state.streakCount ?? localStorage.getItem('v_streak_count') ?? 0)
      };
    },
    setRetention(payload = {}) {
      const state = readUserState();
      if (typeof payload.lastLoginKey === 'string') {
        state.lastLoginKey = payload.lastLoginKey;
        localStorage.setItem('v_last_login', payload.lastLoginKey);
      }
      if (typeof payload.streakLastKey === 'string') {
        state.streakLastKey = payload.streakLastKey;
        localStorage.setItem('v_streak_last', payload.streakLastKey);
      }
      if (Number.isFinite(Number(payload.streakCount))) {
        state.streakCount = Number(payload.streakCount);
        localStorage.setItem('v_streak_count', String(state.streakCount));
      }
      state.returnStatus = state.streakCount > 1 ? 'returning' : (state.returnStatus || 'new');
      state.funnelStage = state.isPremium ? 'return' : (state.funnelStage || 'engagement');
      writeUserState(state);
      return state;
    }
  };

  const relationshipState = { hazel: 42, nina: 56, iris: 33, vale: 61 };
  const messageState = JSON.parse(localStorage.getItem('v_message_state') || '{}');
  const tierState = { tier: 'signal' };

  // TODO(security): Currency values must be server-authoritative. Keep this local value as UI cache only.
  const currency = {
    sparks: parseInt(localStorage.getItem('v_sparks') || '120', 10),
    pulses: parseInt(localStorage.getItem('v_pulses') || '0', 10),
    save() {
      localStorage.setItem('v_sparks', this.sparks);
      localStorage.setItem('v_pulses', this.pulses);
    },
    setFromServer(payload = {}) {
      if (Number.isFinite(Number(payload.sparks))) this.sparks = Number(payload.sparks);
      if (Number.isFinite(Number(payload.pulses))) this.pulses = Number(payload.pulses);
      this.save();
    }
  };
  // TODO(security): Eventually move ALL currency mutations to server-side APIs only.

  function localDateKey(d = new Date()) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function todayKey() {
    return localDateKey();
  }

  function yesterdayKey() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return localDateKey(d);
  }

  function monthKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  function sceneUsage() {
    return JSON.parse(localStorage.getItem('v_scene_usage') || '{}');
  }

  // TODO(security): Scene quotas and purchase checks must be validated on the server.
  function sceneLimitStatus() {
    const u = sceneUsage();
    return {
      daily: u[`d_${todayKey()}`] || 0,
      monthly: u[`m_${monthKey()}`] || 0,
      dailyLimit: 3,
      monthlyLimit: 20
    };
  }

  function canUseSceneQuota() {
    const q = sceneLimitStatus();
    return q.daily < q.dailyLimit && q.monthly < q.monthlyLimit;
  }

  function canAffordScene(sc = 15, pc = 1) {
    return currency.sparks >= sc || currency.pulses >= pc;
  }

  function canGenerateScene() {
    return canAffordScene(15, 1);
  }

  function markSceneUsed() {
    const usage = sceneUsage();
    usage[`d_${todayKey()}`] = (usage[`d_${todayKey()}`] || 0) + 1;
    usage[`m_${monthKey()}`] = (usage[`m_${monthKey()}`] || 0) + 1;
    localStorage.setItem('v_scene_usage', JSON.stringify(usage));
  }

  global.VeloraState = {
    userState,
    relationshipState,
    messageState,
    tierState,
    currency,
    todayKey,
    yesterdayKey,
    monthKey,
    localDateKey,
    sceneUsage,
    sceneLimitStatus,
    canUseSceneQuota,
    canAffordScene,
    canGenerateScene,
    markSceneUsed
  };

  global.Velora = {
    ...(global.Velora || {}),
    State: global.VeloraState
  };
})(window);
