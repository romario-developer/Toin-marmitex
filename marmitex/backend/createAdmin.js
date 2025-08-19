// backend/createAdmin.js
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import AdminUser from './models/AdminUser.js';

async function createAdmin() {
  try {
    // Conecta ao MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/marmitex';
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado ao MongoDB');

    // Dados do admin do .env
    const email = process.env.ADMIN_EMAIL || 'romariotecla@icloud.com';
    const password = process.env.ADMIN_PASSWORD || 'Roka1014-';

    // Verifica se já existe
    const existingAdmin = await AdminUser.findOne({ email: email.toLowerCase() });
    if (existingAdmin) {
      console.log('⚠️  Usuário admin já existe:', email);
      process.exit(0);
    }

    // Cria hash da senha
    const passwordHash = await bcrypt.hash(password, 12);

    // Cria o usuário admin
    const admin = await AdminUser.create({
      email: email.toLowerCase(),
      passwordHash
    });

    console.log('✅ Usuário admin criado com sucesso!');
    console.log('📧 Email:', admin.email);
    console.log('🔑 Senha:', password);
    
  } catch (error) {
    console.error('❌ Erro ao criar admin:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

createAdmin();