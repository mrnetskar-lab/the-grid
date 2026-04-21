import express from 'express';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import characterRoutes from './server/routes/characters.js';
import cameraRoutes from './server/routes/camera.js';
import adminRoutes from './server/routes/admin.js';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.static(__dirname));
app.use('/admin_notes', express.static(__dirname + '/admin_notes'));

// API routes
app.use('/api/characters', characterRoutes);
app.use('/api/camera', cameraRoutes);
app.use('/api/admin', adminRoutes);

// Compatibility shim for older admin tool calls that POST to /api.
app.post('/api', (req, res) => {
  const action = String(req.body?.action || req.body?.command || '').trim().toLowerCase();
  if (['launch-comfy', 'launch_comfy', 'launch comfyui', 'launch-comfyui'].includes(action)) {
    return res.redirect(307, '/api/admin/launch-comfy');
  }
  return res.status(404).json({ ok: false, error: 'API endpoint not found. Use /api/admin/* routes.' });
});

// Always return JSON for unknown API routes/methods.
app.use('/api', (_req, res) => {
  return res.status(404).json({ ok: false, error: 'Not found' });
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, status: 'online' });
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.listen(PORT, () => {
  console.log(`[THE GRID] running at http://localhost:${PORT}`);
});
