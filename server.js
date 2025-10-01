import express from 'express';
import fetch from 'node-fetch';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

// Security headers
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 60_000, // 1 minute
  max: 60, // max 60 requests per minute per IP
});
app.use(limiter);

// Serve main.js if you want to serve it from backend (optional)
app.use('/main.js', express.static(path.join(__dirname, 'main.js')));

// CORS for frontend
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-api-key');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Allowed hosts
const ALLOWED_HOSTS = ['www.tiktok.com','api.tiktok.com','example.com'];

// Proxy endpoint
app.get('/proxy', async (req, res) => {
  const url = req.query.url;
  const apiKey = req.headers['x-api-key'];

  if (!apiKey || apiKey !== process.env.API_KEY) return res.status(403).send('Forbidden: Invalid API key');
  if (!url) return res.status(400).send('Missing url');

  try {
    const parsed = new URL(url);
    if (!ALLOWED_HOSTS.includes(parsed.hostname)) return res.status(403).send('Host not allowed');

    const upstream = await fetch(url, { headers: { 'User-Agent': 'C Web Proxy/1.0' } });
    const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    const body = await upstream.arrayBuffer();
    res.status(upstream.status).send(Buffer.from(body));
  } catch (err) {
    console.error(err);
    res.status(500).send('Proxy error');
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('C Web proxy running on port', port));
