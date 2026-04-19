const { verifyJWT } = require('./_jwt');

function parseCookies(h) {
  if (!h) return {};
  return Object.fromEntries(h.split(';').filter(Boolean).map(c => {
    const [k, ...v] = c.trim().split('=');
    return [k.trim(), v.join('=').trim()];
  }));
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const token = parseCookies(req.headers.cookie)['planora_session'];
    if (!token) return res.status(401).json({ error: 'Not signed in.' });
    const payload = verifyJWT(token);
    return res.status(200).json({ userId: payload.userId, name: payload.name, email: payload.email });
  } catch (err) {
    return res.status(401).json({ error: 'Not signed in.' });
  }
};
