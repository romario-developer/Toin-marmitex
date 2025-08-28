import Cliente from '../models/Cliente.js';
import crypto from 'crypto';

// Validar chave PIX
function validarChavePix(chave, tipo) {
  if (!chave || !tipo) return false;
  
  switch (tipo) {
    case 'cpf':
      // Remove caracteres não numéricos e valida CPF
      const cpf = chave.replace(/\D/g, '');
      return cpf.length === 11 && /^\d{11}$/.test(cpf);
      
    case 'cnpj':
      // Remove caracteres não numéricos e valida CNPJ
      const cnpj = chave.replace(/\D/g, '');
      return cnpj.length === 14 && /^\d{14}$/.test(cnpj);
      
    case 'email':
      // Validação básica de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(chave);
      
    case 'telefone':
      // Remove caracteres não numéricos e valida telefone
      const telefone = chave.replace(/\D/g, '');
      return telefone.length >= 10 && telefone.length <= 11 && /^\d+$/.test(telefone);
      
    case 'aleatoria':
      // Chave aleatória deve ter 32 caracteres alfanuméricos
      return /^[a-zA-Z0-9]{32}$/.test(chave);
      
    default:
      return false;
  }
}

// Obter configurações PIX do cliente
export const getConfigPix = async (req, res) => {
  try {
    const { clienteId } = req.cliente;
    
    const cliente = await Cliente.findById(clienteId);
    
    if (!cliente) {
      return res.status(404).json({
        sucesso: false,
        erro: 'Cliente não encontrado'
      });
    }
    
    // Não retornar dados sensíveis como access_token completo
    const configPix = {
      chavePix: cliente.pix.chavePix,
      tipoChave: cliente.pix.tipoChave,
      nomeRecebedor: cliente.pix.nomeRecebedor,
      cidadeRecebedor: cliente.pix.cidadeRecebedor,
      ativo: cliente.pix.ativo,
      mercadoPago: {
        ativo: cliente.mercadoPago.ativo,
        publicKey: cliente.mercadoPago.publicKey,
        // Mascarar access_token para segurança
        accessTokenMascarado: cliente.mercadoPago.accessToken ? 
          `${cliente.mercadoPago.accessToken.substring(0, 8)}...` : null,
        webhookUrl: cliente.mercadoPago.webhookUrl
      }
    };
    
    res.json({
      sucesso: true,
      configPix
    });
  } catch (error) {
    console.error('Erro ao obter configurações PIX:', error);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro interno do servidor'
    });
  }
};

// Atualizar configurações PIX
export const atualizarConfigPix = async (req, res) => {
  try {
    const { clienteId } = req.cliente;
    const { chavePix, tipoChave, nomeRecebedor, cidadeRecebedor, ativo } = req.body;
    
    // Validar chave PIX se fornecida
    if (chavePix && tipoChave) {
      if (!validarChavePix(chavePix, tipoChave)) {
        return res.status(400).json({
          sucesso: false,
          erro: `Chave PIX inválida para o tipo ${tipoChave}`
        });
      }
    }
    
    // Verificar se a chave PIX já está sendo usada por outro cliente
    if (chavePix) {
      const clienteExistente = await Cliente.findOne({
        _id: { $ne: clienteId },
        'pix.chavePix': chavePix
      });
      
      if (clienteExistente) {
        return res.status(400).json({
          sucesso: false,
          erro: 'Esta chave PIX já está sendo utilizada por outro cliente'
        });
      }
    }
    
    const updateData = {};
    if (chavePix !== undefined) updateData['pix.chavePix'] = chavePix;
    if (tipoChave !== undefined) updateData['pix.tipoChave'] = tipoChave;
    if (nomeRecebedor !== undefined) updateData['pix.nomeRecebedor'] = nomeRecebedor;
    if (cidadeRecebedor !== undefined) updateData['pix.cidadeRecebedor'] = cidadeRecebedor;
    if (ativo !== undefined) updateData['pix.ativo'] = ativo;
    
    const cliente = await Cliente.findByIdAndUpdate(
      clienteId,
      updateData,
      { new: true }
    );
    
    if (!cliente) {
      return res.status(404).json({
        sucesso: false,
        erro: 'Cliente não encontrado'
      });
    }
    
    res.json({
      sucesso: true,
      pix: cliente.pix
    });
  } catch (error) {
    console.error('Erro ao atualizar configurações PIX:', error);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro interno do servidor'
    });
  }
};

