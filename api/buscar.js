// Vercel Function for GET /buscar?q=… (rewritten here by vercel.json). Same mock data and shape as the dev server's
// middleware in vite.config.js, so the command palette (⌘K) finds records on the deployed site too.
import { search } from '../mock/records.js';

export default function handler(req, res) {
  const url = new URL(req.url, 'http://localhost');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).send(JSON.stringify({ data: search(url.searchParams.get('q') || '') }));
}
