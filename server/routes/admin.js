import express from 'express';
import fs from 'fs';
import path from 'path';
import http from 'http';
import multer from 'multer';
import archiver from 'archiver';
import { fileURLToPath } from 'url';
import { getLooks, setLook, patchLookDefaultInSource } from '../services/CameraService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '../..');
const CHARS_DIR = path.resolve(__dirname, '../../characters');
const IMAGES_DIR = path.resolve(__dirname, '../../images');
const NOTES_DIR = path.resolve(__dirname, '../../admin_notes');
const NOTES_JSON = path.join(NOTES_DIR, 'notes.json');
const COMFY_HOST = '127.0.0.1';
const COMFY_PORT = 8188;
const COMFYUI_OUTPUT_DIR = process.env.COMFYUI_OUTPUT_DIR || 'C:/Users/mn/ComfyUI_windows_portable/ComfyUI/output';
const ADMIN_KEY = process.env.ADMIN_KEY || 'velora-admin-2025';

if (!fs.existsSync(NOTES_DIR)) fs.mkdirSync(NOTES_DIR, { recursive: true });
if (!fs.existsSync(NOTES_JSON)) fs.writeFileSync(NOTES_JSON, '[]', 'utf-8');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, NOTES_DIR),
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}_${safeName}`);
  },
});
const upload = multer({ storage });
const router = express.Router();

function auth(req, res, next) {
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
    const imagePath = req.file ? `/admin_notes/${req.file.filename}` : null;
    if (!text && !imagePath) return res.status(400).json({ ok: false, error: 'note text or image is required' });

    const entry = { id: `note_${Date.now()}_${Math.floor(Math.random() * 10000)}`, timestamp: new Date().toISOString(), text, imagePath };
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
  try {
    if (!req.body?.workflow || typeof req.body.workflow !== 'object') return res.status(400).json({ ok: false, error: 'workflow object required' });
    const out = await comfyRequest('POST', '/prompt', { prompt: req.body.workflow, client_id: 'admin-tool' });
    return res.json({ ok: out.status < 400, prompt_id: out.data?.prompt_id || null, data: out.data });
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
  const allowed = new Set(['clear-all-history', 'clear-images', 'list-images', 'ping-comfy', 'server-status']);
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

    return res.status(400).json({ ok: false, error: 'Unhandled command' });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
