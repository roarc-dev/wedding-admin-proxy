// Thin wrapper delegating to unified /api/r2 handler
module.exports = async (req, res) => {
  const handler = require('./r2')
  req.query = { ...(req.query || {}), action: 'test' }
  return handler(req, res)
}
