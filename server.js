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

// API routes
app.use('/api/characters', characterRoutes);
app.use('/api/camera', cameraRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, status: 'online' });
});

// SPA fallback
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ ok: false, error: 'Not found' });
  }
  res.sendFile(__dirname + '/index.html');
});

app.listen(PORT, () => {
  console.log(`[THE GRID] running at http://localhost:${PORT}`);
});