// Obter configurações Mercado Pago
export const getConfigMercadoPago = async (req, res) => {
  try {
    const { clienteId } = req.cliente;
    
    const cliente = await Cliente.findById(clienteId);
    
    if (!cliente) {
      return res.status(404).json({
        sucesso: false,
        erro: 'Cliente não encontrado'
      });
    }
    
    // Mascarar dados sensíveis
    const configMercadoPago = {
      ativo: cliente.mercadoPago.ativo,
      publicKey: cliente.mercadoPago.publicKey,
      accessTokenMascarado: cliente.mercadoPago.accessToken ? 
        `${cliente.mercadoPago.accessToken.substring(0, 8)}...` : null,
      webhookUrl: cliente.mercadoPago.webhookUrl,
      temAccessToken: !!cliente.mercadoPago.accessToken
    };
    
    res.json({
      sucesso: true,
      mercadoPago: configMercadoPago
    });
  } catch (error) {
    console.error('Erro ao obter configurações Mercado Pago:', error);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro interno do servidor'
    });
  }
};

// Atualizar configurações Mercado Pago
export const atualizarConfigMercadoPago = async (req, res) => {
  try {
    const { clienteId } = req.cliente;
    const { publicKey, accessToken, webhookUrl, ativo } = req.body;
    
    // Validar public key (deve começar com APP_USR)
    if (publicKey && !publicKey.startsWith('APP_USR')) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Public Key inválida. Deve começar com APP_USR'
      });
    }
    
    // Validar access token (deve começar com APP_USR)
    if (accessToken && !accessToken.startsWith('APP_USR')) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Access Token inválido. Deve começar com APP_USR'
      });
    }
    
    // Validar webhook URL se fornecida
    if (webhookUrl && webhookUrl.trim()) {
      try {
        new URL(webhookUrl);
      } catch {
        return res.status(400).json({
          sucesso: false,
          erro: 'URL do webhook inválida'
        });
      }
    }
    
    const updateData = {};
    if (publicKey !== undefined) updateData['mercadoPago.publicKey'] = publicKey;
    if (accessToken !== undefined) updateData['mercadoPago.accessToken'] = accessToken;
    if (webhookUrl !== undefined) updateData['mercadoPago.webhookUrl'] = webhookUrl;
    if (ativo !== undefined) updateData['mercadoPago.ativo'] = ativo;
    
    const cliente = await Cliente.findByIdAndUpdate(
      clienteId,
      updateData,
      { new: true }
    );
    
    if (!cliente) {
      return res.status(404).json({
        sucesso: false,
        erro: 'Cliente não encontrado'
      });
    }
    
    // Retornar dados mascarados
    const mercadoPagoResponse = {
      ativo: cliente.mercadoPago.ativo,
      publicKey: cliente.mercadoPago.publicKey,
      accessTokenMascarado: cliente.mercadoPago.accessToken ? 
        `${cliente.mercadoPago.accessToken.substring(0, 8)}...` : null,
      webhookUrl: cliente.mercadoPago.webhookUrl,
      temAccessToken: !!cliente.mercadoPago.accessToken
    };
    
    res.json({
      sucesso: true,
      mercadoPago: mercadoPagoResponse
    });
  } catch (error) {
    console.error('Erro ao atualizar configurações Mercado Pago:', error);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro interno do servidor'
    });
  }
};

