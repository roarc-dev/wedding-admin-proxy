// Thin wrapper delegating to unified /api/r2 handler
module.exports = async (req, res) => {
  const handler = require('./r2')
  req.body = { ...(req.body || {}), action: 'presign' }
  return handler(req, res)
}
