module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  let step = 'start';
  try {
    step = 'require-jose';
    const { jwtVerify } = require('jose');

    step = 'parse-cookies';
    const cookieHeader = req.headers.cookie || '';
    const cookies = Object.fromEntries(
      cookieHeader.split(';').filter(Boolean).map(c => {
        const [k, ...v] = c.trim().split('=');
        return [k.trim(), v.join('=').trim()];
      })
    );
    const token = cookies['planora_session'];
    if (!token) return res.status(401).json({ error: 'Not signed in.' });

    step = 'verify-token';
    const secret = new TextEncoder().encode(
      process.env.SESSION_SECRET || 'planora-dev-secret-change-in-production'
    );
    const { payload } = await jwtVerify(token, secret);

    return res.status(200).json({
      userId: payload.userId,
      name: payload.name,
      email: payload.email,
    });
  } catch (err) {
    console.error(`[me] failed at step "${step}":`, err);
    if (step === 'verify-token') return res.status(401).json({ error: 'Not signed in.' });
    return res.status(500).json({ error: err.message, step });
  }
};