// Testar configurações PIX
export const testarConfigPix = async (req, res) => {
  try {
    const { clienteId } = req.cliente;
    
    const cliente = await Cliente.findById(clienteId);
    
    if (!cliente) {
      return res.status(404).json({
        sucesso: false,
        erro: 'Cliente não encontrado'
      });
    }
    
    const { pix } = cliente;
    
    // Verificar se as configurações estão completas
    const configCompleta = pix.chavePix && 
                          pix.tipoChave && 
                          pix.nomeRecebedor && 
                          pix.cidadeRecebedor;
    
    if (!configCompleta) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Configurações PIX incompletas',
        detalhes: {
          chavePix: !!pix.chavePix,
          tipoChave: !!pix.tipoChave,
          nomeRecebedor: !!pix.nomeRecebedor,
          cidadeRecebedor: !!pix.cidadeRecebedor
        }
      });
    }
    
    // Validar chave PIX
    const chaveValida = validarChavePix(pix.chavePix, pix.tipoChave);
    
    if (!chaveValida) {
      return res.status(400).json({
        sucesso: false,
        erro: `Chave PIX inválida para o tipo ${pix.tipoChave}`
      });
    }
    
    res.json({
      sucesso: true,
      mensagem: 'Configurações PIX válidas',
      configuracao: {
        chavePix: pix.chavePix,
        tipoChave: pix.tipoChave,
        nomeRecebedor: pix.nomeRecebedor,
        cidadeRecebedor: pix.cidadeRecebedor,
        ativo: pix.ativo
      }
    });
  } catch (error) {
    console.error('Erro ao testar configurações PIX:', error);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro interno do servidor'
    });
  }
};

// Gerar QR Code PIX para teste
export const gerarQRCodeTeste = async (req, res) => {
  try {
    const { clienteId } = req.cliente;
    const { valor = 10.00, descricao = 'Teste PIX' } = req.body;
    
    const cliente = await Cliente.findById(clienteId);
    
    if (!cliente) {
      return res.status(404).json({
        sucesso: false,
        erro: 'Cliente não encontrado'
      });
    }
    
    const { pix } = cliente;
    
    if (!pix.ativo || !pix.chavePix) {
      return res.status(400).json({
        sucesso: false,
        erro: 'PIX não está ativo ou chave não configurada'
      });
    }
    
    // Gerar identificador único para o pagamento
    const identificador = crypto.randomBytes(16).toString('hex');
    
    // Criar payload PIX simplificado (EMV)
    const payload = {
      pixKey: pix.chavePix,
      description: descricao,
      merchantName: pix.nomeRecebedor,
      merchantCity: pix.cidadeRecebedor,
      amount: parseFloat(valor).toFixed(2),
      txid: identificador
    };
    
    res.json({
      sucesso: true,
      qrCodeData: payload,
      identificador,
      mensagem: 'QR Code de teste gerado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao gerar QR Code de teste:', error);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro interno do servidor'
    });
  }
};

// Listar tipos de chave PIX disponíveis
export const getTiposChavePix = async (req, res) => {
  try {
    const tiposChave = [
      {
        tipo: 'cpf',
        nome: 'CPF',
        descricao: 'Cadastro de Pessoa Física (11 dígitos)',
        exemplo: '123.456.789-00'
      },
      {
        tipo: 'cnpj',
        nome: 'CNPJ',
        descricao: 'Cadastro Nacional da Pessoa Jurídica (14 dígitos)',
        exemplo: '12.345.678/0001-00'
      },
      {
        tipo: 'email',
        nome: 'E-mail',
        descricao: 'Endereço de e-mail válido',
        exemplo: 'exemplo@email.com'
      },
      {
        tipo: 'telefone',
        nome: 'Telefone',
        descricao: 'Número de telefone celular (10 ou 11 dígitos)',
        exemplo: '(11) 99999-9999'
      },
      {
        tipo: 'aleatoria',
        nome: 'Chave Aleatória',
        descricao: 'Chave gerada automaticamente pelo banco (32 caracteres)',
        exemplo: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
      }
    ];
    
    res.json({
      sucesso: true,
      tiposChave
    });
  } catch (error) {
    console.error('Erro ao obter tipos de chave PIX:', error);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro interno do servidor'
    });
  }
};