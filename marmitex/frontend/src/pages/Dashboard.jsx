import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Chip,
  LinearProgress,
  Alert
} from '@mui/material';
import {
  Restaurant,
  WhatsApp,
  TrendingUp,
  ShoppingCart,
  AttachMoney,
  People,
  CheckCircle,
  Warning,
  Settings
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import api from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    pedidosHoje: 0,
    vendasHoje: 0,
    clientesAtivos: 0,
    whatsappStatus: 'disconnected'
  });
  const [loading, setLoading] = useState(true);
  const [cliente, setCliente] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Buscar dados do cliente
      const clienteResponse = await api.get('/api/clientes/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setCliente(clienteResponse.data.cliente);

      // Buscar estatísticas
      const statsResponse = await api.get('/api/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setStats(prev => ({ ...prev, ...statsResponse.data.estatisticas }));

      // Verificar status do WhatsApp
      const whatsappResponse = await api.get('/api/clientes/whatsapp/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setStats(prev => ({ 
        ...prev, 
        whatsappStatus: whatsappResponse.data.whatsapp.isConnected ? 'connected' : 'disconnected'
      }));
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWhatsAppStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'success';
      case 'connecting': return 'warning';
      case 'disconnected': return 'error';
      default: return 'default';
    }
  };

  const getWhatsAppStatusText = (status) => {
    switch (status) {
      case 'connected': return 'Conectado';
      case 'connecting': return 'Conectando...';
      case 'disconnected': return 'Desconectado';
      default: return 'Desconhecido';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <LinearProgress />
        <Typography variant="h6" sx={{ mt: 2, textAlign: 'center' }}>
          Carregando dashboard...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          Olá, {cliente?.nome || 'Cliente'}! 👋
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {cliente?.nomeEstabelecimento || 'Seu Estabelecimento'}
        </Typography>
      </Box>

      {/* Status do WhatsApp */}
      {stats.whatsappStatus !== 'connected' && (
        <Alert 
          severity="warning" 
          sx={{ mb: 3 }}
          action={
            <Button 
              component={Link}
              to="/configuracoes"
              color="inherit" 
              size="small"
            >
              Configurar
            </Button>
          }
        >
          Seu WhatsApp não está conectado. Configure agora para receber pedidos!
        </Alert>
      )}

      {/* Cards de Estatísticas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ShoppingCart sx={{ color: '#FF6B35', mr: 1 }} />
                <Typography variant="h6">Pedidos Hoje</Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#FF6B35' }}>
                {stats.pedidosHoje}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AttachMoney sx={{ color: '#4CAF50', mr: 1 }} />
                <Typography variant="h6">Vendas Hoje</Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#4CAF50' }}>
                R$ {stats.vendasHoje?.toFixed(2) || '0.00'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <People sx={{ color: '#2196F3', mr: 1 }} />
                <Typography variant="h6">Clientes Ativos</Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#2196F3' }}>
                {stats.clientesAtivos}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <WhatsApp sx={{ color: '#25D366', mr: 1 }} />
                <Typography variant="h6">WhatsApp</Typography>
              </Box>
              <Chip 
                label={getWhatsAppStatusText(stats.whatsappStatus)}
                color={getWhatsAppStatusColor(stats.whatsappStatus)}
                icon={stats.whatsappStatus === 'connected' ? <CheckCircle /> : <Warning />}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Ações Rápidas */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
              <Restaurant sx={{ mr: 1, color: '#FF6B35' }} />
              Ações Rápidas
            </Typography>
            
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Button
                  component={Link}
                  to="/cardapio"
                  variant="outlined"
                  fullWidth
                  startIcon={<Restaurant />}
                  sx={{ py: 1.5 }}
                >
                  Gerenciar Cardápio
                </Button>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Button
                  component={Link}
                  to="/pedidos"
                  variant="outlined"
                  fullWidth
                  startIcon={<ShoppingCart />}
                  sx={{ py: 1.5 }}
                >
                  Ver Pedidos
                </Button>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Button
                  component={Link}
                  to="/configuracoes"
                  variant="outlined"
                  fullWidth
                  startIcon={<Settings />}
                  sx={{ py: 1.5 }}
                >
                  Configurações
                </Button>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<WhatsApp />}
                  sx={{ 
                    py: 1.5,
                    bgcolor: '#25D366',
                    '&:hover': { bgcolor: '#1DA851' }
                  }}
                  disabled={stats.whatsappStatus !== 'connected'}
                >
                  Testar WhatsApp
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
              <TrendingUp sx={{ mr: 1, color: '#FF6B35' }} />
              Resumo do Negócio
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Status do Sistema
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />
                <Typography variant="body1">Sistema Operacional</Typography>
              </Box>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Configuração
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={stats.whatsappStatus === 'connected' ? 100 : 50} 
                sx={{ mb: 1 }}
              />
              <Typography variant="body2">
                {stats.whatsappStatus === 'connected' ? 'Configuração Completa' : 'Configure o WhatsApp'}
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Próximos Passos
              </Typography>
              <Typography variant="body2">
                {stats.whatsappStatus !== 'connected' 
                  ? '• Conectar WhatsApp para receber pedidos'
                  : '• Seu sistema está pronto para receber pedidos!'
                }
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;