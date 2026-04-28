(function initVeloraAnalytics(global) {
  const DEV = location.hostname === 'localhost' || location.hostname === '127.0.0.1';

  function getUserProps() {
    try {
      const us = global.VeloraUserState;
      if (!us) return {};
      return {
        funnel_stage:    us.getFunnelStage(),
        return_status:   us.getReturnStatus(),
        message_count:   us.getTotalMessageCount(),
        sparks:          us.getSparks(),
        subscription:    us.getSubscriptionTier(),
        character:       us.getSelectedCharacter(),
      };
    } catch { return {}; }
  }

  function trackEvent(name, props = {}) {
    if (!name) return;
    try {
      const payload = { event: name, ts: Date.now(), ...getUserProps(), ...props };
      if (DEV) {
        console.info(`[track] ${name}`, payload);
      }
      // Future: send to analytics backend
      // fetch('/api/events', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) }).catch(()=>{});
    } catch { /* never block UX */ }
  }

  global.trackEvent = trackEvent;
  global.VeloraAnalytics = { trackEvent };
  global.Velora = { ...(global.Velora || {}), Analytics: { trackEvent } };
})(window);
