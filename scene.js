(function initVeloraScene(global) {
  function getConfig() {
    return global.VeloraSceneConfig || {};
  }

  function getState() {
    return global.VeloraState || {};
  }

  function getSheetEls() {
    return {
      sheet: document.getElementById('sceneSheet'),
      closeBtn: document.getElementById('sceneClose'),
      status: document.getElementById('sceneStatus'),
      generateBtn: document.getElementById('sceneGenerate')
    };
  }

  function getSelection() {
    return {
      mood: document.querySelector('#sceneMood .scene-pill.active')?.dataset.val || 'intimate',
      setting: document.querySelector('#sceneSetting .scene-pill.active')?.dataset.val || 'bedroom',
      style: document.querySelector('#sceneStyle .scene-pill.active')?.dataset.val || 'cinematic',
      detail: document.getElementById('sceneDetail')?.value.trim() || ''
    };
  }

  function openScene() {
    const { sheet, closeBtn } = getSheetEls();
    sheet?.classList.add('open');
    sheet?.setAttribute('aria-hidden', 'false');
    closeBtn?.focus();
  }

  function closeScene() {
    const { sheet } = getSheetEls();
    sheet?.classList.remove('open');
    sheet?.setAttribute('aria-hidden', 'true');
  }

  async function generateScene() {
    const cfg = getConfig();
    const apiJson = cfg.apiJson || global.VeloraApi?.apiJson;
    const safeAssetPath = cfg.safeAssetPath || ((v) => v);
    const showToast = cfg.showToast || (() => {});
    const trackEvent = cfg.trackEvent || (() => {});
    const onServerEconomy = cfg.onServerEconomy || (() => {});
    const onUpgradeRequested = cfg.onUpgradeRequested || (() => {});
    const getCurrentThread = cfg.getCurrentThread || global.VeloraChat?.getCurrentThread || (() => 'hazel');
    const getCharacterAvatar = cfg.getCharacterAvatar || (() => '/profile_pictures/hazel.png');
    const renderSceneResult = cfg.renderSceneResult || (() => {});

    if (typeof apiJson !== 'function') {
      showToast('Scene generation unavailable');
      return;
    }

    const { status, generateBtn } = getSheetEls();
    const oldText = generateBtn?.textContent || 'Generate scene';
    const { mood, setting, style, detail } = getSelection();
    const character = getCurrentThread() || 'hazel';
    trackEvent('scene_builder_opened', { character, mood, setting, style });

    if (generateBtn) {
      generateBtn.disabled = true;
      generateBtn.textContent = 'Generating…';
    }
    if (status) status.textContent = 'This may take 20–40 seconds…';

    try {
      trackEvent('scene_generate_clicked', { character, mood, setting, style });
      const data = await apiJson('/api/camera/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ character, mood, setting, style, detail })
      });

      const imageUrl = data.imageUrl || data.url || data.image || data.output || data.result || data.shot?.path;
      if (!imageUrl) throw new Error('Backend did not return an image URL');
      const imgPath = safeAssetPath(imageUrl, null);
      const canOpenDirectly = imgPath
        ? (/^https?:\/\//i.test(imgPath) ? imgPath : `${location.origin}${imgPath}`)
        : '';
      console.table({ imageUrl, imgPath, canOpenDirectly });
      if (!imgPath) throw new Error(`Rejected image path: ${imageUrl}`);

      // Server is authoritative: validated cost, deducted atomically, returned updated state.
      // Do NOT call local spendForScene() or markSceneUsed().
      // Frontend's only role: sync the server truth to UI cache via onServerEconomy.
      onServerEconomy({
        sparks: data.sparksRemaining,
        pulses: data.pulsesRemaining,
        usage: data.usage
      });

      const img = document.createElement('img');
      img.src = imgPath;
      img.alt = character;
      img.loading = 'lazy';

      closeScene();
      renderSceneResult(img, getCharacterAvatar(character));
      trackEvent('scene_generation_success', { character, imageUrl });
      if (status) status.textContent = '';
      showToast('Scene generated');
    } catch (err) {
      console.error(err);
      const message = String(err?.message || '');
      if (/not enough sparks|limit reached|402|429/i.test(message)) {
        trackEvent('insufficient_credits', { character, reason: message });
        trackEvent('upgrade_clicked_from_scene', { character });
        onUpgradeRequested();
      }
      trackEvent('scene_generation_failed', { character, reason: message || 'unknown' });
      if (status) status.textContent = 'Error: ' + err.message;
      showToast(err.message || 'Scene generation failed');
    } finally {
      if (generateBtn) {
        generateBtn.disabled = false;
        generateBtn.textContent = oldText;
      }
    }
  }

  global.VeloraScene = {
    openScene,
    closeScene,
    generateScene
  };

  global.Velora = {
    ...(global.Velora || {}),
    Scene: global.VeloraScene
  };
})(window);
