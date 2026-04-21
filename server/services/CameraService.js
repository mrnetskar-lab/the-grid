import fs from 'fs';
import path from 'path';
import http from 'http';
import https from 'https';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGES_DIR = path.resolve(__dirname, '../../images');

if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

// ─── Character tables ─────────────────────────────────────────────────────────

const LOOKS_PATH = path.resolve(__dirname, '../../characters/camera_looks.json');

const CHARACTER_LOOKS_DEFAULT = {
  nina:  'a young woman in her mid-twenties, warm and familiar energy, soft brunette features, intimate gaze, naturally beautiful, quiet chemistry',
  hazel: 'a young woman in her late twenties, warm but withholding, sharp observant eyes, composed and elegant, quietly intense',
  iris:  'a young woman in her mid-twenties, melancholic and mysterious, dark expressive eyes, quiet presence, ethereal softness',
  vale:  'a young woman in her mid-twenties, electric and volatile energy, striking features, intense direct gaze, unpredictable beauty',
};

let CHARACTER_LOOKS = { ...CHARACTER_LOOKS_DEFAULT };
try { if (fs.existsSync(LOOKS_PATH)) CHARACTER_LOOKS = { ...CHARACTER_LOOKS_DEFAULT, ...JSON.parse(fs.readFileSync(LOOKS_PATH, 'utf-8')) }; } catch {}

export function getLooks() { return { ...CHARACTER_LOOKS }; }
export function setLook(id, value) {
  if (!id || typeof value !== 'string') return false;
  CHARACTER_LOOKS[id] = value.trim();
  try { fs.writeFileSync(LOOKS_PATH, JSON.stringify(CHARACTER_LOOKS, null, 2), 'utf-8'); } catch {}
  return true;
}

const CHARACTER_SEEDS = {
  nina:  3847291650,
  hazel: 9182736450,
  iris:  5647382910,
  vale:  7291836450,
};

const ATMOSPHERE_STYLES = {
  calm:    'soft natural lighting, muted palette, quiet intimate interior, cinematic still',
  warm:    'warm golden hour light, intimate framing, slightly soft focus',
  charged: 'dramatic side lighting, low lamplight, intense charged atmosphere, close framing',
  tense:   'harsh shadows, cool blue tones, high contrast, unsettling stillness',
};

// ─── Prompt builder ───────────────────────────────────────────────────────────

function buildPrompt(character, mood) {
  const look = CHARACTER_LOOKS[character] || 'a young woman in her mid-twenties, naturally beautiful';
  const atmo = ATMOSPHERE_STYLES[mood] || ATMOSPHERE_STYLES.warm;
  const castLock = 'The only subject is one young woman. No men. No children. No other people.';
  return [
    'High realism photographic still. Cinematic quality. Contemporary setting, present day.',
    castLock,
    `${look}.`,
    atmo + '.',
    'No text, captions, logos, watermarks, UI overlays, or phone screens.',
    'Shot on 35mm film, f/1.8, shallow depth of field, natural film grain.',
    'Photorealistic. Masterpiece quality. Detailed texture. Inspired by Sofia Coppola and Wong Kar-wai. Quiet, realistic, grounded. Not illustrated. Not anime. Not CGI. Ultra-sharp focus.',
  ].join(' ');
}

function getSeed(character, offset = 0) {
  const base = CHARACTER_SEEDS[character];
  return base ? base + offset : Math.floor(Math.random() * 2147483647);
}

// ─── FAL.ai ───────────────────────────────────────────────────────────────────

const FAL_MODELS = [
  {
    id: 'fal-ai/flux-pro/v1.1-ultra',
    body: (prompt) => ({ prompt, aspect_ratio: '2:3', output_format: 'jpeg', safety_tolerance: '6' }),
  },
  {
    id: 'fal-ai/flux-pro/v1.1',
    body: (prompt) => ({ prompt, image_size: 'portrait_4_3', num_inference_steps: 28, guidance_scale: 3.5, num_images: 1, enable_safety_checker: false }),
  },
  {
    id: 'fal-ai/flux-realism',
    body: (prompt) => ({ prompt, image_size: 'portrait_4_3', num_inference_steps: 28, guidance_scale: 3.5, num_images: 1, enable_safety_checker: false }),
  },
];

