module.exports = async (req, res) => {
  try {
    const mod = await import('../artifacts/api-server/dist/app.mjs');
    return mod.default(req, res);
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
};
