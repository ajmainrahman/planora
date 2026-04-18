module.exports = async (req, res) => {
  try {
    const mod = await import('../artifacts/api-server/dist/app.mjs');
    const app = mod.default;
    return app(req, res);
  } catch (err) {
    console.error('App load error:', err);
    res.status(500).json({ error: err.message });
  }
};
