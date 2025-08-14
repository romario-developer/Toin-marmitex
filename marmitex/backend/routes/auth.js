// backend/routes/auth.js
import { Router } from 'express';
import AdminUser from '../models/AdminUser.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password, senha } = req.body || {};
    const pass = password ?? senha;

    if (!email || !pass) {
      return res.status(400).json({ erro: 'Informe email e password.' });
    }

    const user = await AdminUser.findOne({ email: String(email).toLowerCase() });
    if (!user) {
      return res.status(401).json({ erro: 'Credenciais inválidas.' });
    }

    const ok = await bcrypt.compare(pass, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ erro: 'Credenciais inválidas.' });
    }

    const token = jwt.sign(
      { sub: user._id.toString(), email: user.email, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({ token, email: user.email });
  } catch (err) {
    console.error('Erro no login:', err);
    return res.status(500).json({ erro: 'Erro interno.' });
  }
});

// GET /api/auth/me  (debug/validação rápida)
router.get('/me', (req, res) => {
  try {
    const h = req.headers.authorization || '';
    const token = h.startsWith('Bearer ') ? h.slice(7) : null;
    if (!token) return res.status(401).json({ erro: 'Token ausente.' });

    const payload = jwt.verify(token, JWT_SECRET);
    return res.json({ ok: true, email: payload.email });
  } catch {
    return res.status(401).json({ erro: 'Token inválido.' });
  }
});

export default router;
