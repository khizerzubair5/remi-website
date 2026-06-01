// Vercel serverless function — POST /api/waitlist
// Inserts a waitlist signup into Neon (PostgreSQL) and sends a Twilio confirmation SMS.

const { neon } = require('@neondatabase/serverless');
const twilio   = require('twilio');

module.exports = async function handler(req, res) {
  // Only POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const { name, email, phone } = req.body ?? {};

  // Basic validation (phone arrives pre-normalised to E.164 from the client)
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Please enter your first name.' });
  }
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }
  if (!phone || !/^\+1\d{10}$/.test(phone)) {
    return res.status(400).json({ error: 'Please enter a valid US phone number.' });
  }

  const sql = neon(process.env.DATABASE_URL);

  // Duplicate phone check
  const existing = await sql`
    SELECT id FROM "remi-waitlist-table" WHERE phone = ${phone} LIMIT 1
  `;
  if (existing.length > 0) {
    return res.status(409).json({ error: 'This phone number is already on the waitlist.' });
  }

  // Insert into Neon
  await sql`
    INSERT INTO "remi-waitlist-table" (name, email, phone)
    VALUES (${name.trim()}, ${email.trim().toLowerCase()}, ${phone})
  `;

  // Send Twilio confirmation SMS
  // Non-fatal: if Twilio fails, the signup is still recorded.
  try {
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    await client.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      to:   phone,
      body: [
        `Hey ${name.trim()},  You're Remi's waitlist for Fall 2026.`,
        '',
        `Enrollment opens in August - I'll text you when it's time to get set up.`,
        '',
        'Have friends at GMU? Share this link with them: get-remi.com',
        '',
        '- Remi',
        'Reply STOP to unsubscribe',
      ].join('\n'),
    });
  } catch (smsErr) {
    // Log but don't fail the request — the row is already inserted
    console.error('[waitlist] Twilio error:', smsErr.message);
  }

  return res.status(200).json({ success: true });
};
