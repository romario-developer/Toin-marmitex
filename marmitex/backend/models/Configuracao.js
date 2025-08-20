import mongoose from 'mongoose';

const configuracaoSchema = new mongoose.Schema({
  precosMarmita: {
    P: Number,
    M: Number,
    G: Number,
  },
  precosBebida: {
    lata: Number,
    umLitro: Number,
    doisLitros: Number,
  },
  taxaEntrega: {
    type: Number,
    default: 3
  },
  horarioFuncionamento: {
    ativo: {
      type: Boolean,
      default: true
    },
    segunda: {
      ativo: { type: Boolean, default: true },
      abertura: { type: String, default: '11:00' },
      fechamento: { type: String, default: '14:00' }
    },
    terca: {
      ativo: { type: Boolean, default: true },
      abertura: { type: String, default: '11:00' },
      fechamento: { type: String, default: '14:00' }
    },
    quarta: {
      ativo: { type: Boolean, default: true },
      abertura: { type: String, default: '11:00' },
      fechamento: { type: String, default: '14:00' }
    },
    quinta: {
      ativo: { type: Boolean, default: true },
      abertura: { type: String, default: '11:00' },
      fechamento: { type: String, default: '14:00' }
    },
    sexta: {
      ativo: { type: Boolean, default: true },
      abertura: { type: String, default: '11:00' },
      fechamento: { type: String, default: '14:00' }
    },
    sabado: {
      ativo: { type: Boolean, default: true },
      abertura: { type: String, default: '11:00' },
      fechamento: { type: String, default: '14:00' }
    },
    domingo: {
      ativo: { type: Boolean, default: false },
      abertura: { type: String, default: '11:00' },
      fechamento: { type: String, default: '14:00' }
    },
    mensagemForaHorario: {
      type: String,
      default: '🕐 Desculpe, estamos fechados no momento.\n\n📅 Nosso horário de funcionamento:\nSegunda a Sábado: 11:00 às 14:00\nDomingo: Fechado\n\n⏰ Volte durante nosso horário de atendimento!'
    }
  }
});

export default mongoose.model('Configuracao', configuracaoSchema);
