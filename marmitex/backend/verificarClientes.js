import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import Cliente from './models/Cliente.js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Conectar ao MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/marmitex');
    console.log('✅ MongoDB conectado');
  } catch (error) {
    console.error('❌ Erro ao conectar MongoDB:', error);
    process.exit(1);
  }
};

// Verificar clientes existentes
const verificarClientes = async () => {
  try {
    const clientes = await Cliente.find({}).select('email nomeEstabelecimento ativo plano');
    
    console.log('\n📊 CLIENTES CADASTRADOS:');
    console.log('========================');
    
    if (clientes.length === 0) {
      console.log('❌ Nenhum cliente encontrado no banco de dados');
      return false;
    }
    
    clientes.forEach((cliente, index) => {
      console.log(`${index + 1}. ${cliente.nomeEstabelecimento}`);
      console.log(`   Email: ${cliente.email}`);
      console.log(`   Ativo: ${cliente.ativo ? '✅' : '❌'}`);
      console.log(`   Plano: ${cliente.plano.tipo} (${cliente.plano.ativo ? 'Ativo' : 'Inativo'})`);
      console.log(`   Vencimento: ${cliente.plano.dataVencimento}`);
      console.log('   ---');
    });
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao verificar clientes:', error);
    return false;
  }
};

// Criar cliente de teste
const criarClienteTeste = async () => {
  try {
    const senhaHash = await bcrypt.hash('123456', 10);
    
    const dataVencimento = new Date();
    dataVencimento.setDate(dataVencimento.getDate() + 30);
    
    const clienteTeste = new Cliente({
      nomeEstabelecimento: 'Marmitex Teste',
      email: 'teste@marmitex.com',
      telefone: '11999999999',
      senha: senhaHash,
      endereco: {
        rua: 'Rua Teste',
        numero: '123',
        bairro: 'Centro',
        cidade: 'São Paulo',
        estado: 'SP',
        cep: '01000-000'
      },
      whatsapp: {
        numeroPrincipal: '5511999999999',
        sessionName: null,
        isConnected: false
      },
      pix: {
        chave: 'teste@marmitex.com',
        tipo: 'email',
        titular: 'Marmitex Teste',
        banco: 'Banco Teste'
      },
      plano: {
        tipo: 'basico',
        ativo: true,
        dataVencimento: dataVencimento
      },
      ativo: true
    });
    
    await clienteTeste.save();
    
    console.log('\n✅ CLIENTE DE TESTE CRIADO:');
    console.log('===========================');
    console.log('Email: teste@marmitex.com');
    console.log('Senha: 123456');
    console.log('Estabelecimento: Marmitex Teste');
    console.log('Plano: Básico (30 dias)');
    
    return true;
  } catch (error) {
    if (error.code === 11000) {
      console.log('\n⚠️  Cliente de teste já existe!');
      console.log('Email: teste@marmitex.com');
      console.log('Senha: 123456');
      return true;
    }
    console.error('❌ Erro ao criar cliente de teste:', error);
    return false;
  }
};

// Função principal
const main = async () => {
  await connectDB();
  
  const temClientes = await verificarClientes();
  
  if (!temClientes) {
    console.log('\n🔧 Criando cliente de teste...');
    await criarClienteTeste();
  }
  
  console.log('\n✅ Verificação concluída!');
  process.exit(0);
};

// Executar
main().catch(error => {
  console.error('❌ Erro:', error);
  process.exit(1);
});