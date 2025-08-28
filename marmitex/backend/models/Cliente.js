import mongoose from 'mongoose';

const clienteSchema = new mongoose.Schema({
  // Dados básicos do estabelecimento
  nomeEstabelecimento: {
    type: String,
    required: true,
    trim: true
  },
  cnpj: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  telefone: {
    type: String,
    required: true,
    trim: true
  },
  senha: {
    type: String,
    required: true
  },
  
  // Endereço
  endereco: {
    rua: { type: String, required: true },
    numero: { type: String, required: true },
    complemento: { type: String },
    bairro: { type: String, required: true },
    cidade: { type: String, required: true },
    estado: { type: String, required: true },
    cep: { type: String, required: true }
  },
  
  // Configurações do WhatsApp
  whatsapp: {
    numeroPrincipal: {
      type: String,
      required: true,
      trim: true
    },
    sessionName: {
      type: String,
      unique: true,
      sparse: true
    },
    qrCode: {
      type: String
    },
    isConnected: {
      type: Boolean,
      default: false
    },
    lastConnection: {
      type: Date
    }
  },
  
  // Configurações do PIX
  pix: {
    chave: {
      type: String,
      required: true,
      trim: true
    },
    tipochave: {
      type: String,
      enum: ['cpf', 'cnpj', 'email', 'telefone', 'aleatoria'],
      required: true
    },
    nomeTitular: {
      type: String,
      required: true,
      trim: true
    },
    banco: {
      type: String,
      required: true,
      trim: true
    }
  },
  
  // Configurações do Mercado Pago (opcional)
  mercadoPago: {
    accessToken: {
      type: String,
      trim: true
    },
    publicKey: {
      type: String,
      trim: true
    },
    ativo: {
      type: Boolean,
      default: false
    }
  },
  
  // Configurações de funcionamento
  funcionamento: {
    horarios: {
      segunda: { abertura: String, fechamento: String, ativo: { type: Boolean, default: true } },
      terca: { abertura: String, fechamento: String, ativo: { type: Boolean, default: true } },
      quarta: { abertura: String, fechamento: String, ativo: { type: Boolean, default: true } },
      quinta: { abertura: String, fechamento: String, ativo: { type: Boolean, default: true } },
      sexta: { abertura: String, fechamento: String, ativo: { type: Boolean, default: true } },
      sabado: { abertura: String, fechamento: String, ativo: { type: Boolean, default: true } },
      domingo: { abertura: String, fechamento: String, ativo: { type: Boolean, default: false } }
    },
    delivery: {
      ativo: { type: Boolean, default: true },
      taxa: { type: Number, default: 3.00 },
      tempoEstimado: { type: String, default: '30-45 minutos' }
    },
    retirada: {
      ativo: { type: Boolean, default: true },
      tempoEstimado: { type: String, default: '20-30 minutos' }
    }
  },
  
  // Plano e status
  plano: {
    tipo: {
      type: String,
      enum: ['basico', 'premium', 'enterprise'],
      default: 'basico'
    },
    dataVencimento: {
      type: Date,
      required: true
    },
    ativo: {
      type: Boolean,
      default: true
    }
  },
  
  // Configurações personalizadas
  configuracoes: {
    mensagemBoasVindas: {
      type: String,
      default: 'Olá! Bem-vindo ao nosso delivery! 🍕\n\nEscolha uma opção:\n\n1️⃣ Ver cardápio\n2️⃣ Falar com atendente'
    },
    mensagemEncerramento: {
      type: String,
      default: 'Obrigado pela preferência! 😊\n\nSeu pedido foi registrado e em breve entraremos em contato.'
    },
    corTema: {
      type: String,
      default: '#FF6B35'
    }
  },
  
  // Dados de auditoria
  dataCriacao: {
    type: Date,
    default: Date.now
  },
  dataAtualizacao: {
    type: Date,
    default: Date.now
  },
  ativo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Middleware para atualizar dataAtualizacao
clienteSchema.pre('save', function(next) {
  this.dataAtualizacao = new Date();
  next();
});

// Índices para performance
clienteSchema.index({ email: 1 });
clienteSchema.index({ cnpj: 1 });
clienteSchema.index({ 'whatsapp.numeroPrincipal': 1 });
clienteSchema.index({ 'plano.ativo': 1 });

// Método para verificar se o plano está ativo
clienteSchema.methods.isPlanoAtivo = function() {
  return this.plano.ativo && this.plano.dataVencimento > new Date();
};

// Método para gerar sessionName único
clienteSchema.methods.gerarSessionName = function() {
  return `cliente_${this._id}_${Date.now()}`;
};

export default mongoose.model('Cliente', clienteSchema);