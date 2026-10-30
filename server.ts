import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleChatStream } from './src/server/chatHandler';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '50mb' }));

app.post('/api/chat', (req, res) => {
  handleChatStream(req, res, req.body);
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', college: 'VLITS', regulations: 'R23' });
});

// Serve frontend build output
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Campus Assistant] Server listening on port ${PORT}`);
});
