// Use require() so Vercel's bundler statically traces and includes dist/app.cjs
const appModule = require('../artifacts/api-server/dist/app.cjs');
const app = appModule && appModule.default ? appModule.default : appModule;

module.exports = async (req, res) => {
  try {
    return app(req, res);
  } catch (err) {
    console.error('Request handler error:', err);
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json({ error: err.message || 'Internal server error' });
    }
  }
};
