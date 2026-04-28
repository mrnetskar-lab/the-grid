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
    const onServerEconomy = cfg.onServerEconomy || (() => {});
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

      const imageUrl = data.imageUrl || data.url || data.image || data.output || data.result || data.shot?.path;
      console.log('[scene] response', data);
      console.log('[scene] imageUrl', imageUrl);
      const imgPath = safeAssetPath(imageUrl, null);
      console.log('[scene] imgPath', imgPath);
      if (!imgPath) throw new Error(`Invalid image path returned: ${imageUrl || 'empty'}`);

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
      if (status) status.textContent = '';
      showToast('Scene generated');
    } catch (err) {
      console.error(err);
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
