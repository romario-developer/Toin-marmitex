// backend/controllers/authController.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import AdminUser from '../models/AdminUser.js';

export async function login(req, res) {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) return res.status(400).json({ erro: 'Email e senha são obrigatórios' });

    const user = await AdminUser.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(401).json({ erro: 'Credenciais inválidas' });

    const ok = await bcrypt.compare(senha, user.passwordHash);
    if (!ok) return res.status(401).json({ erro: 'Credenciais inválidas' });

    const token = jwt.sign(
      { sub: user._id, email: user.email, role: 'admin' },
      process.env.JWT_SECRET || 'devsecret',
      { expiresIn: '8h' }
    );
    res.json({ token, email: user.email });
  } catch (e) {
    console.error('Erro no login:', e);
    res.status(500).json({ erro: 'Erro no login' });
  }
}
