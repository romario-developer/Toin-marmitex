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
import PlanoInfo from '../components/PlanoInfo';

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
      
      // Usar o status mais preciso baseado na verificação real da instância
      const isConnected = whatsappResponse.data.whatsapp.isConnected || 
                         whatsappResponse.data.whatsapp.statusConexao === 'connected';
      
      setStats(prev => ({ 
        ...prev, 
        whatsappStatus: isConnected ? 'connected' : 'disconnected'
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
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 }, px: { xs: 2, md: 3 } }}>
        <LinearProgress />
        <Typography variant="h6" sx={{ mt: 2, textAlign: 'center' }}>
          Carregando dashboard...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 }, px: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: { xs: 3, md: 4 } }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, fontSize: { xs: '1.75rem', md: '2.125rem' } }}>
          Olá, {cliente?.nome || 'Cliente'}! 👋
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
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
      <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mb: { xs: 3, md: 4 } }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ShoppingCart sx={{ color: '#FF6B35', mr: 1, fontSize: { xs: 20, md: 24 } }} />
                <Typography variant="h6" sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>Pedidos Hoje</Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#FF6B35', fontSize: { xs: '2rem', md: '3rem' } }}>
                {stats.pedidosHoje}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AttachMoney sx={{ color: '#4CAF50', mr: 1, fontSize: { xs: 20, md: 24 } }} />
                <Typography variant="h6" sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>Vendas Hoje</Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#4CAF50', fontSize: { xs: '2rem', md: '3rem' } }}>
                R$ {stats.vendasHoje?.toFixed(2) || '0.00'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <People sx={{ color: '#2196F3', mr: 1, fontSize: { xs: 20, md: 24 } }} />
                <Typography variant="h6" sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>Clientes Ativos</Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#2196F3', fontSize: { xs: '2rem', md: '3rem' } }}>
                {stats.clientesAtivos}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <WhatsApp sx={{ color: '#25D366', mr: 1, fontSize: { xs: 20, md: 24 } }} />
                <Typography variant="h6" sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>WhatsApp</Typography>
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

      {/* Informações do Plano */}
      <Box sx={{ mb: { xs: 3, md: 4 } }}>
        <PlanoInfo />
      </Box>

      {/* Ações Rápidas */}
      <Grid container spacing={{ xs: 2, md: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: { xs: 2, md: 3 } }}>
            <Typography variant="h6" sx={{ mb: { xs: 2, md: 3 }, display: 'flex', alignItems: 'center', fontSize: { xs: '1rem', md: '1.25rem' } }}>
              <Restaurant sx={{ mr: 1, color: '#FF6B35', fontSize: { xs: 20, md: 24 } }} />
              Ações Rápidas
            </Typography>
            
            <Grid container spacing={{ xs: 1, md: 2 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Button
                  component={Link}
                  to="/cardapio"
                  variant="outlined"
                  fullWidth
                  startIcon={<Restaurant />}
                  sx={{ py: { xs: 1, md: 1.5 }, fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                >
                  Gerenciar Cardápio
                </Button>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Button
                  component={Link}
                  to="/pedidos"
                  variant="outlined"
                  fullWidth
                  startIcon={<ShoppingCart />}
                  sx={{ py: { xs: 1, md: 1.5 }, fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                >
                  Ver Pedidos
                </Button>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Button
                  component={Link}
                  to="/configuracoes"
                  variant="outlined"
                  fullWidth
                  startIcon={<Settings />}
                  sx={{ py: { xs: 1, md: 1.5 }, fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                >
                  Configurações
                </Button>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<WhatsApp />}
                  sx={{ 
                    py: { xs: 1, md: 1.5 },
                    fontSize: { xs: '0.75rem', md: '0.875rem' },
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

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: { xs: 2, md: 3 } }}>
            <Typography variant="h6" sx={{ mb: { xs: 2, md: 3 }, display: 'flex', alignItems: 'center', fontSize: { xs: '1rem', md: '1.25rem' } }}>
              <TrendingUp sx={{ mr: 1, color: '#FF6B35', fontSize: { xs: 20, md: 24 } }} />
              Resumo do Negócio
            </Typography>
            
            <Box sx={{ mb: { xs: 2, md: 3 } }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                Status do Sistema
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircle sx={{ color: 'success.main', fontSize: { xs: 18, md: 20 } }} />
                <Typography variant="body1" sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>Sistema Operacional</Typography>
              </Box>
            </Box>

            <Box sx={{ mb: { xs: 2, md: 3 } }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                Configuração
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={stats.whatsappStatus === 'connected' ? 100 : 50} 
                sx={{ mb: 1 }}
              />
              <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                {stats.whatsappStatus === 'connected' ? 'Configuração Completa' : 'Configure o WhatsApp'}
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                Próximos Passos
              </Typography>
              <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
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