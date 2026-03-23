const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Middleware: verifies the JWT in the Authorization header.
 * On success, attaches req.user = { id, username }.
 * On failure, responds with 401.
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized — missing token' });
  }

  const token = authHeader.slice(7); // Strip "Bearer "
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.id, username: payload.username };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized — invalid or expired token' });
  }
}

module.exports = { verifyToken };
