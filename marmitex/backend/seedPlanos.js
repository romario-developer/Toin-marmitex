import mongoose from 'mongoose';
import PlanoLimitacao from './models/PlanoLimitacao.js';
import dotenv from 'dotenv';

dotenv.config();

// Conectar ao MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/marmitex');
    console.log('✅ Conectado ao MongoDB');
  } catch (error) {
    console.error('❌ Erro ao conectar ao MongoDB:', error);
    process.exit(1);
  }
};

// Dados dos planos
const planosData = [
  {
    tipo: 'gratis',
    nome: 'Plano Grátis',
    preco: 0,
    limitacoes: {
      pedidosPorMes: 50,
      pedidosPorDia: 5,
      itensCardapio: 10,
      numeroWhatsApp: 1,
      funcionalidades: {
        mercadoPago: false,
        relatoriosAvancados: false,
        suportePrioritario: false,
        personalizacaoAvancada: false,
        integracaoAPI: false,
        backupAutomatico: false,
        multiUsuarios: false
      },
      armazenamentoImagens: 50, // 50MB
      tempoSuporte: 'email'
    },
    trial: {
      disponivel: true,
      diasTrial: 14
    },
    ativo: true,
    ordem: 1
  },
  {
    tipo: 'profissional',
    nome: 'Plano Profissional',
    preco: 49.90,
    limitacoes: {
      pedidosPorMes: 500,
      pedidosPorDia: 50,
      itensCardapio: 100,
      numeroWhatsApp: 2,
      funcionalidades: {
        mercadoPago: true,
        relatoriosAvancados: true,
        suportePrioritario: false,
        personalizacaoAvancada: true,
        integracaoAPI: false,
        backupAutomatico: true,
        multiUsuarios: false
      },
      armazenamentoImagens: 500, // 500MB
      tempoSuporte: 'chat'
    },
    trial: {
      disponivel: true,
      diasTrial: 7
    },
    ativo: true,
    ordem: 2
  },
  {
    tipo: 'enterprise',
    nome: 'Plano Enterprise',
    preco: 149.90,
    limitacoes: {
      pedidosPorMes: -1, // Ilimitado
      pedidosPorDia: -1, // Ilimitado
      itensCardapio: -1, // Ilimitado
      numeroWhatsApp: 5,
      funcionalidades: {
        mercadoPago: true,
        relatoriosAvancados: true,
        suportePrioritario: true,
        personalizacaoAvancada: true,
        integracaoAPI: true,
        backupAutomatico: true,
        multiUsuarios: true
      },
      armazenamentoImagens: 2000, // 2GB
      tempoSuporte: 'telefone'
    },
    trial: {
      disponivel: true,
      diasTrial: 14
    },
    ativo: true,
    ordem: 3
  }
];

// Função para criar os planos
const criarPlanos = async () => {
  try {
    console.log('🔄 Criando planos...');
    
    // Limpar planos existentes
    await PlanoLimitacao.deleteMany({});
    console.log('🗑️  Planos existentes removidos');
    
    // Criar novos planos
    for (const planoData of planosData) {
      const plano = new PlanoLimitacao(planoData);
      await plano.save();
      console.log(`✅ Plano '${plano.nome}' criado com sucesso`);
    }
    
    console.log('\n🎉 Todos os planos foram criados com sucesso!');
    
    // Exibir resumo dos planos
    console.log('\n📋 Resumo dos Planos:');
    console.log('=' .repeat(80));
    
    const planos = await PlanoLimitacao.find({}).sort({ ordem: 1 });
    
    planos.forEach(plano => {
      console.log(`\n🏷️  ${plano.nome.toUpperCase()}`);
      console.log(`   💰 Preço: R$ ${plano.preco.toFixed(2)}/mês`);
      console.log(`   📦 Pedidos/mês: ${plano.limitacoes.pedidosPorMes === -1 ? 'Ilimitado' : plano.limitacoes.pedidosPorMes}`);
      console.log(`   📅 Pedidos/dia: ${plano.limitacoes.pedidosPorDia === -1 ? 'Ilimitado' : plano.limitacoes.pedidosPorDia}`);
      console.log(`   🍽️  Itens cardápio: ${plano.limitacoes.itensCardapio === -1 ? 'Ilimitado' : plano.limitacoes.itensCardapio}`);
      console.log(`   📱 WhatsApp: ${plano.limitacoes.numeroWhatsApp} número(s)`);
      console.log(`   💾 Armazenamento: ${plano.limitacoes.armazenamentoImagens}MB`);
      console.log(`   🎯 Suporte: ${plano.limitacoes.tempoSuporte}`);
      
      const funcionalidades = Object.entries(plano.limitacoes.funcionalidades)
        .filter(([key, value]) => value)
        .map(([key]) => key);
      
      if (funcionalidades.length > 0) {
        console.log(`   ⭐ Funcionalidades: ${funcionalidades.join(', ')}`);
      }
      
      if (plano.trial.disponivel) {
        console.log(`   🆓 Trial: ${plano.trial.diasTrial} dias grátis`);
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao criar planos:', error);
  }
};

// Executar o script
const executar = async () => {
  await connectDB();
  await criarPlanos();
  
  console.log('\n✨ Script executado com sucesso!');
  process.exit(0);
};

executar().catch(error => {
  console.error('❌ Erro ao executar script:', error);
  process.exit(1);
});