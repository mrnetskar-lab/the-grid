import express from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { getLooks, setLook, patchLookDefaultInSource } from '../services/CameraService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHARS_DIR = path.resolve(__dirname, '../../characters');
const NOTES_DIR = path.resolve(__dirname, '../../admin_notes');
const NOTES_JSON = path.join(NOTES_DIR, 'notes.json');
const ADMIN_KEY = 'velora-admin-2025';

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
  next();
}

function isValidId(id) {
  return typeof id === 'string' && /^[a-z0-9-]+$/.test(id);
}

function readNotes() {
  try {
    return JSON.parse(fs.readFileSync(NOTES_JSON, 'utf-8'));
  } catch {
    return [];
  }
}

function writeNotes(notes) {
  fs.writeFileSync(NOTES_JSON, JSON.stringify(notes, null, 2), 'utf-8');
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

// GET /api/admin/notes
router.get('/notes', (_req, res) => {
  const notes = readNotes().sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)));
  return res.json({ ok: true, notes });
});

// POST /api/admin/notes (multipart)
router.post('/notes', upload.single('image'), (req, res) => {
  try {
    const text = String(req.body?.note || '').trim();
    const imagePath = req.file ? `/admin_notes/${req.file.filename}` : null;
    if (!text && !imagePath) {
      return res.status(400).json({ ok: false, error: 'note text or image is required' });
    }

    const entry = {
      id: `note_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      timestamp: new Date().toISOString(),
      text,
      imagePath,
    };

    const notes = readNotes();
    notes.unshift(entry);
    writeNotes(notes);

    return res.json({ ok: true, note: entry });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
