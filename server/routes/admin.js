import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getLooks, setLook, patchLookDefaultInSource } from '../services/CameraService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHARS_DIR = path.resolve(__dirname, '../../characters');
const ADMIN_KEY = 'velora-admin-2025';

const router = express.Router();

function requireAdminKey(req, res, next) {
  if (req.header('x-admin-key') !== ADMIN_KEY) {
    return res.status(403).json({ ok: false, error: 'Forbidden' });
  }
  return next();
}

function normalizeId(id) {
  return String(id || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-');
}

router.use(requireAdminKey);

// GET /api/admin/characters
router.get('/characters', (_req, res) => {
  try {
    const files = fs.readdirSync(CHARS_DIR)
      .filter((file) => file.endsWith('.json') && !file.includes('.history') && file !== 'camera_looks.json');

    const characters = files
      .map((file) => {
        const content = fs.readFileSync(path.join(CHARS_DIR, file), 'utf-8');
        const parsed = JSON.parse(content);
        const id = file.replace('.json', '');
        return { id, ...parsed };
      })
      .sort((a, b) => String(a.name || a.id).localeCompare(String(b.name || b.id)));

    return res.json({ ok: true, characters });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

// POST /api/admin/character
router.post('/character', (req, res) => {
  try {
    const body = req.body || {};
    const id = normalizeId(body.id);
    if (!id) return res.status(400).json({ ok: false, error: 'id required' });

    const character = {
      id,
      name: String(body.name || ''),
      color: String(body.color || '#f0308a'),
      status: String(body.status || 'ONLINE'),
      route: String(body.route || ''),
      bio: String(body.bio || ''),
      greeting: String(body.greeting || ''),
      identity: String(body.identity || ''),
      camera_look: String(body.camera_look || ''),
      camera_seed: Number.isFinite(Number(body.camera_seed)) ? Number(body.camera_seed) : null,
      tags: Array.isArray(body.tags)
        ? body.tags.map((tag) => String(tag).trim()).filter(Boolean)
        : String(body.tags || '').split(',').map((tag) => tag.trim()).filter(Boolean),
    };

    const filePath = path.join(CHARS_DIR, `${id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(character, null, 2), 'utf-8');
    return res.json({ ok: true, character });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

// GET /api/admin/camera-looks
router.get('/camera-looks', (_req, res) => {
  return res.json({ ok: true, looks: getLooks() });
});

// POST /api/admin/camera-look
router.post('/camera-look', (req, res) => {
  const id = normalizeId(req.body?.id);
  const value = String(req.body?.value || '').trim();

  if (!id || !value) {
    return res.status(400).json({ ok: false, error: 'id and value required' });
  }

  const saved = setLook(id, value);
  const patched = patchLookDefaultInSource(id, value);

  return res.json({ ok: Boolean(saved), patchedDefault: patched });
});

export default router;
