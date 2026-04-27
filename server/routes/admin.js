import express from 'express';
import fs from 'fs';
import path from 'path';
import http from 'http';
import { spawn, execSync } from 'child_process';
import multer from 'multer';
import archiver from 'archiver';
import { fileURLToPath } from 'url';
import { getLooks, setLook, patchLookDefaultInSource, runFalComfyWorkflow } from '../services/CameraService.js';
import OpenAI from 'openai';
import { openai as defaultOpenai, activeModel as defaultActiveModel } from '../services/openaiClient.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '../..');
const CHARS_DIR = path.resolve(__dirname, '../../characters');
const IMAGES_DIR = path.resolve(__dirname, '../../images');
const NOTES_DIR = path.resolve(__dirname, '../../admin_notes');
const NOTES_JSON = path.join(NOTES_DIR, 'notes.json');
const COMFY_HOST = '127.0.0.1';
const COMFY_PORT = 8188;
const COMFYUI_OUTPUT_DIR = process.env.COMFYUI_OUTPUT_DIR || 'C:/Users/mn/ComfyUI_windows_portable/ComfyUI/output';
const ADMIN_KEY = process.env.ADMIN_KEY || (process.env.NODE_ENV === 'production' ? null : 'velora-admin-2025');
if (!ADMIN_KEY) console.error('[admin] WARNING: ADMIN_KEY env var not set — admin routes are disabled');
const SERVER_STARTED_AT = new Date().toISOString();

let APP_VERSION = 'unknown';
try {
  const pkgPath = path.join(ROOT_DIR, 'package.json');
  APP_VERSION = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')).version || 'unknown';
} catch {}

let GIT_HASH = 'unknown';
try {
  GIT_HASH = execSync('git rev-parse --short HEAD', { cwd: ROOT_DIR, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() || 'unknown';
} catch {}

if (!fs.existsSync(NOTES_DIR)) fs.mkdirSync(NOTES_DIR, { recursive: true });
if (!fs.existsSync(NOTES_JSON)) fs.writeFileSync(NOTES_JSON, '[]', 'utf-8');

const SCREENSHOTS_DIR = 'C:/Users/mn/OneDrive/Bilder/Skjermbilder';
let screenshotWatcher = null;
let watcherSeen = new Set();
const COMFYUI_BAT = 'C:\\Users\\mn\\ComfyUI_windows_portable\\run_nvidia_gpu.bat';

function saveNote(text, mediaPath, mediaType) {
  let notes = [];
  try { notes = JSON.parse(fs.readFileSync(NOTES_JSON, 'utf-8')); } catch {}
  notes.unshift({ id: `note_${Date.now()}_${Math.floor(Math.random()*9000+1000)}`, timestamp: new Date().toISOString(), text, imagePath: mediaPath || null, mediaType: mediaType || null });
  fs.writeFileSync(NOTES_JSON, JSON.stringify(notes, null, 2), 'utf-8');
}

function startScreenshotWatcher() {
  if (screenshotWatcher) return { ok: true, status: 'already running' };
  if (!fs.existsSync(SCREENSHOTS_DIR)) return { ok: false, error: 'Screenshots folder not found: ' + SCREENSHOTS_DIR };
  // seed seen set with existing files so we don't import old screenshots
  fs.readdirSync(SCREENSHOTS_DIR).forEach(f => watcherSeen.add(f));
  screenshotWatcher = fs.watch(SCREENSHOTS_DIR, (event, filename) => {
    if (!filename || watcherSeen.has(filename)) return;
    if (!/\.(png|jpg|jpeg|mp4|mov|webm)$/i.test(filename)) return;
    watcherSeen.add(filename);
    const src = path.join(SCREENSHOTS_DIR, filename);
    const isVideo = /\.(mp4|mov|webm)$/i.test(filename);
    setTimeout(() => {
      try {
        if (!fs.existsSync(src)) return;
        const dest = path.join(NOTES_DIR, `${Date.now()}_${filename}`);
        fs.copyFileSync(src, dest);
        saveNote(`${new Date().toISOString()} — ${isVideo ? 'video' : 'screenshot'}`, `/admin_notes/${path.basename(dest)}`, isVideo ? 'video' : 'image');
      } catch (e) { console.warn('Watcher copy error:', e.message); }
    }, 500);
  });
  screenshotWatcher.on('error', () => { screenshotWatcher = null; });
  return { ok: true, status: 'started' };
}

function stopScreenshotWatcher() {
  if (!screenshotWatcher) return { ok: true, status: 'not running' };
  screenshotWatcher.close();
  screenshotWatcher = null;
  watcherSeen = new Set();
  return { ok: true, status: 'stopped' };
}

function launchComfyUI() {
  if (!fs.existsSync(COMFYUI_BAT)) {
    return { status: 404, body: { ok: false, error: 'ComfyUI bat not found: ' + COMFYUI_BAT } };
  }
  try {
    const child = spawn('cmd.exe', ['/c', 'start', '', COMFYUI_BAT], {
      detached: true,
      stdio: 'ignore',
      cwd: path.dirname(COMFYUI_BAT),
    });
    child.unref();
    return { status: 200, body: { ok: true, message: 'ComfyUI launching...' } };
  } catch (err) {
    return { status: 500, body: { ok: false, error: err.message } };
  }
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, NOTES_DIR),
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}_${safeName}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 200 * 1024 * 1024 } });
const router = express.Router();

