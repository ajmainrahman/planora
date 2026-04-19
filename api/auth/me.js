const { jwtVerify } = require('jose');

function getSecret() {
  return new TextEncoder().encode(
    process.env.SESSION_SECRET || 'planora-dev-secret-change-in-production'
  );
}

function parseCookies(cookieHeader) {
  if (!cookieHeader) return {};
  return Object.fromEntries(
    cookieHeader.split(';').map(c => {
      const [k, ...v] = c.trim().split('=');
      return [k.trim(), v.join('=').trim()];
    })
  );
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies['planora_session'];

    if (!token) return res.status(401).json({ error: 'Not signed in.' });

    const { payload } = await jwtVerify(token, getSecret());
    return res.status(200).json({
      userId: payload.userId,
      name: payload.name,
      email: payload.email,
    });
  } catch (err) {
    console.error('Me error:', err);
    return res.status(401).json({ error: 'Not signed in.' });
  }
};
