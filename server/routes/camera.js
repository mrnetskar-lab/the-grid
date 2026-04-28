import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateCameraShot, animateCameraShot, generateTextToVideo, listShots, getLooks, setLook } from '../services/CameraService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGES_DIR = path.resolve(__dirname, '../../images');
const DATA_DIR = path.resolve(__dirname, '../../server/data');
const ECONOMY_PATH = path.resolve(DATA_DIR, 'economy.json');

const SCENE_SPARK_COST = 15;
const SCENE_PULSE_COST = 1;
const SCENE_DAILY_LIMIT = 3;
const SCENE_MONTHLY_LIMIT = 20;

const economyLocks = new Map();

const router = express.Router();

function getRequestIp(req) {
  const xfwd = req.headers['x-forwarded-for'];
  if (typeof xfwd === 'string' && xfwd.trim()) {
    return xfwd.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

function localDateKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function monthKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function userEconomyKey(req) {
  return `ip:${getRequestIp(req)}`;
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function defaultEconomyUser() {
  return {
    sparks: Number(process.env.DEFAULT_SPARKS || 120),
    pulses: Number(process.env.DEFAULT_PULSES || 0),
    usage: {}
  };
}

function readEconomyStore() {
  ensureDataDir();
  if (!fs.existsSync(ECONOMY_PATH)) return { users: {} };
  try {
    const parsed = JSON.parse(fs.readFileSync(ECONOMY_PATH, 'utf-8'));
    if (!parsed || typeof parsed !== 'object') return { users: {} };
    if (!parsed.users || typeof parsed.users !== 'object') parsed.users = {};
    return parsed;
  } catch {
    return { users: {} };
  }
}

function writeEconomyStore(store) {
  ensureDataDir();
  const tmp = `${ECONOMY_PATH}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(store, null, 2), 'utf-8');
  fs.renameSync(tmp, ECONOMY_PATH);
}

function withEconomyLock(key, fn) {
  const previous = economyLocks.get(key) || Promise.resolve();
  const next = previous
    .catch(() => {})
    .then(fn);
  economyLocks.set(key, next.finally(() => {
    if (economyLocks.get(key) === next) economyLocks.delete(key);
  }));
  return next;
}

function getUsageSnapshot(usage) {
  const dayKey = `d_${localDateKey()}`;
  const monKey = `m_${monthKey()}`;
  return {
    daily: usage?.[dayKey] || 0,
    monthly: usage?.[monKey] || 0
  };
}

function incrementUsage(usage) {
  const dayKey = `d_${localDateKey()}`;
  const monKey = `m_${monthKey()}`;
  usage[dayKey] = (usage[dayKey] || 0) + 1;
  usage[monKey] = (usage[monKey] || 0) + 1;
}

// POST /api/camera/generate
// Body: { character?: string, mood?: string, customPrompt?: string, falParams?: object, comfyParams?: object }
router.post('/generate', async (req, res) => {
  const accountKey = userEconomyKey(req);

  try {
    const result = await withEconomyLock(accountKey, async () => {
      const store = readEconomyStore();
      const user = store.users[accountKey] || defaultEconomyUser();
      if (!user.usage || typeof user.usage !== 'object') user.usage = {};

      const beforeUsage = getUsageSnapshot(user.usage);
      const hasBudget = user.sparks >= SCENE_SPARK_COST || user.pulses >= SCENE_PULSE_COST;
      if (!hasBudget) {
        return {
          status: 402,
          body: {
            ok: false,
            error: 'Not enough sparks — earn more by chatting',
            sparksRemaining: user.sparks,
            pulsesRemaining: user.pulses,
            usage: beforeUsage
          }
        };
      }

      if (beforeUsage.daily >= SCENE_DAILY_LIMIT || beforeUsage.monthly >= SCENE_MONTHLY_LIMIT) {
        return {
          status: 429,
          body: {
            ok: false,
            error: `Scene limit reached — ${beforeUsage.daily}/${SCENE_DAILY_LIMIT} today`,
            sparksRemaining: user.sparks,
            pulsesRemaining: user.pulses,
            usage: beforeUsage
          }
        };
      }

      const character = req.body?.character || 'elara';
      const mood = req.body?.mood || 'warm';
      const customPrompt = req.body?.customPrompt || req.body?.prompt || null;
      const falParams = req.body?.falParams || null;
      const comfyParams = req.body?.comfyParams || null;
      const shot = await generateCameraShot({ character, mood, customPrompt, falParams, comfyParams });

      if (user.sparks >= SCENE_SPARK_COST) {
        user.sparks -= SCENE_SPARK_COST;
      } else {
        user.pulses -= SCENE_PULSE_COST;
      }

      incrementUsage(user.usage);
      const usage = getUsageSnapshot(user.usage);
      store.users[accountKey] = user;
      writeEconomyStore(store);

      return {
        status: 200,
        body: {
          ok: true,
          shot,
          imageUrl: shot?.path || null,
          sparksRemaining: user.sparks,
          pulsesRemaining: user.pulses,
          usage
        }
      };
    });

    return res.status(result.status).json(result.body);
  } catch (err) {
    console.error('[Camera] generate error:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/camera/animate
// Body: { imagePath: '/images/shot_xxx.jpg', duration?: 5|10, motion_strength?: number }
router.post('/animate', async (req, res) => {
  try {
    const imagePath = req.body?.imagePath;
    const duration = req.body?.duration;
    const motion_strength = req.body?.motion_strength;
    const video = await animateCameraShot({ imagePath, duration, motion_strength });
    return res.json({ ok: true, path: video.path, video });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/camera/text-to-video
router.post('/text-to-video', async (req, res) => {
  try {
    const prompt = req.body?.prompt;
    const duration = req.body?.duration;
    const aspect_ratio = req.body?.aspect_ratio || '9:16';
    if (!prompt) return res.status(400).json({ ok: false, error: 'prompt required' });
    const result = await generateTextToVideo({ prompt, duration, aspect_ratio });
    return res.json({ ok: true, ...result });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/camera/list
router.get('/list', (_req, res) => {
  res.json({ ok: true, shots: listShots() });
});

// GET /api/camera/prompts — dev only
router.get('/prompts', (_req, res) => {
  res.json({ ok: true, looks: getLooks() });
});

// POST /api/camera/prompts — dev only
// Body: { id: string, value: string, devKey: string }
router.post('/prompts', (req, res) => {
  if (req.body?.devKey !== (process.env.DEV_KEY || 'dev:1337')) {
    return res.status(403).json({ ok: false, error: 'Forbidden' });
  }
  const { id, value } = req.body;
  if (!id || !value) return res.status(400).json({ ok: false, error: 'id and value required' });
  const ok = setLook(id, value);
  return res.json({ ok });
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
