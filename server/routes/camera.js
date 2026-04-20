import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateCameraShot, listShots } from '../services/CameraService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGES_DIR = path.resolve(__dirname, '../../images');

const router = express.Router();

// POST /api/camera/generate
// Body: { character?: string, mood?: string, prompt?: string }
router.post('/generate', async (req, res) => {
  try {
    const character = req.body?.character || 'elara';
    const mood = req.body?.mood || 'warm';
    const customPrompt = req.body?.prompt || null;
    const shot = await generateCameraShot({ character, mood, customPrompt });
    return res.json({ ok: true, shot });
  } catch (err) {
    console.error('[Camera] generate error:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/camera/list
router.get('/list', (_req, res) => {
  res.json({ ok: true, shots: listShots() });
});

// DELETE /api/camera/:filename
router.delete('/:filename', (req, res) => {
  const filename = path.basename(req.params.filename);
  if (!filename || !/\.(png|jpg|jpeg|webp)$/i.test(filename)) {
    return res.status(400).json({ ok: false, error: 'Invalid filename' });
  }
  const filepath = path.resolve(IMAGES_DIR, filename);
  if (!filepath.startsWith(IMAGES_DIR + path.sep)) {
    return res.status(403).json({ ok: false, error: 'Forbidden' });
  }
  if (!fs.existsSync(filepath)) return res.status(404).json({ ok: false, error: 'Not found' });
  try { fs.unlinkSync(filepath); return res.json({ ok: true }); }
  catch (err) { return res.status(500).json({ ok: false, error: err.message }); }
});

export default router;
