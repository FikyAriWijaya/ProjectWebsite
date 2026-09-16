const { kv } = require('@vercel/kv');

// Menangani:
//   POST /api/storage           -> simpan { key, value, shared }
//   GET  /api/storage?prefix=&shared=  -> daftar key (list)
module.exports = async (req, res) => {
  if (req.method === 'POST') {
    const { key, value, shared } = req.body || {};
    if (!key) return res.status(400).json({ error: 'key is required' });
    const storageKey = `${shared ? 'shared' : 'private'}:${key}`;
    await kv.set(storageKey, String(value));
    return res.status(200).json({ key, value, shared: !!shared });
  }

  if (req.method === 'GET') {
    const prefix = req.query.prefix || '';
    const isShared = req.query.shared === 'true';
    const pattern = `${isShared ? 'shared' : 'private'}:${prefix}*`;
    const keys = await kv.keys(pattern);
    const cleanKeys = keys.map((k) => k.replace(/^(shared|private):/, ''));
    return res.status(200).json({ keys: cleanKeys, prefix, shared: isShared });
  }

  res.status(405).json({ error: 'method not allowed' });
};
