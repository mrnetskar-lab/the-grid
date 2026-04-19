import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CharacterAIService } from '../../src/engine/services/CharacterAIService.js';
import { CHARACTER_NAME_BY_ID, CHARACTER_PROFILES } from '../../src/engine/brain/characterProfiles.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHARS_DIR = path.resolve(__dirname, '../../characters');

const router = express.Router();
const aiService = new CharacterAIService();

function withTimeout(promise, ms, message = 'AI request timed out') {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(message)), ms);
    }),
  ]).finally(() => clearTimeout(timer));
}

function loadCharacter(id) {
  const p = path.join(CHARS_DIR, `${id}.json`);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

function loadHistory(id) {
  const p = path.join(CHARS_DIR, `${id}.history.json`);
  if (!fs.existsSync(p)) return [];
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')); } catch { return []; }
}

function saveHistory(id, history) {
  const p = path.join(CHARS_DIR, `${id}.history.json`);
  fs.writeFileSync(p, JSON.stringify(history.slice(-200), null, 2), 'utf-8');
}

// GET /api/characters
router.get('/', (_req, res) => {
  try {
    const files = fs.readdirSync(CHARS_DIR)
      .filter(f => f.endsWith('.json') && !f.includes('.history'));
    const characters = files.map(f => {
      const id = f.replace('.json', '');
      try { return { id, ...JSON.parse(fs.readFileSync(path.join(CHARS_DIR, f), 'utf-8')) }; }
      catch { return null; }
    }).filter(Boolean);
    res.json({ ok: true, characters });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/characters/:id/chat
router.post('/:id/chat', async (req, res) => {
  try {
    const char = loadCharacter(req.params.id);
    if (!char) return res.status(404).json({ ok: false, error: 'Character not found' });

    const text = (req.body?.text || '').trim();
    if (!text) return res.status(400).json({ ok: false, error: 'text required' });

    const history = loadHistory(req.params.id);
    const characterName = CHARACTER_NAME_BY_ID[req.params.id] || char.name || req.params.id;
    const personality   = CHARACTER_PROFILES[characterName] || {};
    const memory = history.slice(-10).map((h) => ({
      role: h.role === 'assistant' ? characterName : 'user',
      text: String(h.content || ''),
    }));

    let ai;
    try {
      ai = await withTimeout(
        aiService.generate({
          characterName,
          personality,
          input: text,
          temperature: 0.88,
          context: {
            active_app: { type: 'messages', mode: 'dm', visibility: 'private' },
            conversation: { responseMode: 'brief', topic: 'direct-message' },
            sceneFlow: {
              role: 'primary',
              mainSpeaker: characterName,
              instruction: 'Answer as a private DM.',
            },
            memory,
          },
        }),
        20000
      );
    } catch (aiError) {
      console.warn('Character AI fallback used:', aiError.message);
      ai = { thought: null, spoken: '...' };
    }

    const thought = String(ai?.thought || '').replace(/^\(|\)$/g, '').trim();
    const spoken  = String(ai?.spoken || '').trim();
    const reply   = (thought && spoken ? `*${thought}* ${spoken}` : spoken || '...').trim();

    history.push({ role: 'user', content: text });
    history.push({ role: 'assistant', content: reply });
    saveHistory(req.params.id, history);

    return res.json({
      ok: true,
      reply,
      character: char.name,
      meta: {
        toneClass: ai?.meta?.toneClass || 'neutral',
        subtextStrength: ai?.meta?.subtextStrength ?? 0,
      },
    });
  } catch (error) {
    console.error('Character chat error:', error);
    return res.status(500).json({ ok: false, error: error.message || 'Character chat failed' });
  }
});

// DELETE /api/characters/:id/history
router.delete('/:id/history', (req, res) => {
  saveHistory(req.params.id, []);
  res.json({ ok: true });
});

export default router;
