import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  TextField,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert
} from '@mui/material';
import {
  Restaurant,
  WhatsApp,
  Payment,
  Analytics,
  CheckCircle,
  Phone,
  Email,
  Business,
  Speed,
  Security,
  Support
} from '@mui/icons-material';

const Landing = () => {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    nomeEstabelecimento: ''
  });
  const [showSuccess, setShowSuccess] = useState(false);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Aqui seria feita a integração com a API para cadastro
    console.log('Dados do formulário:', formData);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 5000);
  };

  const features = [
    {
      icon: <WhatsApp sx={{ fontSize: 40, color: '#25D366' }} />,
      title: 'WhatsApp Automatizado',
      description: 'Bot inteligente que recebe pedidos 24/7 via WhatsApp, sem perder nenhuma venda.'
    },
    {
      icon: <Restaurant sx={{ fontSize: 40, color: '#FF6B35' }} />,
      title: 'Gestão de Cardápio',
      description: 'Atualize seu cardápio diariamente e gerencie preços de forma simples e rápida.'
    },
    {
      icon: <Payment sx={{ fontSize: 40, color: '#4CAF50' }} />,
      title: 'Pagamentos PIX',
      description: 'Receba pagamentos instantâneos via PIX com QR Code automático.'
    },
    {
      icon: <Analytics sx={{ fontSize: 40, color: '#2196F3' }} />,
      title: 'Relatórios Completos',
      description: 'Acompanhe suas vendas, clientes e performance com dashboards detalhados.'
    }
  ];

  const benefits = [
    'Aumento de até 300% nas vendas',
    'Redução de 80% no tempo de atendimento',
    'Gestão completa de pedidos e entregas',
    'Integração com Mercado Pago',
    'Suporte técnico especializado',
    'Sem taxa de setup ou mensalidade'
  ];

  const plans = [
    {
      name: 'Starter',
      price: 'Grátis',
      period: 'para sempre',
      features: [
        'Até 100 pedidos/mês',
        'WhatsApp Bot básico',
        'Cardápio simples',
        'Relatórios básicos'
      ],
      color: '#4CAF50',
      popular: false
    },
    {
      name: 'Professional',
      price: 'R$ 49',
      period: '/mês',
      features: [
        'Pedidos ilimitados',
        'WhatsApp Bot avançado',
        'Gestão completa de cardápio',
        'Pagamentos PIX',
        'Relatórios avançados',
        'Suporte prioritário'
      ],
      color: '#2196F3',
      popular: true
    },
    {
      name: 'Enterprise',
      price: 'R$ 99',
      period: '/mês',
      features: [
        'Tudo do Professional',
        'Múltiplas unidades',
        'API personalizada',
        'Integração com delivery',
        'Suporte 24/7',
        'Consultoria especializada'
      ],
      color: '#FF9800',
      popular: false
    }
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {/* Header */}
      <Box sx={{ bgcolor: 'white', boxShadow: 1 }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#FF6B35' }}>
              🍽️ MarmitexBot
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button component={Link} to="/login" variant="outlined">
                Entrar
              </Button>
              <Button component={Link} to="/register" variant="contained" sx={{ bgcolor: '#FF6B35' }}>
                Cadastrar
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Hero Section */}
      <Box sx={{ bgcolor: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)', color: 'white', py: 8 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h2" sx={{ fontWeight: 'bold', mb: 2 }}>
                Automatize seu Delivery de Marmitas
              </Typography>
              <Typography variant="h5" sx={{ mb: 4, opacity: 0.9 }}>
                Receba pedidos 24/7 pelo WhatsApp com nosso bot inteligente. 
                Aumente suas vendas em até 300%!
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button 
                  component={Link}
                  to="/register"
                  variant="contained" 
                  size="large" 
                  sx={{ bgcolor: 'white', color: '#FF6B35', '&:hover': { bgcolor: '#f5f5f5' } }}
                >
                  Começar Grátis
                </Button>
                <Button 
                  variant="outlined" 
                  size="large" 
                  sx={{ borderColor: 'white', color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
                  href="#demo"
                >
                  Ver Demo
                </Button>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ textAlign: 'center' }}>
                <img 
                  src="/api/placeholder/500/400" 
                  alt="WhatsApp Bot Demo" 
                  style={{ maxWidth: '100%', height: 'auto', borderRadius: '12px' }}
                />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" align="center" sx={{ mb: 2, fontWeight: 'bold' }}>
          Tudo que você precisa para vender mais
        </Typography>
        <Typography variant="h6" align="center" sx={{ mb: 6, color: 'text.secondary' }}>
          Uma plataforma completa para automatizar e gerenciar seu delivery
        </Typography>
        
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
              <Card sx={{ height: '100%', textAlign: 'center', p: 2 }}>
                <CardContent>
                  <Box sx={{ mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Benefits Section */}
      <Box sx={{ bgcolor: 'white', py: 8 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h3" sx={{ mb: 3, fontWeight: 'bold' }}>
                Por que escolher o MarmitexBot?
              </Typography>
              <List>
                {benefits.map((benefit, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemIcon>
                      <CheckCircle sx={{ color: '#4CAF50' }} />
                    </ListItemIcon>
                    <ListItemText primary={benefit} />
                  </ListItem>
                ))}
              </List>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ textAlign: 'center' }}>
                <img 
                  src="/api/placeholder/400/300" 
                  alt="Benefícios" 
                  style={{ maxWidth: '100%', height: 'auto', borderRadius: '12px' }}
                />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Pricing Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" align="center" sx={{ mb: 2, fontWeight: 'bold' }}>
          Planos que cabem no seu bolso
        </Typography>
        <Typography variant="h6" align="center" sx={{ mb: 6, color: 'text.secondary' }}>
          Comece grátis e escale conforme seu negócio cresce
        </Typography>
        
        <Grid container spacing={3} justifyContent="center">
          {plans.map((plan, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
              <Card 
                sx={{ 
                  height: '100%', 
                  position: 'relative',
                  border: plan.popular ? `2px solid ${plan.color}` : '1px solid #e0e0e0',
                  transform: plan.popular ? 'scale(1.05)' : 'none'
                }}
              >
                {plan.popular && (
                  <Box 
                    sx={{ 
                      position: 'absolute', 
                      top: -10, 
                      left: '50%', 
                      transform: 'translateX(-50%)',
                      bgcolor: plan.color,
                      color: 'white',
                      px: 2,
                      py: 0.5,
                      borderRadius: 1,
                      fontSize: '0.875rem',
                      fontWeight: 'bold'
                    }}
                  >
                    MAIS POPULAR
                  </Box>
                )}
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <Typography variant="h5" sx={{ mb: 1, fontWeight: 'bold' }}>
                    {plan.name}
                  </Typography>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h3" sx={{ fontWeight: 'bold', color: plan.color }}>
                      {plan.price}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {plan.period}
                    </Typography>
                  </Box>
                  <List sx={{ mb: 3 }}>
                    {plan.features.map((feature, idx) => (
                      <ListItem key={idx} sx={{ px: 0, py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <CheckCircle sx={{ fontSize: 20, color: plan.color }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary={feature} 
                          primaryTypographyProps={{ fontSize: '0.875rem' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                  <Button 
                    component={Link}
                    to="/register"
                    variant={plan.popular ? 'contained' : 'outlined'}
                    fullWidth
                    size="large"
                    sx={{ 
                      bgcolor: plan.popular ? plan.color : 'transparent',
                      borderColor: plan.color,
                      color: plan.popular ? 'white' : plan.color,
                      '&:hover': {
                        bgcolor: plan.popular ? plan.color : `${plan.color}10`
                      }
                    }}
                  >
                    {plan.name === 'Starter' ? 'Começar Grátis' : 'Escolher Plano'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Contact Form */}
      <Box id="cadastro" sx={{ bgcolor: '#f8f9fa', py: 8 }}>
        <Container maxWidth="md">
          <Typography variant="h3" align="center" sx={{ mb: 2, fontWeight: 'bold' }}>
            Comece hoje mesmo!
          </Typography>
          <Typography variant="h6" align="center" sx={{ mb: 4, color: 'text.secondary' }}>
            Preencha o formulário e nossa equipe entrará em contato
          </Typography>
          
          {showSuccess && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Obrigado! Entraremos em contato em breve.
            </Alert>
          )}
          
          <Paper sx={{ p: 4 }}>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Seu Nome"
                    name="nome"
                    value={formData.nome}
                    onChange={handleInputChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Telefone/WhatsApp"
                    name="telefone"
                    value={formData.telefone}
                    onChange={handleInputChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Nome do Estabelecimento"
                    name="nomeEstabelecimento"
                    value={formData.nomeEstabelecimento}
                    onChange={handleInputChange}
                    required
                  />
                </Grid>
                <Grid size={12}>
                  <Button 
                    type="submit"
                    variant="contained" 
                    size="large" 
                    fullWidth
                    sx={{ bgcolor: '#FF6B35', py: 2 }}
                  >
                    Quero Começar Agora!
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Paper>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: '#2c3e50', color: 'white', py: 6 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
                🍽️ MarmitexBot
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                A solução completa para automatizar seu delivery de marmitas.
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <WhatsApp sx={{ color: '#25D366' }} />
                <Email sx={{ color: '#FF6B35' }} />
                <Phone sx={{ color: '#2196F3' }} />
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                Recursos
              </Typography>
              <List dense>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText primary="WhatsApp Bot" />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText primary="Gestão de Pedidos" />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText primary="Pagamentos PIX" />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText primary="Relatórios" />
                </ListItem>
              </List>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                Suporte
              </Typography>
              <List dense>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText primary="Central de Ajuda" />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText primary="Documentação" />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText primary="Contato" />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText primary="WhatsApp: (11) 99999-9999" />
                </ListItem>
              </List>
            </Grid>
          </Grid>
          <Divider sx={{ my: 4, bgcolor: 'rgba(255,255,255,0.1)' }} />
          <Typography variant="body2" align="center" sx={{ opacity: 0.7 }}>
            © 2024 MarmitexBot. Todos os direitos reservados.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default Landing;