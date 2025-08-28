import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Cliente from '../models/Cliente.js';
import Configuracao from '../models/Configuracao.js';

// Registrar novo cliente
export const registrarCliente = async (req, res) => {
  try {
    const {
      nome,
      nomeEstabelecimento,
      cnpj,
      email,
      telefone,
      senha,
      endereco,
      whatsapp,
      pix,
      configuracoes,
      plano = 'basico'
    } = req.body;

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 10);

    // Verificar se já existe cliente com este email ou CNPJ
    const clienteExistente = await Cliente.findOne({
      $or: [{ email }, { cnpj }]
    });

    if (clienteExistente) {
      return res.status(400).json({
        success: false,
        message: 'Já existe um cliente cadastrado com este email ou CNPJ'
      });
    }

    // Verificar se o número do WhatsApp já está em uso (apenas se fornecido)
    if (whatsapp && whatsapp.numeroPrincipal) {
      const whatsappExistente = await Cliente.findOne({
        'whatsapp.numeroPrincipal': whatsapp.numeroPrincipal
      });

      if (whatsappExistente) {
        return res.status(400).json({
          success: false,
          message: 'Este número do WhatsApp já está sendo usado por outro cliente'
        });
      }
    }

    // Calcular data de vencimento (30 dias para teste)
    const dataVencimento = new Date();
    dataVencimento.setDate(dataVencimento.getDate() + 30);

    // Criar novo cliente
    const novoCliente = new Cliente({
      nomeEstabelecimento,
      ...(cnpj && cnpj.trim() && { cnpj: cnpj.trim() }),
      email,
      telefone,
      senha: senhaHash,
      endereco: {
        rua: endereco?.rua || '',
        numero: endereco?.numero || '',
        complemento: endereco?.complemento || '',
        bairro: endereco?.bairro || '',
        cidade: endereco?.cidade || '',
        estado: endereco?.estado || '',
        cep: endereco?.cep || ''
      },
      whatsapp: whatsapp ? {
        numeroPrincipal: whatsapp.numeroPrincipal || '',
        sessionName: null,
        isConnected: false
      } : {
        numeroPrincipal: '',
        sessionName: null,
        isConnected: false
      },
      pix: pix ? {
        chave: pix.chave || '',
        tipochave: pix.tipochave || 'cpf',
        nomeTitular: pix.nomeTitular || '',
        banco: pix.banco || ''
      } : {
        chave: '',
        tipochave: 'cpf',
        nomeTitular: '',
        banco: ''
      },
      plano: {
        tipo: plano,
        dataVencimento,
        ativo: true
      }
    });

    await novoCliente.save();

    // Criar configuração padrão para o cliente
    const configuracaoPadrao = new Configuracao({
      clienteId: novoCliente._id,
      precosMarmita: {
        P: 12.00,
        M: 15.00,
        G: 18.00
      },
      precosBebida: {
        lata: 4.00,
        umLitro: 8.00,
        doisLitros: 12.00
      },
      taxaEntrega: 3.00
    });

    await configuracaoPadrao.save();

    // Gerar token JWT
    const token = jwt.sign(
      { 
        clienteId: novoCliente._id,
        email: novoCliente.email,
        tipo: 'cliente'
      },
      process.env.JWT_SECRET || 'seu_jwt_secret_aqui',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Cliente registrado com sucesso',
      data: {
        cliente: {
          id: novoCliente._id,
          nomeEstabelecimento: novoCliente.nomeEstabelecimento,
          email: novoCliente.email,
          plano: novoCliente.plano
        },
        token
      }
    });

  } catch (error) {
    console.error('Erro ao registrar cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};

// Login do cliente
export const loginCliente = async (req, res) => {
  try {
    const { email, cnpj, senha } = req.body;

    if (!email && !cnpj) {
      return res.status(400).json({
        success: false,
        message: 'Email ou CNPJ é obrigatório'
      });
    }

    if (!senha) {
      return res.status(400).json({
        success: false,
        message: 'Senha é obrigatória'
      });
    }

    // Buscar cliente por email ou CNPJ
    const cliente = await Cliente.findOne({
      $or: [{ email }, { cnpj }],
      ativo: true
    });

    if (!cliente) {
      return res.status(401).json({
        success: false,
        message: 'Cliente não encontrado ou inativo'
      });
    }

    // Verificar senha
    const senhaValida = await bcrypt.compare(senha, cliente.senha);
    if (!senhaValida) {
      return res.status(401).json({
        success: false,
        message: 'Senha incorreta'
      });
    }

    // Verificar se o plano está ativo
    if (!cliente.isPlanoAtivo()) {
      return res.status(403).json({
        success: false,
        message: 'Plano vencido. Entre em contato para renovar.'
      });
    }

    // Gerar token JWT
    const token = jwt.sign(
      { 
        clienteId: cliente._id,
        email: cliente.email,
        tipo: 'cliente'
      },
      process.env.JWT_SECRET || 'seu_jwt_secret_aqui',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        cliente: {
          id: cliente._id,
          nomeEstabelecimento: cliente.nomeEstabelecimento,
          email: cliente.email,
          plano: cliente.plano,
          whatsapp: {
            numeroPrincipal: cliente.whatsapp.numeroPrincipal,
            isConnected: cliente.whatsapp.isConnected
          }
        },
        token
      }
    });

  } catch (error) {
    console.error('Erro no login do cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};

// Verificar token do cliente
export const verificarToken = async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token não fornecido'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'seu_jwt_secret_aqui');
    
    if (decoded.tipo !== 'cliente') {
      return res.status(403).json({
        success: false,
        message: 'Token inválido para cliente'
      });
    }

    const cliente = await Cliente.findById(decoded.clienteId);
    
    if (!cliente || !cliente.ativo) {
      return res.status(401).json({
        success: false,
        message: 'Cliente não encontrado ou inativo'
      });
    }

    if (!cliente.isPlanoAtivo()) {
      return res.status(403).json({
        success: false,
        message: 'Plano vencido'
      });
    }

    res.json({
      success: true,
      data: {
        cliente: {
          id: cliente._id,
          nomeEstabelecimento: cliente.nomeEstabelecimento,
          email: cliente.email,
          plano: cliente.plano
        }
      }
    });

  } catch (error) {
    console.error('Erro na verificação do token:', error);
    res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }
};

// Atualizar perfil do cliente
export const atualizarPerfil = async (req, res) => {
  try {
    const clienteId = req.clienteId; // Vem do middleware de autenticação
    const updates = req.body;

    // Campos que não podem ser atualizados diretamente
    delete updates._id;
    delete updates.plano;
    delete updates.dataCriacao;

    const cliente = await Cliente.findByIdAndUpdate(
      clienteId,
      { ...updates, dataAtualizacao: new Date() },
      { new: true, runValidators: true }
    );

    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente não encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Perfil atualizado com sucesso',
      data: {
        cliente: {
          id: cliente._id,
          nomeEstabelecimento: cliente.nomeEstabelecimento,
          email: cliente.email,
          telefone: cliente.telefone,
          endereco: cliente.endereco,
          whatsapp: cliente.whatsapp,
          pix: cliente.pix,
          funcionamento: cliente.funcionamento,
          configuracoes: cliente.configuracoes
        }
      }
    });

  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};