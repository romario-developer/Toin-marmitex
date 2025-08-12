// backend/middleware/auth.js
import jwt from 'jsonwebtoken';

export function authMiddleware(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ erro: 'Token ausente' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'devsecret');
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ erro: 'Token inválido' });
  }
}
