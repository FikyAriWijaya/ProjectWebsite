const { kv } = require('@vercel/kv');

// Menangani:
//   GET    /api/storage/:key?shared=   -> ambil satu value
//   DELETE /api/storage/:key?shared=   -> hapus satu value
module.exports = async (req, res) => {
  const { key } = req.query;
  const shared = req.query.shared === 'true';
  const storageKey = `${shared ? 'shared' : 'private'}:${key}`;

  if (req.method === 'GET') {
    const value = await kv.get(storageKey);
    if (value === null || value === undefined) {
      return res.status(404).json({ error: 'not found' });
    }
    return res.status(200).json({ key, value, shared });
  }

  if (req.method === 'DELETE') {
    await kv.del(storageKey);
    return res.status(200).json({ key, deleted: true, shared });
  }

  res.status(405).json({ error: 'method not allowed' });
};
