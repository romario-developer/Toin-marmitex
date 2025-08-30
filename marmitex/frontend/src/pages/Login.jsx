import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Divider
} from '@mui/material';
import { Restaurant } from '@mui/icons-material';
import api from '../services/api.js';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  
  // Mensagem de sucesso do registro
  const successMessage = location.state?.message;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setLoading(true);
    
    try {
      const response = await api.post('/api/clientes/login', { email, senha });
      
      const { data } = response.data;
      
      // Salvar token e dados do usuário
      localStorage.setItem('token', data.token);
      localStorage.setItem('adm_token', data.token); // Para ProtectedRoute
      localStorage.setItem('email', data.cliente.email);
      localStorage.setItem('clienteId', data.cliente.id);
      
      console.log('Login bem-sucedido:', data);
      
      // Redirecionar para o dashboard
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Erro no login:', err);
      if (err.response && err.response.data && err.response.data.message) {
        setErro(err.response.data.message);
      } else {
        setErro('Erro de conexão. Verifique sua internet e tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 4, md: 8 }, px: { xs: 2, md: 3 } }}>
      <Paper sx={{ p: { xs: 3, md: 4 } }}>
        <Box sx={{ textAlign: 'center', mb: { xs: 3, md: 4 } }}>
          <Restaurant sx={{ fontSize: { xs: 40, md: 48 }, color: '#FF6B35', mb: 2 }} />
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, fontSize: { xs: '1.75rem', md: '2.125rem' } }}>
            Entrar
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
            Acesse sua conta Marmitex
          </Typography>
        </Box>

        {successMessage && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {successMessage}
          </Alert>
        )}

        {erro && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {erro}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            sx={{ mb: { xs: 2.5, md: 3 } }}
          />
          
          <TextField
            fullWidth
            label="Senha"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            sx={{ mb: { xs: 2.5, md: 3 } }}
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{ 
              py: { xs: 1.25, md: 1.5 },
              mb: { xs: 2.5, md: 3 },
              fontSize: { xs: '0.875rem', md: '1rem' },
              bgcolor: '#FF6B35',
              '&:hover': { bgcolor: '#E55A2B' }
            }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </Box>

        <Divider sx={{ my: { xs: 2.5, md: 3 } }} />
        
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
            Ainda não tem uma conta?
          </Typography>
          <Button
            component={Link}
            to="/register"
            variant="outlined"
            fullWidth
            sx={{ 
              py: { xs: 1, md: 1.25 },
              fontSize: { xs: '0.875rem', md: '1rem' },
              borderColor: '#FF6B35',
              color: '#FF6B35',
              '&:hover': { 
                borderColor: '#E55A2B',
                bgcolor: 'rgba(255, 107, 53, 0.04)'
              }
            }}
          >
            Criar Conta Grátis
          </Button>
        </Box>
        
        <Box sx={{ textAlign: 'center', mt: { xs: 2.5, md: 3 } }}>
          <Button
            component={Link}
            to="/"
            variant="text"
            size="small"
            sx={{ color: 'text.secondary', fontSize: { xs: '0.75rem', md: '0.875rem' } }}
          >
            ← Voltar ao início
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;
