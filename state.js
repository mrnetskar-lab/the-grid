(function initVeloraState(global) {
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
