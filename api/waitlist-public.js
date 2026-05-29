// Vercel serverless function — GET /api/waitlist-public
// Returns only first names + total count. No emails or phone numbers exposed.

const { neon } = require('@neondatabase/serverless');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  // Cache 30s on Vercel's CDN edge — fresh enough for live feel, cheap on DB
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');

  const sql = neon(process.env.DATABASE_URL);
  const rows = await sql`
    SELECT name FROM "remi-waitlist-table" ORDER BY created_at ASC
  `;

  return res.status(200).json({
    count: rows.length,
    names: rows.map(r => r.name),
  });
};
