import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Check,
  Star,
  TrendingUp,
  Business
} from '@mui/icons-material';
import api from '../services/api';

const Planos = () => {
  const [planos, setPlanos] = useState([]);
  const [planoAtual, setPlanoAtual] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgradeLoading, setUpgradeLoading] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      
      // Carregar planos disponíveis
      const planosResponse = await api.get('/api/planos');
      setPlanos(Array.isArray(planosResponse.data) ? planosResponse.data : []);
      
      // Carregar plano atual do cliente (se autenticado)
      const token = localStorage.getItem('clienteToken');
      if (token) {
        try {
          const planoAtualResponse = await api.get('/api/planos/atual');
          setPlanoAtual(planoAtualResponse.data.data);
        } catch (error) {
          console.log('Cliente não autenticado ou erro ao carregar plano atual');
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar informações dos planos');
    } finally {
      setLoading(false);
    }
  };

  const iniciarTrial = async (tipoPlano) => {
    const token = localStorage.getItem('clienteToken');
    if (!token) {
      toast.info('Faça login para iniciar o período de teste');
      navigate('/login');
      return;
    }

    try {
      setUpgradeLoading(tipoPlano);
      await api.post('/api/planos/trial', { tipoPlano });
      toast.success('Período de teste iniciado com sucesso!');
      carregarDados();
    } catch (error) {
      console.error('Erro ao iniciar trial:', error);
      toast.error(error.response?.data?.erro || 'Erro ao iniciar período de teste');
    } finally {
      setUpgradeLoading(null);
    }
  };

  const fazerUpgrade = async (tipoPlano) => {
    const token = localStorage.getItem('clienteToken');
    if (!token) {
      toast.info('Faça login para fazer upgrade do plano');
      navigate('/login');
      return;
    }

    try {
      setUpgradeLoading(tipoPlano);
      await api.post('/api/planos/upgrade', { novoPlano: tipoPlano });
      toast.success('Upgrade realizado com sucesso!');
      carregarDados();
    } catch (error) {
      console.error('Erro ao fazer upgrade:', error);
      toast.error(error.response?.data?.erro || 'Erro ao fazer upgrade do plano');
    } finally {
      setUpgradeLoading(null);
    }
  };

  const formatarPreco = (preco) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(preco);
  };

  const formatarLimite = (limite) => {
    return limite === -1 ? 'Ilimitado' : limite.toLocaleString('pt-BR');
  };

  const obterStatusPlano = (plano) => {
    if (!planoAtual) return 'disponivel';
    
    const hierarquia = { gratis: 1, profissional: 2, enterprise: 3 };
    const nivelAtual = hierarquia[planoAtual.plano?.tipo] || 0;
    const nivelPlano = hierarquia[plano.tipo] || 0;
    
    if (planoAtual.plano?.tipo === plano.tipo) {
      return planoAtual.plano?.ativo ? 'atual' : 'vencido';
    }
    
    return nivelPlano > nivelAtual ? 'upgrade' : 'downgrade';
  };

  const obterCorPlano = (tipo) => {
    switch (tipo) {
      case 'gratis': return 'default';
      case 'profissional': return 'primary';
      case 'enterprise': return 'secondary';
      default: return 'default';
    }
  };

  const obterIconePlano = (tipo) => {
    switch (tipo) {
      case 'gratis': return <Star />;
      case 'profissional': return <TrendingUp />;
      case 'enterprise': return <Business />;
      default: return <Star />;
    }
  };

  const renderBotaoAcao = (plano) => {
    const status = obterStatusPlano(plano);
    const isLoading = upgradeLoading === plano.tipo;
    
    switch (status) {
      case 'atual':
        return (
          <Button variant="contained" color="success" disabled fullWidth>
            ✓ Plano Atual
          </Button>
        );
      
      case 'vencido':
        return (
          <Button 
            variant="contained"
            color="warning"
            onClick={() => fazerUpgrade(plano.tipo)}
            disabled={isLoading}
            fullWidth
          >
            {isLoading ? <CircularProgress size={20} /> : 'Renovar Plano'}
          </Button>
        );
      
      case 'upgrade':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {plano.trial?.diasGratis > 0 && (
              <Button 
                variant="outlined"
                color="primary"
                onClick={() => iniciarTrial(plano.tipo)}
                disabled={isLoading}
                fullWidth
              >
                {isLoading ? <CircularProgress size={20} /> : `Teste ${plano.trial.diasGratis} dias grátis`}
              </Button>
            )}
            <Button 
              variant="contained"
              color="primary"
              onClick={() => fazerUpgrade(plano.tipo)}
              disabled={isLoading}
              fullWidth
            >
              {isLoading ? <CircularProgress size={20} /> : 'Fazer Upgrade'}
            </Button>
          </Box>
        );
      
      case 'downgrade':
        return (
          <Button variant="outlined" disabled fullWidth>
            Plano Inferior
          </Button>
        );
      
      default:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {plano.trial?.diasGratis > 0 && (
              <Button 
                variant="outlined"
                color="primary"
                onClick={() => iniciarTrial(plano.tipo)}
                disabled={isLoading}
                fullWidth
              >
                {isLoading ? <CircularProgress size={20} /> : `Teste ${plano.trial.diasGratis} dias grátis`}
              </Button>
            )}
            <Button 
              variant="contained"
              color="primary"
              onClick={() => fazerUpgrade(plano.tipo)}
              disabled={isLoading}
              fullWidth
            >
              {isLoading ? <CircularProgress size={20} /> : 'Escolher Plano'}
            </Button>
          </Box>
        );
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Carregando planos...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 2 }}>
          Escolha o Plano Ideal
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Encontre o plano perfeito para o seu negócio
        </Typography>
      </Box>

      {/* Plano Atual */}
      {planoAtual && (
        <Alert 
          severity={planoAtual.plano?.ativo ? 'info' : 'warning'} 
          sx={{ mb: 4 }}
        >
          <Typography variant="body1">
            <strong>Plano Atual:</strong> {planoAtual.plano?.nome} - 
            {planoAtual.plano?.ativo ? 'Ativo' : 'Vencido'}
            {planoAtual.plano?.dataVencimento && (
              <> (Vence em: {new Date(planoAtual.plano.dataVencimento).toLocaleDateString('pt-BR')})</>
            )}
          </Typography>
        </Alert>
      )}

      {/* Grid de Planos */}
      <Grid container spacing={4} justifyContent="center">
        {planos.length === 0 && !loading && (
          <Grid size={12}>
            <Alert severity="info">
              Nenhum plano disponível no momento.
            </Alert>
          </Grid>
        )}
        {planos.map((plano) => {
          const status = obterStatusPlano(plano);
          const isPopular = plano.tipo === 'profissional';
          
          return (
            <Grid size={{ xs: 12, md: 4 }} key={plano._id}>
              <Card 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  border: status === 'atual' ? '2px solid' : '1px solid',
                  borderColor: status === 'atual' ? 'success.main' : 'divider',
                  ...(isPopular && {
                    transform: 'scale(1.05)',
                    boxShadow: 3
                  })
                }}
              >
                {/* Badge Popular */}
                {isPopular && (
                  <Chip
                    label="Mais Popular"
                    color="primary"
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 16,
                      right: 16,
                      zIndex: 1
                    }}
                  />
                )}

                {/* Badge Status */}
                {status === 'atual' && (
                  <Chip
                    label="Atual"
                    color="success"
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 16,
                      left: 16,
                      zIndex: 1
                    }}
                  />
                )}

                <CardContent sx={{ flexGrow: 1, pt: 4 }}>
                  {/* Header do Plano */}
                  <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Box sx={{ mb: 2 }}>
                      {obterIconePlano(plano.tipo)}
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {plano.nome}
                    </Typography>
                    <Chip
                      label={plano.tipo.charAt(0).toUpperCase() + plano.tipo.slice(1)}
                      color={obterCorPlano(plano.tipo)}
                      size="small"
                    />
                  </Box>

                  {/* Preço */}
                  <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      {formatarPreco(plano.preco)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      por mês
                    </Typography>
                  </Box>

                  {/* Limitações */}
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <Check color="success" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={`${formatarLimite(plano.limitacoes.pedidosMes)} pedidos/mês`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <Check color="success" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={`${formatarLimite(plano.limitacoes.pedidosDia)} pedidos/dia`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <Check color="success" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={`${formatarLimite(plano.limitacoes.itensCardapio)} itens no cardápio`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <Check color="success" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={`${formatarLimite(plano.limitacoes.numeroWhatsApp)} número WhatsApp`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <Check color="success" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={`${formatarLimite(plano.limitacoes.armazenamento)}MB armazenamento`}
                      />
                    </ListItem>
                  </List>

                  {/* Funcionalidades */}
                  {plano.funcionalidades && Object.keys(plano.funcionalidades).length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                        Funcionalidades:
                      </Typography>
                      <List dense>
                        {plano.funcionalidades.mercadoPago && (
                          <ListItem>
                            <ListItemIcon>
                              <Check color="success" />
                            </ListItemIcon>
                            <ListItemText primary="Integração Mercado Pago" />
                          </ListItem>
                        )}
                        {plano.funcionalidades.relatorios && (
                          <ListItem>
                            <ListItemIcon>
                              <Check color="success" />
                            </ListItemIcon>
                            <ListItemText primary="Relatórios Avançados" />
                          </ListItem>
                        )}
                        {plano.funcionalidades.suportePrioritario && (
                          <ListItem>
                            <ListItemIcon>
                              <Check color="success" />
                            </ListItemIcon>
                            <ListItemText primary="Suporte Prioritário" />
                          </ListItem>
                        )}
                      </List>
                    </Box>
                  )}
                </CardContent>

                <CardActions sx={{ p: 3, pt: 0 }}>
                  {renderBotaoAcao(plano)}
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Informações Adicionais */}
      <Box sx={{ textAlign: 'center', mt: 6 }}>
        <Typography variant="body2" color="text.secondary">
          Todos os planos incluem suporte técnico e atualizações gratuitas.
          <br />
          Você pode fazer upgrade ou downgrade a qualquer momento.
        </Typography>
      </Box>
    </Container>
  );
};

export default Planos;