function auth(req, res, next) {
  if (!ADMIN_KEY) return res.status(503).json({ ok: false, error: 'Admin not configured — set ADMIN_KEY env var' });
  if (req.headers['x-admin-key'] !== ADMIN_KEY) {
    return res.status(403).json({ ok: false, error: 'Forbidden' });
  }
  return next();
}

function isValidId(id) {
  return typeof id === 'string' && /^[a-z0-9-]+$/.test(id);
}

function readNotes() {
  try { return JSON.parse(fs.readFileSync(NOTES_JSON, 'utf-8')); } catch { return []; }
}

function writeNotes(notes) {
  fs.writeFileSync(NOTES_JSON, JSON.stringify(notes, null, 2), 'utf-8');
}

function comfyRequest(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const req = http.request({
      hostname: COMFY_HOST,
      port: COMFY_PORT,
      path: urlPath,
      method,
      headers: { 'Content-Type': 'application/json', ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}) },
    }, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, data }); }
      });
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

router.use(auth);

router.get('/meta', (_req, res) => {
  return res.json({
    ok: true,
    version: APP_VERSION,
    gitHash: GIT_HASH,
    startedAt: SERVER_STARTED_AT,
    pid: process.pid,
  });
});

router.get('/characters', (_req, res) => {
  try {
    const files = fs.readdirSync(CHARS_DIR)
      .filter((f) => f.endsWith('.json') && !f.includes('.history') && f !== 'camera_looks.json');
    const characters = files.map((f) => {
      try { return JSON.parse(fs.readFileSync(path.join(CHARS_DIR, f), 'utf-8')); }
      catch { return null; }
    }).filter(Boolean).sort((a, b) => String(a.id || '').localeCompare(String(b.id || '')));
    const looks = getLooks();
    characters.forEach((c) => { c.camera_look = looks[c.id] || ''; });
    return res.json({ ok: true, characters });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/characters/:id', (req, res) => {
  try {
    const id = String(req.params.id || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!isValidId(id)) return res.status(400).json({ ok: false, error: 'id must be lowercase slug (a-z, 0-9, -)' });

    const filepath = path.join(CHARS_DIR, `${id}.json`);
    if (!filepath.startsWith(CHARS_DIR + path.sep)) return res.status(403).json({ ok: false, error: 'Forbidden' });

    const body = req.body || {};
    const { camera_look, ...charFields } = body;
    const character = {
      id,
      name: String(charFields.name || ''),
      color: String(charFields.color || '#9f67ff'),
      status: String(charFields.status || 'ONLINE'),
      route: String(charFields.route || ''),
      bio: String(charFields.bio || ''),
      greeting: String(charFields.greeting || ''),
      identity: String(charFields.identity || ''),
      anchors: charFields.anchors || {},
    };

    fs.writeFileSync(filepath, JSON.stringify(character, null, 2), 'utf-8');
    if (camera_look !== undefined) {
      setLook(id, camera_look);
      patchLookDefaultInSource(id, camera_look);
    }

    return res.json({ ok: true, character });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

router.get('/camera-looks', (_req, res) => res.json({ ok: true, looks: getLooks() }));

router.post('/camera-look', (req, res) => {
  const id = String(req.body?.id || '').trim().toLowerCase();
  const value = String(req.body?.value || req.body?.look || '').trim();
  if (!isValidId(id) || !value) return res.status(400).json({ ok: false, error: 'id and value required' });
  const saved = setLook(id, value);
  const patched = patchLookDefaultInSource(id, value);
  return res.json({ ok: Boolean(saved), patchedDefault: patched, looks: getLooks() });
});

router.get('/notes', (_req, res) => {
  const notes = readNotes().sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)));
  return res.json({ ok: true, notes });
});

router.post('/notes', upload.single('image'), (req, res) => {
  try {
    const text = String(req.body?.note || '').trim();
    const mediaPath = req.file ? `/admin_notes/${req.file.filename}` : null;
    const mediaType = req.file ? (/\.(mp4|mov|webm)$/i.test(req.file.originalname) ? 'video' : 'image') : null;
    if (!text && !mediaPath) return res.status(400).json({ ok: false, error: 'note text or image is required' });

    const entry = { id: `note_${Date.now()}_${Math.floor(Math.random() * 10000)}`, timestamp: new Date().toISOString(), text, imagePath: mediaPath, mediaType };
    const notes = readNotes();
    notes.unshift(entry);
    writeNotes(notes);
    return res.json({ ok: true, note: entry });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

router.get('/notes/export', (_req, res) => {
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="admin_notes_${Date.now()}.zip"`);
  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.on('error', (err) => res.status(500).json({ ok: false, error: err.message }));
  archive.pipe(res);
  archive.directory(NOTES_DIR, 'admin_notes');
  archive.finalize();
});

router.get('/comfy/health', async (_req, res) => {
  try {
    const out = await comfyRequest('GET', '/system_stats');
    return res.json({ ok: true, available: out.status < 400, version: out.data?.system?.comfyui_version || null, data: out.data });
  } catch {
    return res.json({ ok: true, available: false, version: null });
  }
});

router.get('/comfy/images', (_req, res) => {
  try {
    if (!fs.existsSync(COMFYUI_OUTPUT_DIR)) return res.json({ ok: true, images: [] });
    const images = fs.readdirSync(COMFYUI_OUTPUT_DIR)
      .filter((f) => /\.(png|jpg|jpeg|webp)$/i.test(f))
      .sort((a, b) => b.localeCompare(a));
    return res.json({ ok: true, images });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

router.get('/comfy/image/:filename', (req, res) => {
  const filename = path.basename(req.params.filename);
  const filepath = path.resolve(COMFYUI_OUTPUT_DIR, filename);
  if (!filepath.startsWith(path.resolve(COMFYUI_OUTPUT_DIR))) return res.status(403).json({ ok: false, error: 'Forbidden' });
  if (!fs.existsSync(filepath)) return res.status(404).json({ ok: false, error: 'Not found' });
  return res.sendFile(filepath);
});

router.post('/comfy/run', async (req, res) => {
  if (!req.body?.workflow || typeof req.body.workflow !== 'object') return res.status(400).json({ ok: false, error: 'workflow object required' });

  // Try local ComfyUI first
  try {
    const out = await comfyRequest('POST', '/prompt', { prompt: req.body.workflow, client_id: 'admin-tool' });
    if (out.status < 400) return res.json({ ok: true, prompt_id: out.data?.prompt_id || null, backend: 'local', data: out.data });
  } catch {}

  // Fall back to FAL cloud ComfyUI
  if (!process.env.FAL_API_KEY) return res.status(503).json({ ok: false, error: 'Local ComfyUI unavailable and FAL_API_KEY not set' });
  try {
    const shot = await runFalComfyWorkflow(req.body.workflow);
    return res.json({ ok: true, backend: 'fal-ai/comfy', shot });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/deploy', async (req, res) => {
  const token = String(req.body?.token || '').trim();
  if (!token) return res.status(400).json({ ok: false, error: 'GitHub token required' });
  const { execFile } = await import('child_process');
  const { promisify } = await import('util');
  const execFileAsync = promisify(execFile);
  try {
    const remote = `https://mrnetskar-lab:${token}@github.com/mrnetskar-lab/the-grid.git`;
    await execFileAsync('git', ['remote', 'set-url', 'origin', remote], { cwd: ROOT_DIR });
    await execFileAsync('git', ['add', 'characters/'], { cwd: ROOT_DIR });
    const { stdout: diff } = await execFileAsync('git', ['diff', '--cached', '--name-only'], { cwd: ROOT_DIR });
    if (!diff.trim()) return res.json({ ok: true, output: 'Nothing to deploy — characters already up to date.' });
    await execFileAsync('git', ['commit', '-m', 'deploy: update active characters'], { cwd: ROOT_DIR });
    await execFileAsync('git', ['push', 'origin', 'master'], { cwd: ROOT_DIR });
    return res.json({ ok: true, output: `Deployed.\n${diff.trim()}` });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || 'Deploy failed' });
  }
});

router.post('/commands', async (req, res) => {
  const command = String(req.body?.command || '').trim();
  const allowed = new Set(['clear-all-history', 'clear-images', 'list-images', 'ping-comfy', 'server-status', 'launch-comfy']);
  if (!allowed.has(command)) return res.status(400).json({ ok: false, error: 'Command not allowed' });

  try {
    if (command === 'clear-all-history') {
      const deleted = fs.readdirSync(CHARS_DIR).filter((f) => f.endsWith('.history.json')).map((f) => path.join(CHARS_DIR, f));
      deleted.forEach((f) => fs.unlinkSync(f));
      return res.json({ ok: true, output: `Deleted ${deleted.length} history files.`, files: deleted.map((f) => path.basename(f)) });
    }

    if (command === 'clear-images') {
      const removed = fs.readdirSync(IMAGES_DIR).filter((f) => /\.(png|jpg|jpeg|webp)$/i.test(f));
      removed.forEach((f) => fs.unlinkSync(path.join(IMAGES_DIR, f)));
      return res.json({ ok: true, output: `Deleted ${removed.length} images.`, files: removed });
    }

    if (command === 'list-images') {
      const files = fs.readdirSync(IMAGES_DIR).filter((f) => /\.(png|jpg|jpeg|webp)$/i.test(f));
      return res.json({ ok: true, output: files.join('\n') || '(no images)', files });
    }

    if (command === 'ping-comfy') {
      const out = await comfyRequest('GET', '/system_stats');
      return res.json({ ok: out.status < 400, output: `Comfy status: ${out.status}`, data: out.data });
    }

    if (command === 'server-status') {
      const mem = process.memoryUsage();
      const providers = {
        openai: Boolean(process.env.OPENAI_API_KEY),
        openrouter: Boolean(process.env.OPENROUTER_API_KEY),
        groq: Boolean(process.env.GROQ_API_KEY),
        together: Boolean(process.env.TOGETHER_API_KEY),
      };
      let pushCount = 0;
      try {
        const countPath = path.join(ROOT_DIR, 'commit_count.txt');
        if (fs.existsSync(countPath)) pushCount = parseInt(fs.readFileSync(countPath, 'utf-8').trim()) || 0;
      } catch {}
      const pushSeed = 6174829301 + pushCount * 1000;
      const charSeeds = { nina: 3847291650, hazel: 9182736450, iris: 5647382910, vale: 7291836450 };
      const output = [
        `Uptime: ${Math.floor(process.uptime())}s`,
        `Memory: ${Math.round(mem.rss/1024/1024)}MB`,
        `Providers: ${Object.entries(providers).filter(([,v])=>v).map(([k])=>k).join(', ')||'none'}`,
        `Push count: #${pushCount} | Push seed: ${pushSeed}`,
        `Char seeds: ${Object.entries(charSeeds).map(([k,v])=>`${k}:${v}`).join(' | ')}`,
      ].join('\n');
      return res.json({ ok: true, output, uptime_sec: Math.floor(process.uptime()), memory: mem, providers, push_count: pushCount, push_seed: pushSeed, char_seeds: charSeeds });
    }

    if (command === 'launch-comfy') {
      const out = launchComfyUI();
      return res.status(out.status).json(out.body);
    }

    return res.status(400).json({ ok: false, error: 'Unhandled command' });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

const WORKFLOW_PATH = path.join(NOTES_DIR, 'workflow.json');
router.get('/workflow', (_req, res) => {
  try {
    const raw = fs.existsSync(WORKFLOW_PATH) ? fs.readFileSync(WORKFLOW_PATH, 'utf-8') : '{}';
    return res.json({ ok: true, workflow: raw });
  } catch (err) { return res.status(500).json({ ok: false, error: err.message }); }
});
router.post('/workflow', (req, res) => {
  try {
    const raw = typeof req.body?.workflow === 'string' ? req.body.workflow : JSON.stringify(req.body?.workflow || {});
    JSON.parse(raw); // validate
    fs.writeFileSync(WORKFLOW_PATH, raw, 'utf-8');
    return res.json({ ok: true });
  } catch (err) { return res.status(400).json({ ok: false, error: err.message }); }
});

router.post('/watcher/start', (_req, res) => res.json(startScreenshotWatcher()));
router.post('/watcher/stop', (_req, res) => res.json(stopScreenshotWatcher()));
router.get('/watcher/status', (_req, res) => res.json({ ok: true, running: !!screenshotWatcher, folder: SCREENSHOTS_DIR }));

router.post('/sync-notes', (req, res) => {
  const syncAll = Boolean(req.body?.all);
  const scriptPath = path.join(ROOT_DIR, 'sync_admin_notes.ps1');
  if (!fs.existsSync(scriptPath)) return res.status(404).json({ ok: false, error: 'sync_admin_notes.ps1 not found in project root' });
  const args = ['-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', scriptPath];
  if (syncAll) args.push('-All');
  const child = spawn('powershell.exe', args, { cwd: ROOT_DIR, stdio: ['ignore', 'pipe', 'pipe'] });
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (d) => { stdout += d.toString(); });
  child.stderr.on('data', (d) => { stderr += d.toString(); });
  child.on('close', (code) => {
    const output = (stdout + (stderr ? '\nSTDERR: ' + stderr : '')).trim();
    if (code === 0) return res.json({ ok: true, output });
    return res.status(500).json({ ok: false, error: `Exit ${code}`, output });
  });
  child.on('error', (err) => res.status(500).json({ ok: false, error: err.message }));
});

router.get('/backend-status', async (_req, res) => {
  let comfyAvailable = false;
  let comfyVersion = null;
  try {
    const out = await comfyRequest('GET', '/system_stats');
    comfyAvailable = out.status < 400;
    comfyVersion = out.data?.system?.comfyui_version || null;
  } catch {}

  return res.json({
    ok: true,
    launchRoute: true,
    comfyAvailable,
    comfyVersion,
    falConfigured: Boolean(process.env.FAL_API_KEY),
  });
});
router.post('/launch-comfy', (req, res) => {
  const out = launchComfyUI();
  return res.status(out.status).json(out.body);
});

router.post('/ai-chat', auth, async (req, res) => {
  const { messages, systemPrompt, providerUrl, providerKey, model } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ ok: false, error: 'messages array required' });
  }
  try {
    let client;
    let modelToUse;
    if (providerUrl && providerKey) {
      client = new OpenAI({ apiKey: providerKey, baseURL: providerUrl });
      modelToUse = model || 'default';
    } else {
      if (!defaultOpenai) return res.status(503).json({ ok: false, error: 'No AI provider configured — add OPENROUTER_API_KEY or similar to .env' });
      client = defaultOpenai;
      modelToUse = model || defaultActiveModel;
    }
    const chatMessages = [];
    if (systemPrompt) chatMessages.push({ role: 'system', content: String(systemPrompt) });
    for (const m of messages) {
      if (m?.role && m?.content) chatMessages.push({ role: m.role, content: String(m.content) });
    }
    const completion = await client.chat.completions.create({
      model: modelToUse,
      messages: chatMessages,
      max_tokens: 2048,
      temperature: 0.85,
    });
    const reply = completion.choices[0]?.message?.content || '';
    return res.json({ ok: true, reply });
  } catch (err) {
    return res.json({ ok: false, error: err.message });
  }
});

export default router;
