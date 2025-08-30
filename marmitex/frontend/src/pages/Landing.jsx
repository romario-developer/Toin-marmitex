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
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            py: 2,
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 2, sm: 0 }
          }}>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 'bold', 
                color: '#FF6B35',
                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
                textAlign: { xs: 'center', sm: 'left' }
              }}
            >
              🍽️ MarmitexBot
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              gap: 2,
              flexDirection: { xs: 'column', sm: 'row' },
              width: { xs: '100%', sm: 'auto' }
            }}>
              <Button 
                component={Link} 
                to="/login" 
                variant="outlined"
                sx={{ 
                  minWidth: { xs: '120px', sm: 'auto' },
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }}
              >
                Entrar
              </Button>
              <Button 
                component={Link} 
                to="/register" 
                variant="contained" 
                sx={{ 
                  bgcolor: '#FF6B35',
                  minWidth: { xs: '120px', sm: 'auto' },
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }}
              >
                Cadastrar
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Hero Section */}
      <Box sx={{ 
        background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)', 
        color: 'white', 
        py: { xs: 4, md: 8 },
        minHeight: { xs: 'auto', md: '500px' },
        display: 'flex',
        alignItems: 'center'
      }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography 
                variant="h2" 
                sx={{ 
                  fontWeight: 'bold', 
                  mb: 2,
                  color: '#FFFFFF',
                  fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                  textAlign: { xs: 'center', md: 'left' },
                  textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
                }}
              >
                Automatize seu Delivery de Marmitas
              </Typography>
              <Typography 
                variant="h5" 
                sx={{ 
                  mb: 4, 
                  color: '#FFFFFF',
                  fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem' },
                  textAlign: { xs: 'center', md: 'left' },
                  textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                  lineHeight: 1.4
                }}
              >
                Receba pedidos 24/7 pelo WhatsApp com nosso bot inteligente. 
                Aumente suas vendas em até 300%!
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: { xs: 'center', md: 'flex-start' },
                alignItems: 'center',
                mt: 2
              }}>
                <Button 
                  component={Link}
                  to="/register"
                  variant="contained" 
                  size="large" 
                  sx={{ 
                    bgcolor: 'white', 
                    color: '#FF6B35', 
                    '&:hover': { bgcolor: '#f5f5f5' },
                    minWidth: { xs: '200px', sm: 'auto' },
                    fontSize: { xs: '1rem', sm: '1.125rem' },
                    py: { xs: 1.5, sm: 1 }
                  }}
                >
                  Começar Grátis
                </Button>

              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ 
                textAlign: 'center',
                mt: { xs: 4, md: 0 }
              }}>
                <img 
                  src="/whatsapp-bot-demo.svg" 
                  alt="WhatsApp Bot Demo" 
                  style={{ 
                    maxWidth: '100%', 
                    height: 'auto', 
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }}>
        <Typography 
          variant="h3" 
          align="center" 
          sx={{ 
            mb: 2, 
            fontWeight: 'bold',
            fontSize: { xs: '1.75rem', sm: '2.25rem', md: '3rem' },
            px: { xs: 2, sm: 0 }
          }}
        >
          Tudo que você precisa para vender mais
        </Typography>
        <Typography 
          variant="h6" 
          align="center" 
          sx={{ 
            mb: 6, 
            color: 'text.secondary',
            fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
            px: { xs: 2, sm: 0 }
          }}
        >
          Uma plataforma completa para automatizar e gerenciar seu delivery
        </Typography>
        
        <Grid container spacing={{ xs: 2, md: 4 }}>
          {features.map((feature, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
              <Card sx={{ 
                height: '100%', 
                textAlign: 'center', 
                p: { xs: 1.5, md: 2 },
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                }
              }}>
                <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                  <Box sx={{ mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      mb: 2, 
                      fontWeight: 'bold',
                      fontSize: { xs: '1.1rem', md: '1.25rem' }
                    }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ 
                      fontSize: { xs: '0.875rem', md: '0.875rem' },
                      lineHeight: 1.5
                    }}
                  >
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Benefits Section */}
      <Box sx={{ bgcolor: 'white', py: { xs: 4, md: 8 } }}>
        <Container maxWidth="lg">
          <Grid container spacing={{ xs: 3, md: 4 }} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography 
                variant="h3" 
                sx={{ 
                  mb: 3, 
                  fontWeight: 'bold',
                  fontSize: { xs: '1.75rem', sm: '2.25rem', md: '3rem' },
                  textAlign: { xs: 'center', md: 'left' }
                }}
              >
                Por que escolher o MarmitexBot?
              </Typography>
              <List sx={{ px: { xs: 2, md: 0 } }}>
                {benefits.map((benefit, index) => (
                  <ListItem key={index} sx={{ px: 0, py: { xs: 0.5, md: 1 } }}>
                    <ListItemIcon sx={{ minWidth: { xs: 36, md: 56 } }}>
                      <CheckCircle sx={{ color: '#4CAF50', fontSize: { xs: '1.25rem', md: '1.5rem' } }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary={benefit} 
                      sx={{
                        '& .MuiListItemText-primary': {
                          fontSize: { xs: '0.9rem', md: '1rem' },
                          fontWeight: 500
                        }
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ 
                textAlign: 'center',
                mt: { xs: 3, md: 0 }
              }}>
                <img 
                  src="/benefits-chart.svg" 
                  alt="Benefícios e Relatórios" 
                  style={{ 
                    maxWidth: '100%', 
                    height: 'auto', 
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Pricing Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }}>
        <Typography 
          variant="h3" 
          align="center" 
          sx={{ 
            mb: 2, 
            fontWeight: 'bold',
            fontSize: { xs: '1.75rem', sm: '2.25rem', md: '3rem' },
            px: { xs: 2, sm: 0 }
          }}
        >
          Planos que cabem no seu bolso
        </Typography>
        <Typography 
          variant="h6" 
          align="center" 
          sx={{ 
            mb: 6, 
            color: 'text.secondary',
            fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
            px: { xs: 2, sm: 0 }
          }}
        >
          Comece grátis e escale conforme seu negócio cresce
        </Typography>
        
        <Grid container spacing={{ xs: 2, md: 3 }} justifyContent="center">
          {plans.map((plan, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
              <Card 
                sx={{ 
                  height: '100%', 
                  position: 'relative',
                  border: plan.popular ? `2px solid ${plan.color}` : '1px solid #e0e0e0',
                  transform: { xs: 'none', md: plan.popular ? 'scale(1.05)' : 'none' },
                  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                  '&:hover': {
                    transform: { xs: 'translateY(-4px)', md: plan.popular ? 'scale(1.05) translateY(-4px)' : 'translateY(-4px)' },
                    boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                  }
                }}
              >
                {plan.popular && (
                  <Box 
                    sx={{ 
                      position: 'absolute', 
                      top: { xs: -8, md: -10 }, 
                      left: '50%', 
                      transform: 'translateX(-50%)',
                      bgcolor: plan.color,
                      color: 'white',
                      px: { xs: 1.5, md: 2 },
                      py: 0.5,
                      borderRadius: 1,
                      fontSize: { xs: '0.75rem', md: '0.875rem' },
                      fontWeight: 'bold'
                    }}
                  >
                    MAIS POPULAR
                  </Box>
                )}
                <CardContent sx={{ textAlign: 'center', p: { xs: 2, md: 3 } }}>
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      mb: 1, 
                      fontWeight: 'bold',
                      fontSize: { xs: '1.25rem', md: '1.5rem' }
                    }}
                  >
                    {plan.name}
                  </Typography>
                  <Box sx={{ mb: 3 }}>
                    <Typography 
                      variant="h3" 
                      sx={{ 
                        fontWeight: 'bold', 
                        color: plan.color,
                        fontSize: { xs: '2rem', md: '3rem' }
                      }}
                    >
                      {plan.price}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
                    >
                      {plan.period}
                    </Typography>
                  </Box>
                  <List sx={{ mb: 3 }}>
                    {plan.features.map((feature, idx) => (
                      <ListItem key={idx} sx={{ px: 0, py: { xs: 0.25, md: 0.5 } }}>
                        <ListItemIcon sx={{ minWidth: { xs: 28, md: 32 } }}>
                          <CheckCircle sx={{ fontSize: { xs: 18, md: 20 }, color: plan.color }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary={feature} 
                          primaryTypographyProps={{ fontSize: { xs: '0.8rem', md: '0.875rem' } }}
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
                      fontSize: { xs: '0.875rem', md: '1rem' },
                      py: { xs: 1.5, md: 1 },
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
      <Box id="cadastro" sx={{ bgcolor: '#f8f9fa', py: { xs: 4, md: 8 } }}>
        <Container maxWidth="md">
          <Typography 
            variant="h3" 
            align="center" 
            sx={{ 
              mb: 2, 
              fontWeight: 'bold',
              fontSize: { xs: '1.75rem', sm: '2.25rem', md: '3rem' },
              px: { xs: 2, sm: 0 }
            }}
          >
            Comece hoje mesmo!
          </Typography>
          <Typography 
            variant="h6" 
            align="center" 
            sx={{ 
              mb: 4, 
              color: 'text.secondary',
              fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
              px: { xs: 2, sm: 0 }
            }}
          >
            Preencha o formulário e nossa equipe entrará em contato
          </Typography>
          
          {showSuccess && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Obrigado! Entraremos em contato em breve.
            </Alert>
          )}
          
          <Paper sx={{ p: { xs: 2, md: 4 } }}>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={{ xs: 2, md: 3 }}>
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
                <Grid size={{ xs: 12, sm: 6 }}>
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
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Telefone/WhatsApp"
                    name="telefone"
                    value={formData.telefone}
                    onChange={handleInputChange}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
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
                    sx={{ 
                      bgcolor: '#FF6B35', 
                      py: { xs: 1.5, md: 2 },
                      fontSize: { xs: '1rem', md: '1.125rem' },
                      mt: { xs: 1, md: 0 }
                    }}
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
      <Box sx={{ bgcolor: '#2c3e50', color: 'white', py: { xs: 4, md: 6 } }}>
        <Container maxWidth="lg">
          <Grid container spacing={{ xs: 3, md: 4 }}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold', fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
                🍽️ MarmitexBot
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, fontSize: { xs: '0.875rem', md: '1rem' } }}>
                A solução completa para automatizar seu delivery de marmitas.
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'center', md: 'flex-start' } }}>
                <WhatsApp sx={{ color: '#25D366' }} />
                <Email sx={{ color: '#FF6B35' }} />
                <Phone sx={{ color: '#2196F3' }} />
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', fontSize: { xs: '1.125rem', md: '1.25rem' }, textAlign: { xs: 'center', md: 'left' } }}>
                Recursos
              </Typography>
              <List dense sx={{ textAlign: { xs: 'center', md: 'left' } }}>
                <ListItem sx={{ px: 0, justifyContent: { xs: 'center', md: 'flex-start' } }}>
                  <ListItemText primary="WhatsApp Bot" sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }} />
                </ListItem>
                <ListItem sx={{ px: 0, justifyContent: { xs: 'center', md: 'flex-start' } }}>
                  <ListItemText primary="Gestão de Pedidos" sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }} />
                </ListItem>
                <ListItem sx={{ px: 0, justifyContent: { xs: 'center', md: 'flex-start' } }}>
                  <ListItemText primary="Pagamentos PIX" sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }} />
                </ListItem>
                <ListItem sx={{ px: 0, justifyContent: { xs: 'center', md: 'flex-start' } }}>
                  <ListItemText primary="Relatórios" sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }} />
                </ListItem>
              </List>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', fontSize: { xs: '1.125rem', md: '1.25rem' }, textAlign: { xs: 'center', md: 'left' } }}>
                Suporte
              </Typography>
              <List dense sx={{ textAlign: { xs: 'center', md: 'left' } }}>
                <ListItem sx={{ px: 0, justifyContent: { xs: 'center', md: 'flex-start' } }}>
                  <ListItemText primary="Central de Ajuda" sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }} />
                </ListItem>
                <ListItem sx={{ px: 0, justifyContent: { xs: 'center', md: 'flex-start' } }}>
                  <ListItemText primary="Documentação" sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }} />
                </ListItem>
                <ListItem sx={{ px: 0, justifyContent: { xs: 'center', md: 'flex-start' } }}>
                  <ListItemText primary="Contato" sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }} />
                </ListItem>
                <ListItem sx={{ px: 0, justifyContent: { xs: 'center', md: 'flex-start' } }}>
                  <ListItemText primary="WhatsApp: (11) 99999-9999" sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }} />
                </ListItem>
              </List>
            </Grid>
          </Grid>
          <Divider sx={{ my: { xs: 3, md: 4 }, bgcolor: 'rgba(255,255,255,0.1)' }} />
          <Typography variant="body2" align="center" sx={{ opacity: 0.7, fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
            © 2024 MarmitexBot. Todos os direitos reservados.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default Landing;