function falRequest(modelId, body, key) {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify(body);
    const req = https.request({
      hostname: 'fal.run',
      path: `/${modelId}`,
      method: 'POST',
      headers: { 'Authorization': `Key ${key}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(bodyStr) },
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 400) { reject(new Error(`FAL ${modelId} HTTP ${res.statusCode}: ${data.slice(0, 200)}`)); return; }
        try { resolve(JSON.parse(data)); } catch { reject(new Error(`FAL invalid JSON`)); }
      });
    });
    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function generateViaFal(prompt, character) {
  const key = process.env.FAL_API_KEY;
  if (!key) throw new Error('FAL_API_KEY not set');
  const retryDelaysMs = [1000, 2000, 4000];
  let lastError;

  for (const model of FAL_MODELS) {
    for (let attempt = 1; attempt <= retryDelaysMs.length; attempt += 1) {
      try {
        console.log(`[Camera] Trying ${model.id} (attempt ${attempt}/${retryDelaysMs.length})`);
        const data = await falRequest(model.id, model.body(prompt), key);
        const imageUrl = data.images?.[0]?.url;
        if (!imageUrl) throw new Error(`No image URL from ${model.id}`);
        const filename = `shot_${Date.now()}.jpg`;
        await downloadFile(imageUrl, path.join(IMAGES_DIR, filename));
        return { filename, path: `/images/${filename}`, backend: model.id };
      } catch (err) {
        lastError = err;
        console.warn(`[Camera] ${model.id} failed on attempt ${attempt}: ${err.message}`);
        if (attempt < retryDelaysMs.length) {
          await sleep(retryDelaysMs[attempt - 1]);
        }
      }
    }
  }

  throw lastError;
}

// ─── ComfyUI (local only) ─────────────────────────────────────────────────────

const COMFY_HOST = '127.0.0.1';
const COMFY_PORT = 8188;
const SD_MODEL = 'realisticVisionV60B1_v51HyperVAE.safetensors';
const SD_NEGATIVE = '(man:2.0),(male:2.0),(boy:2.0),children,anime,cartoon,watermark,text,ugly,deformed,blurry,low quality';

function comfyRequest(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const req = http.request({ hostname: COMFY_HOST, port: COMFY_PORT, path: urlPath, method,
      headers: { 'Content-Type': 'application/json', ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}) },
    }, (res) => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch { resolve(data); } });
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function isComfyAvailable() {
  try { await comfyRequest('GET', '/system_stats'); return true; } catch { return false; }
}

async function pollComfy(promptId, maxWaitMs = 120000) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    await new Promise(r => setTimeout(r, 1200));
    const history = await comfyRequest('GET', `/history/${promptId}`);
    if (history[promptId]?.outputs) return history[promptId].outputs;
  }
  throw new Error('ComfyUI timed out');
}

async function generateViaComfy(prompt, character, seedOffset = 0) {
  const seed = getSeed(character, seedOffset);
  const workflow = {
    "3": { inputs: { seed, steps: 35, cfg: 7, sampler_name: 'dpm_2m', scheduler: 'karras', denoise: 1, model: ['4', 0], positive: ['6', 0], negative: ['7', 0], latent_image: ['5', 0] }, class_type: 'KSampler' },
    "4": { inputs: { ckpt_name: SD_MODEL }, class_type: 'CheckpointLoaderSimple' },
    "5": { inputs: { width: 512, height: 768, batch_size: 1 }, class_type: 'EmptyLatentImage' },
    "6": { inputs: { text: prompt, clip: ['4', 1] }, class_type: 'CLIPTextEncode' },
    "7": { inputs: { text: SD_NEGATIVE, clip: ['4', 1] }, class_type: 'CLIPTextEncode' },
    "8": { inputs: { samples: ['3', 0], vae: ['4', 2] }, class_type: 'VAEDecode' },
    "9": { inputs: { filename_prefix: 'velora', images: ['8', 0] }, class_type: 'SaveImage' },
  };
  const { prompt_id } = await comfyRequest('POST', '/prompt', { prompt: workflow, client_id: 'velora' });
  if (!prompt_id) throw new Error('No prompt_id from ComfyUI');
  const outputs = await pollComfy(prompt_id);
  const imgData = Object.values(outputs).flatMap(n => n.images || []).find(i => i.type === 'output');
  if (!imgData) throw new Error('No image in ComfyUI output');
  const filename = `shot_${Date.now()}.png`;
  const filepath = path.join(IMAGES_DIR, filename);
  await new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    http.get(`http://${COMFY_HOST}:${COMFY_PORT}/view?filename=${imgData.filename}&subfolder=${imgData.subfolder||''}&type=output`, res => {
      res.pipe(file); file.on('finish', () => file.close(resolve));
    }).on('error', reject);
  });
  return { filename, path: `/images/${filename}`, backend: 'comfyui' };
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function generateCameraShot({ character = 'elara', mood = 'warm', customPrompt } = {}) {
  const prompt = customPrompt || buildPrompt(character, mood);

  if (!customPrompt && await isComfyAvailable()) {
    try { return await generateViaComfy(prompt, character); }
    catch (err) { console.warn('[Camera] ComfyUI failed, falling back:', err.message); }
  }

  if (process.env.FAL_API_KEY) {
    try { return await generateViaFal(prompt, character); }
    catch (err) { console.warn('[Camera] FAL failed, falling back:', err.message); }
  }

  throw new Error('No image generation backend available. Set FAL_API_KEY in environment.');
}

export function listShots() {
  if (!fs.existsSync(IMAGES_DIR)) return [];
  return fs.readdirSync(IMAGES_DIR)
    .filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f))
    .sort().reverse()
    .map(filename => ({ filename, path: `/images/${filename}` }));
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https.get(url, res => { res.pipe(file); file.on('finish', () => file.close(resolve)); })
      .on('error', err => { fs.unlink(destPath, () => {}); reject(err); });
  });
}
