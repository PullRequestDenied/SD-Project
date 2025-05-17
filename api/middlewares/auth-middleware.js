const jwt = require('jsonwebtoken');

module.exports.verifySupabaseJwt = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).send('Missing token');

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.sub;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};