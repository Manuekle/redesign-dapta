// Vercel Function for POST /notificaciones/leer (rewritten here by vercel.json): "mark all notifications read".
// Like the dev server's mock, it only acknowledges; the read state lives in the page.
export default function handler(req, res) {
  res.status(204).end();
}
