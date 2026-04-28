(function initVeloraApi(global) {
  function isJsonResponse(response) {
    return (response.headers.get('content-type') || '').toLowerCase().includes('application/json');
  }

  async function apiJson(url, options = {}) {
    const response = await fetch(url, options);
    const raw = await response.text();
    let data = null;

    if (raw && isJsonResponse(response)) {
      try {
        data = JSON.parse(raw);
      } catch {
        throw new Error('Invalid JSON from server');
      }
    } else if (raw && !isJsonResponse(response)) {
      const preview = raw.replace(/\s+/g, ' ').slice(0, 160);
      throw new Error(`Expected JSON from ${url}, got ${response.headers.get('content-type') || 'unknown'}: ${preview}`);
    }

    if (!response.ok || data?.ok === false) {
      throw new Error(data?.error || `Request failed: ${response.status}`);
    }

    return data || { ok: true };
  }

  async function apiDelete(url) {
    const response = await fetch(url, { method: 'DELETE' });

    if (response.status === 204) {
      if (!response.ok) throw new Error(`Delete failed: ${response.status}`);
      return { ok: true };
    }

    const raw = await response.text();
    if (!raw) {
      if (!response.ok) throw new Error(`Delete failed: ${response.status}`);
      return { ok: true };
    }

    if (!isJsonResponse(response)) {
      throw new Error(`Delete failed: expected JSON, got ${response.headers.get('content-type') || 'unknown'}`);
    }

    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      throw new Error('Invalid JSON from delete endpoint');
    }

    if (!response.ok || data?.ok === false) {
      throw new Error(data?.error || `Delete failed: ${response.status}`);
    }

    return data;
  }

  global.VeloraApi = {
    isJsonResponse,
    apiJson,
    apiDelete
  };

  global.Velora = {
    ...(global.Velora || {}),
    Api: global.VeloraApi
  };
})(window);
