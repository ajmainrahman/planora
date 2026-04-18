let app;

module.exports = async (req, res) => {
  if (!app) {
    const mod = await import('../artifacts/api-server/dist/app.mjs');
    app = mod.default;
  }
  return app(req, res);
};
