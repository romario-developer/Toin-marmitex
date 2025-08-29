import Cliente from '../models/Cliente.js';

// Obter informações do cliente logado
export const getMe = async (req, res) => {
  try {
    const clienteId = req.clienteId;
    
    const cliente = await Cliente.findById(clienteId).select('-__v');
    
    if (!cliente) {
      return res.status(404).json({
        sucesso: false,
        erro: 'Cliente não encontrado'
      });
    }
    
    res.json({
      sucesso: true,
      cliente: {
        id: cliente._id,
        nomeEstabelecimento: cliente.nomeEstabelecimento,
        cnpj: cliente.cnpj,
        email: cliente.email,
        telefone: cliente.telefone,
        endereco: cliente.endereco,
        whatsapp: cliente.whatsapp,
        pix: cliente.pix,
        funcionamento: cliente.funcionamento,
        configuracoes: cliente.configuracoes,
        plano: cliente.plano,
        dataCriacao: cliente.dataCriacao,
        dataAtualizacao: cliente.dataAtualizacao
      }
    });
  } catch (error) {
    console.error('Erro ao buscar dados do cliente:', error);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro interno do servidor'
    });
  }
};

// Atualizar informações do cliente logado
export const updateMe = async (req, res) => {
  try {
    const clienteId = req.clienteId;
    const updates = req.body;
    
    // Campos que não podem ser atualizados diretamente
    delete updates._id;
    delete updates.plano;
    delete updates.dataCriacao;
    delete updates.ativo;
    
    const cliente = await Cliente.findByIdAndUpdate(
      clienteId,
      { ...updates, dataAtualizacao: new Date() },
      { new: true, runValidators: true }
    ).select('-__v');
    
    if (!cliente) {
      return res.status(404).json({
        sucesso: false,
        erro: 'Cliente não encontrado'
      });
    }
    
    res.json({
      sucesso: true,
      mensagem: 'Dados atualizados com sucesso',
      cliente: {
        id: cliente._id,
        nomeEstabelecimento: cliente.nomeEstabelecimento,
        cnpj: cliente.cnpj,
        email: cliente.email,
        telefone: cliente.telefone,
        endereco: cliente.endereco,
        whatsapp: cliente.whatsapp,
        pix: cliente.pix,
        funcionamento: cliente.funcionamento,
        configuracoes: cliente.configuracoes,
        plano: cliente.plano,
        dataCriacao: cliente.dataCriacao,
        dataAtualizacao: cliente.dataAtualizacao
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar dados do cliente:', error);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro interno do servidor'
    });
  }
};

// Obter status da conexão WhatsApp do cliente
export const getWhatsAppStatus = async (req, res) => {
  try {
    const clienteId = req.clienteId;
    
    const cliente = await Cliente.findById(clienteId).select('whatsapp');
    
    if (!cliente) {
      return res.status(404).json({
        sucesso: false,
        erro: 'Cliente não encontrado'
      });
    }
    
    res.json({
      sucesso: true,
      whatsapp: {
        numeroPrincipal: cliente.whatsapp.numeroPrincipal,
        isConnected: cliente.whatsapp.isConnected,
        sessionName: cliente.whatsapp.sessionName,
        qrCode: cliente.whatsapp.qrCode || null
      }
    });
  } catch (error) {
    console.error('Erro ao buscar status do WhatsApp:', error);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro interno do servidor'
    });
  }
};