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
    const state = getState();
    const apiJson = cfg.apiJson || global.VeloraApi?.apiJson;
    const safeAssetPath = cfg.safeAssetPath || ((v) => v);
    const showToast = cfg.showToast || (() => {});
    const canAffordScene = cfg.canAffordScene || state.canAffordScene || (() => true);
    const canUseSceneQuota = cfg.canUseSceneQuota || state.canUseSceneQuota || (() => true);
    const sceneLimitStatus = cfg.sceneLimitStatus || state.sceneLimitStatus || (() => ({ daily: 0, dailyLimit: 0 }));
    const spendForScene = cfg.spendForScene || (() => true);
    const markSceneUsed = cfg.markSceneUsed || state.markSceneUsed || (() => {});
    const getCurrentThread = cfg.getCurrentThread || global.VeloraChat?.getCurrentThread || (() => 'hazel');
    const getCharacterAvatar = cfg.getCharacterAvatar || (() => '/profile_pictures/hazel.png');
    const renderSceneResult = cfg.renderSceneResult || (() => {});

    if (typeof apiJson !== 'function') {
      showToast('Scene generation unavailable');
      return;
    }

    // TODO(security): Final scene quota and currency validation must be enforced server-side.
    if (!canAffordScene(15, 1)) {
      showToast('Not enough sparks — earn more by chatting');
      return;
    }

    if (!canUseSceneQuota()) {
      const q = sceneLimitStatus();
      showToast(`Scene limit reached — ${q.daily}/${q.dailyLimit} today`);
      return;
    }

    const { status, generateBtn } = getSheetEls();
    const oldText = generateBtn?.textContent || 'Generate scene';
    const { mood, setting, style, detail } = getSelection();
    const character = getCurrentThread() || 'hazel';

    if (generateBtn) {
      generateBtn.disabled = true;
      generateBtn.textContent = 'Generating…';
    }
    if (status) status.textContent = 'This may take 20–40 seconds…';

    try {
      const data = await apiJson('/api/camera/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ character, mood, setting, style, detail })
      });

      const imageUrl = data.url || data.image || data.output || data.result || data.shot?.path;
      const imgPath = safeAssetPath(imageUrl, null);
      if (!imgPath) throw new Error('No image returned');

      if (!spendForScene(15, 1)) return;
      markSceneUsed();

      const img = document.createElement('img');
      img.src = imgPath;
      img.alt = character;
      img.loading = 'lazy';

      closeScene();
      renderSceneResult(img, getCharacterAvatar(character));
      if (status) status.textContent = '';
      showToast('Scene generated');
    } catch (err) {
      console.error(err);
      if (status) status.textContent = 'Error: ' + err.message;
      showToast('Scene generation failed');
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
})(window);
