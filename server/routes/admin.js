import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getLooks, setLook, patchLookDefaultInSource } from '../services/CameraService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHARS_DIR = path.resolve(__dirname, '../../characters');
const ADMIN_KEY = process.env.ADMIN_KEY || 'velora-admin-2025';

const router = express.Router();

function auth(req, res, next) {
  if (req.headers['x-admin-key'] !== ADMIN_KEY) {
    return res.status(403).json({ ok: false, error: 'Forbidden' });
  }
  next();
}

function isValidId(id) {
  return typeof id === 'string' && /^[a-z0-9-]+$/.test(id);
}

router.use(auth);

// GET /api/admin/characters
router.get('/characters', (_req, res) => {
  try {
    const files = fs.readdirSync(CHARS_DIR)
      .filter(f => f.endsWith('.json') && !f.includes('.history') && f !== 'camera_looks.json');
    const characters = files.map(f => {
      try { return JSON.parse(fs.readFileSync(path.join(CHARS_DIR, f), 'utf-8')); } catch { return null; }
    }).filter(Boolean).sort((a, b) => String(a.id || '').localeCompare(String(b.id || '')));
    const looks = getLooks();
    characters.forEach(c => { c.camera_look = looks[c.id] || ''; });
    return res.json({ ok: true, characters });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/admin/characters/:id
router.post('/characters/:id', (req, res) => {
  try {
    const id = String(req.params.id || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!isValidId(id)) {
      return res.status(400).json({ ok: false, error: 'id must be lowercase slug (a-z, 0-9, -)' });
    }
    const filepath = path.join(CHARS_DIR, `${id}.json`);
    if (!filepath.startsWith(CHARS_DIR + path.sep)) {
      return res.status(403).json({ ok: false, error: 'Forbidden' });
    }
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

// GET /api/admin/camera-looks
router.get('/camera-looks', (_req, res) => {
  return res.json({ ok: true, looks: getLooks() });
});

// POST /api/admin/camera-look
router.post('/camera-look', (req, res) => {
  const id = String(req.body?.id || '').trim().toLowerCase();
  const value = String(req.body?.value || req.body?.look || '').trim();
  if (!isValidId(id) || !value) {
    return res.status(400).json({ ok: false, error: 'id and value required' });
  }
  const saved = setLook(id, value);
  const patched = patchLookDefaultInSource(id, value);
  return res.json({ ok: Boolean(saved), patchedDefault: patched, looks: getLooks() });
});

export default router;
