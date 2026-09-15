const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database file — pastikan ini disimpan di Railway Volume supaya datanya tidak
// hilang setiap kali di-redeploy (lihat README.md untuk caranya).
const db = new Database(path.join(__dirname, 'data.db'));
db.exec(`
  CREATE TABLE IF NOT EXISTS kv_store (
    key TEXT NOT NULL,
    shared INTEGER NOT NULL,
    value TEXT NOT NULL,
    updated_at TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (key, shared)
  );
`);

/* ---------- API yang meniru window.storage ---------- */

// GET /api/storage/:key?shared=true|false
app.get('/api/storage/:key', (req, res) => {
  const shared = req.query.shared === 'true' ? 1 : 0;
  const row = db.prepare('SELECT value FROM kv_store WHERE key = ? AND shared = ?').get(req.params.key, shared);
  if (!row) return res.status(404).json({ error: 'not found' });
  res.json({ key: req.params.key, value: row.value, shared: !!shared });
});

// POST /api/storage  { key, value, shared }
app.post('/api/storage', (req, res) => {
  const { key, value, shared } = req.body || {};
  if (!key) return res.status(400).json({ error: 'key is required' });
  const s = shared ? 1 : 0;
  db.prepare(`
    INSERT INTO kv_store (key, shared, value, updated_at)
    VALUES (?, ?, ?, datetime('now'))
    ON CONFLICT(key, shared) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
  `).run(key, s, String(value));
  res.json({ key, value, shared: !!s });
});

// DELETE /api/storage/:key?shared=true|false
app.delete('/api/storage/:key', (req, res) => {
  const shared = req.query.shared === 'true' ? 1 : 0;
  db.prepare('DELETE FROM kv_store WHERE key = ? AND shared = ?').run(req.params.key, shared);
  res.json({ key: req.params.key, deleted: true, shared: !!shared });
});

// GET /api/storage?prefix=xxx&shared=true|false  (list keys)
app.get('/api/storage', (req, res) => {
  const shared = req.query.shared === 'true' ? 1 : 0;
  const prefix = req.query.prefix || '';
  const rows = db.prepare('SELECT key FROM kv_store WHERE shared = ? AND key LIKE ?').all(shared, prefix + '%');
  res.json({ keys: rows.map(r => r.key), prefix, shared: !!shared });
});

// Fallback: selalu kirim index.html untuk request selain /api (single-page app)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Millennial Qurban admin server berjalan di port ${PORT}`);
});
