import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Chip,
  Button,
  Alert,
  Grid
} from '@mui/material';
import {
  TrendingUp,
  Warning,
  CheckCircle,
  Upgrade
} from '@mui/icons-material';
import api from '../services/api';

const PlanoInfo = () => {
  const [planoInfo, setPlanoInfo] = useState(null);
  const [limitacoes, setLimitacoes] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarInformacoes();
  }, []);

  const carregarInformacoes = async () => {
    try {
      setLoading(true);
      
      // Carregar informações do plano atual
      const [planoResponse, limitacoesResponse] = await Promise.all([
        api.get('/api/planos/atual'),
        api.get('/api/planos/limitacoes')
      ]);
      
      setPlanoInfo(planoResponse.data.data);
      setLimitacoes(limitacoesResponse.data.data);
    } catch (error) {
      console.error('Erro ao carregar informações do plano:', error);
    } finally {
      setLoading(false);
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

  const obterCorStatus = (porcentagem) => {
    if (porcentagem >= 90) return 'error';
    if (porcentagem >= 80) return 'warning';
    return 'success';
  };

  const obterCorPlano = (tipo) => {
    switch (tipo) {
      case 'gratis': return 'default';
      case 'profissional': return 'primary';
      case 'enterprise': return 'secondary';
      default: return 'default';
    }
  };

  const obterStatusPlano = (plano) => {
    if (!plano.ativo) return { texto: 'Vencido', cor: 'error', icone: <Warning /> };
    if (plano.trial) return { texto: 'Trial', cor: 'warning', icone: <TrendingUp /> };
    return { texto: 'Ativo', cor: 'success', icone: <CheckCircle /> };
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <TrendingUp sx={{ mr: 1, color: '#FF6B35' }} />
            <Typography variant="h6">Carregando informações do plano...</Typography>
          </Box>
          <LinearProgress />
        </CardContent>
      </Card>
    );
  }

  if (!planoInfo) {
    return (
      <Alert severity="info">
        <Typography variant="body2">
          Faça login para ver as informações do seu plano.
        </Typography>
      </Alert>
    );
  }

  const { plano, uso } = planoInfo || {};
  const status = obterStatusPlano(plano);

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TrendingUp sx={{ mr: 1, color: '#FF6B35' }} />
            <Typography variant="h6">Meu Plano</Typography>
          </Box>
          <Chip
            label={status.texto}
            color={status.cor}
            icon={status.icone}
            size="small"
          />
        </Box>

        <Grid container spacing={3}>
          {/* Informações do Plano */}
          <Grid item xs={12} md={4}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                {plano.nome}
              </Typography>
              <Chip
                label={plano.tipo.charAt(0).toUpperCase() + plano.tipo.slice(1)}
                color={obterCorPlano(plano.tipo)}
                size="small"
                sx={{ mb: 2 }}
              />
              <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                {formatarPreco(plano.preco)}/mês
              </Typography>
              {plano.dataVencimento && (
                <Typography variant="body2" color="text.secondary">
                  Vence em: {new Date(plano.dataVencimento).toLocaleDateString('pt-BR')}
                </Typography>
              )}
            </Box>
          </Grid>

          {/* Uso de Recursos */}
          <Grid item xs={12} md={8}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
              Uso de Recursos
            </Typography>
            
            {/* Pedidos Mensais */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Pedidos este mês</Typography>
                <Typography variant="body2">
                  {uso?.pedidosMes || 0} / {formatarLimite(limitacoes?.pedidosMes || 0)}
                </Typography>
              </Box>
              {limitacoes?.pedidosMes > 0 && (
                <LinearProgress
                  variant="determinate"
                  value={Math.min(((uso?.pedidosMes || 0) / limitacoes.pedidosMes) * 100, 100)}
                  color={obterCorStatus(((uso?.pedidosMes || 0) / limitacoes.pedidosMes) * 100)}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              )}
            </Box>

            {/* Pedidos Diários */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Pedidos hoje</Typography>
                <Typography variant="body2">
                  {uso?.pedidosDia || 0} / {formatarLimite(limitacoes?.pedidosDia || 0)}
                </Typography>
              </Box>
              {limitacoes?.pedidosDia > 0 && (
                <LinearProgress
                  variant="determinate"
                  value={Math.min(((uso?.pedidosDia || 0) / limitacoes.pedidosDia) * 100, 100)}
                  color={obterCorStatus(((uso?.pedidosDia || 0) / limitacoes.pedidosDia) * 100)}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              )}
            </Box>

            {/* Itens do Cardápio */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Itens no cardápio</Typography>
                <Typography variant="body2">
                  {uso?.itensCardapio || 0} / {formatarLimite(limitacoes?.itensCardapio || 0)}
                </Typography>
              </Box>
              {limitacoes?.itensCardapio > 0 && (
                <LinearProgress
                  variant="determinate"
                  value={Math.min(((uso?.itensCardapio || 0) / limitacoes.itensCardapio) * 100, 100)}
                  color={obterCorStatus(((uso?.itensCardapio || 0) / limitacoes.itensCardapio) * 100)}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              )}
            </Box>

            {/* Alertas de Limite */}
            {limitacoes && (
              <Box>
                {(uso?.pedidosMes || 0) / (limitacoes?.pedidosMes || 1) >= 0.9 && limitacoes?.pedidosMes > 0 && (
                  <Alert severity="warning" sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      Você está próximo do limite mensal de pedidos!
                    </Typography>
                  </Alert>
                )}
                {(uso?.pedidosDia || 0) / (limitacoes?.pedidosDia || 1) >= 0.9 && limitacoes?.pedidosDia > 0 && (
                  <Alert severity="warning" sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      Você está próximo do limite diário de pedidos!
                    </Typography>
                  </Alert>
                )}
                {(uso?.itensCardapio || 0) / (limitacoes?.itensCardapio || 1) >= 0.9 && limitacoes?.itensCardapio > 0 && (
                  <Alert severity="warning" sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      Você está próximo do limite de itens no cardápio!
                    </Typography>
                  </Alert>
                )}
              </Box>
            )}
          </Grid>
        </Grid>

        {/* Ações */}
        <Box sx={{ display: 'flex', gap: 2, mt: 3, flexWrap: 'wrap' }}>
          {!plano.ativo && (
            <Button
              component={Link}
              to="/planos"
              variant="contained"
              color="primary"
              startIcon={<Upgrade />}
            >
              Renovar Plano
            </Button>
          )}
          
          {plano.ativo && plano.tipo === 'gratis' && (
            <Button
              component={Link}
              to="/planos"
              variant="contained"
              color="primary"
              startIcon={<Upgrade />}
            >
              Fazer Upgrade
            </Button>
          )}
          
          {plano.ativo && plano.tipo !== 'enterprise' && (
            <Button
              component={Link}
              to="/planos"
              variant="outlined"
              color="primary"
            >
              Ver Outros Planos
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default PlanoInfo;