#!/usr/bin/env node
// Local preview that behaves like the Cloudflare Worker for pages: /privacy serves privacy.html, and unknown
// addresses get 404.html with a 404 status. (`wrangler dev` reloads endlessly here, because it watches its own
// .wrangler folder inside the published directory.)
//   node scripts/serve.mjs [port]     (default 8095)
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const port = +(process.argv[2] || 8095);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
  '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json' };

const file = async p => { try { return (await stat(p)).isFile() ? p : null; } catch { return null; } };

createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
  const base = join(root, path);
  const hit = await file(path.endsWith('/') ? join(base, 'index.html') : base) || await file(base + '.html');
  const found = hit && !hit.slice(root.length).split(/[/\\]/).some(s => s.startsWith('.'));
  const p = found ? hit : join(root, '404.html');
  res.writeHead(found ? 200 : 404, { 'content-type': TYPES[extname(p)] || 'application/octet-stream', 'cache-control': 'no-store' });
  res.end(await readFile(p));
}).listen(port, '127.0.0.1', () => console.log(`paruto.com preview on http://localhost:${port}`));
