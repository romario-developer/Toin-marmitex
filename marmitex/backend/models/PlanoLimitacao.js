import mongoose from 'mongoose';

const planoLimitacaoSchema = new mongoose.Schema({
  tipo: {
    type: String,
    enum: ['gratis', 'profissional', 'enterprise'],
    required: true,
    unique: true
  },
  nome: {
    type: String,
    required: true
  },
  preco: {
    type: Number,
    required: true
  },
  limitacoes: {
    // Limitações de pedidos
    pedidosPorMes: {
      type: Number,
      default: -1 // -1 = ilimitado
    },
    pedidosPorDia: {
      type: Number,
      default: -1
    },
    
    // Limitações de cardápio
    itensCardapio: {
      type: Number,
      default: -1
    },
    
    // Limitações de WhatsApp
    numeroWhatsApp: {
      type: Number,
      default: 1
    },
    
    // Funcionalidades disponíveis
    funcionalidades: {
      mercadoPago: {
        type: Boolean,
        default: false
      },
      relatoriosAvancados: {
        type: Boolean,
        default: false
      },
      suportePrioritario: {
        type: Boolean,
        default: false
      },
      personalizacaoAvancada: {
        type: Boolean,
        default: false
      },
      integracaoAPI: {
        type: Boolean,
        default: false
      },
      backupAutomatico: {
        type: Boolean,
        default: false
      },
      multiUsuarios: {
        type: Boolean,
        default: false
      }
    },
    
    // Limitações de armazenamento
    armazenamentoImagens: {
      type: Number, // em MB
      default: 100
    },
    
    // Limitações de tempo
    tempoSuporte: {
      type: String,
      default: 'email' // email, chat, telefone
    }
  },
  
  // Configurações de trial
  trial: {
    disponivel: {
      type: Boolean,
      default: false
    },
    diasTrial: {
      type: Number,
      default: 0
    }
  },
  
  // Status do plano
  ativo: {
    type: Boolean,
    default: true
  },
  
  // Ordem de exibição
  ordem: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Índices
planoLimitacaoSchema.index({ tipo: 1 });
planoLimitacaoSchema.index({ ativo: 1 });
planoLimitacaoSchema.index({ ordem: 1 });

export default mongoose.model('PlanoLimitacao', planoLimitacaoSchema);