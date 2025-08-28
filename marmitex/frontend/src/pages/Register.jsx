import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Grid,
  Alert,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import { Restaurant, Person, Business, Security } from '@mui/icons-material';
import api from '../services/api.js';

const Register = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    // Dados pessoais
    nome: '',
    email: '',
    telefone: '',
    senha: '',
    confirmarSenha: '',
    
    // Dados do estabelecimento
    nomeEstabelecimento: '',
    cnpj: '',
    endereco: '',
    numero: '',
    bairro: '',
    cidade: '',
    estado: '',
    cep: '',
    
    // WhatsApp
    whatsappNumero: '',
    
    // PIX
    pixChave: '',
    pixTipo: '',
    pixTitular: '',
    pixBanco: '',
    
    // Configurações iniciais
    tipoEstabelecimento: '',
    precoMarmitaP: '',
    precoMarmitaM: '',
    precoMarmitaG: '',
    taxaEntrega: '',
    
    // Termos
    aceitaTermos: false,
    aceitaNewsletter: false
  });

  const steps = [
    'Dados Pessoais',
    'Estabelecimento', 
    'Configurações',
    'Finalizar'
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateStep = (step) => {
    switch (step) {
      case 0:
        return formData.nome && formData.email && formData.telefone && 
               formData.senha && formData.senha === formData.confirmarSenha;
      case 1:
        return formData.nomeEstabelecimento && formData.cnpj && formData.endereco && 
               formData.numero && formData.bairro && formData.cidade && formData.estado && formData.cep;
      case 2:
        return formData.whatsappNumero && formData.pixChave && formData.pixTipo && 
               formData.pixTitular && formData.pixBanco && formData.tipoEstabelecimento && 
               formData.precoMarmitaP && formData.precoMarmitaM && formData.precoMarmitaG;
      case 3:
        return formData.aceitaTermos;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
      setError('');
    } else {
      setError('Por favor, preencha todos os campos obrigatórios.');
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
    setError('');
  };

  const handleSubmit = async () => {
    if (!validateStep(activeStep)) {
      setError('Por favor, aceite os termos de uso.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/api/clientes/registro', {
        nome: formData.nome,
        email: formData.email,
        telefone: formData.telefone,
        senha: formData.senha,
        nomeEstabelecimento: formData.nomeEstabelecimento,
        cnpj: formData.cnpj,
        endereco: {
          rua: formData.endereco,
          numero: formData.numero,
          bairro: formData.bairro,
          cidade: formData.cidade,
          estado: formData.estado,
          cep: formData.cep
        },
        whatsapp: {
          numeroPrincipal: formData.whatsappNumero
        },
        pix: {
          chave: formData.pixChave,
          tipochave: formData.pixTipo,
          nomeTitular: formData.pixTitular,
          banco: formData.pixBanco
        },
        configuracoes: {
          tipoEstabelecimento: formData.tipoEstabelecimento,
          precoMarmita: {
            P: parseFloat(formData.precoMarmitaP),
            M: parseFloat(formData.precoMarmitaM),
            G: parseFloat(formData.precoMarmitaG)
          },
          taxaEntrega: parseFloat(formData.taxaEntrega) || 0
        }
      });

      // Com axios, a resposta já vem processada
      setSuccess(true);
      setTimeout(() => {
        navigate('/login', { 
          state: { message: 'Cadastro realizado com sucesso! Faça login para continuar.' }
        });
      }, 2000);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Erro de conexão. Verifique sua internet e tente novamente.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid size={12}>
              <TextField
                fullWidth
                label="Nome Completo"
                name="nome"
                value={formData.nome}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid size={12}>
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
            <Grid size={12}>
              <TextField
                fullWidth
                label="Telefone/WhatsApp"
                name="telefone"
                value={formData.telefone}
                onChange={handleInputChange}
                placeholder="(11) 99999-9999"
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Senha"
                name="senha"
                type="password"
                value={formData.senha}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Confirmar Senha"
                name="confirmarSenha"
                type="password"
                value={formData.confirmarSenha}
                onChange={handleInputChange}
                error={formData.senha !== formData.confirmarSenha && formData.confirmarSenha !== ''}
                helperText={formData.senha !== formData.confirmarSenha && formData.confirmarSenha !== '' ? 'Senhas não coincidem' : ''}
                required
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid size={12}>
              <TextField
                fullWidth
                label="Nome do Estabelecimento"
                name="nomeEstabelecimento"
                value={formData.nomeEstabelecimento}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="CNPJ"
                name="cnpj"
                value={formData.cnpj}
                onChange={handleInputChange}
                placeholder="00.000.000/0000-00"
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="CEP"
                name="cep"
                value={formData.cep}
                onChange={handleInputChange}
                placeholder="00000-000"
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 8 }}>
              <TextField
                fullWidth
                label="Rua/Avenida"
                name="endereco"
                value={formData.endereco}
                onChange={handleInputChange}
                placeholder="Nome da rua ou avenida"
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Número"
                name="numero"
                value={formData.numero}
                onChange={handleInputChange}
                placeholder="123"
                required
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                label="Bairro"
                name="bairro"
                value={formData.bairro}
                onChange={handleInputChange}
                placeholder="Nome do bairro"
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 8 }}>
              <TextField
                fullWidth
                label="Cidade"
                name="cidade"
                value={formData.cidade}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth required>
                <InputLabel>Estado</InputLabel>
                <Select
                  name="estado"
                  value={formData.estado}
                  onChange={handleInputChange}
                  label="Estado"
                >
                  <MenuItem value="SP">São Paulo</MenuItem>
                  <MenuItem value="RJ">Rio de Janeiro</MenuItem>
                  <MenuItem value="MG">Minas Gerais</MenuItem>
                  <MenuItem value="RS">Rio Grande do Sul</MenuItem>
                  <MenuItem value="PR">Paraná</MenuItem>
                  <MenuItem value="SC">Santa Catarina</MenuItem>
                  <MenuItem value="BA">Bahia</MenuItem>
                  <MenuItem value="GO">Goiás</MenuItem>
                  <MenuItem value="PE">Pernambuco</MenuItem>
                  <MenuItem value="CE">Ceará</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid size={12}>
              <FormControl fullWidth required>
                <InputLabel>Tipo de Estabelecimento</InputLabel>
                <Select
                  name="tipoEstabelecimento"
                  value={formData.tipoEstabelecimento}
                  onChange={handleInputChange}
                  label="Tipo de Estabelecimento"
                >
                  <MenuItem value="marmitaria">Marmitaria</MenuItem>
                  <MenuItem value="restaurante">Restaurante</MenuItem>
                  <MenuItem value="lanchonete">Lanchonete</MenuItem>
                  <MenuItem value="delivery">Delivery</MenuItem>
                  <MenuItem value="outro">Outro</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid size={12}>
              <Typography variant="h6" sx={{ mb: 2, mt: 3 }}>
                WhatsApp
              </Typography>
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                label="Número do WhatsApp"
                name="whatsappNumero"
                value={formData.whatsappNumero}
                onChange={handleInputChange}
                placeholder="(11) 99999-9999"
                required
              />
            </Grid>
            
            <Grid size={12}>
              <Typography variant="h6" sx={{ mb: 2, mt: 3 }}>
                Configuração do PIX
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth required>
                <InputLabel>Tipo da Chave PIX</InputLabel>
                <Select
                  name="pixTipo"
                  value={formData.pixTipo}
                  onChange={handleInputChange}
                  label="Tipo da Chave PIX"
                >
                  <MenuItem value="cpf">CPF</MenuItem>
                  <MenuItem value="cnpj">CNPJ</MenuItem>
                  <MenuItem value="email">E-mail</MenuItem>
                  <MenuItem value="telefone">Telefone</MenuItem>
                  <MenuItem value="aleatoria">Chave Aleatória</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Chave PIX"
                name="pixChave"
                value={formData.pixChave}
                onChange={handleInputChange}
                placeholder="Digite sua chave PIX"
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Nome do Titular"
                name="pixTitular"
                value={formData.pixTitular}
                onChange={handleInputChange}
                placeholder="Nome completo do titular"
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Banco"
                name="pixBanco"
                value={formData.pixBanco}
                onChange={handleInputChange}
                placeholder="Nome do banco"
                required
              />
            </Grid>
            
            <Grid size={12}>
              <Typography variant="h6" sx={{ mb: 2, mt: 3 }}>
                Preços das Marmitas
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Marmita P (R$)"
                name="precoMarmitaP"
                type="number"
                value={formData.precoMarmitaP}
                onChange={handleInputChange}
                inputProps={{ step: '0.01', min: '0' }}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Marmita M (R$)"
                name="precoMarmitaM"
                type="number"
                value={formData.precoMarmitaM}
                onChange={handleInputChange}
                inputProps={{ step: '0.01', min: '0' }}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Marmita G (R$)"
                name="precoMarmitaG"
                type="number"
                value={formData.precoMarmitaG}
                onChange={handleInputChange}
                inputProps={{ step: '0.01', min: '0' }}
                required
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                label="Taxa de Entrega (R$)"
                name="taxaEntrega"
                type="number"
                value={formData.taxaEntrega}
                onChange={handleInputChange}
                inputProps={{ step: '0.01', min: '0' }}
                helperText="Deixe em branco se não cobrar taxa de entrega"
              />
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Revisar Informações
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">Nome:</Typography>
                <Typography variant="body1">{formData.nome}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">Email:</Typography>
                <Typography variant="body1">{formData.email}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">Estabelecimento:</Typography>
                <Typography variant="body1">{formData.nomeEstabelecimento}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">Cidade:</Typography>
                <Typography variant="body1">{formData.cidade}, {formData.estado}</Typography>
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 4 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="aceitaTermos"
                    checked={formData.aceitaTermos}
                    onChange={handleInputChange}
                    required
                  />
                }
                label="Aceito os termos de uso e política de privacidade"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    name="aceitaNewsletter"
                    checked={formData.aceitaNewsletter}
                    onChange={handleInputChange}
                  />
                }
                label="Desejo receber novidades por email"
              />
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  if (success) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h4" sx={{ mb: 2, color: 'success.main' }}>
            ✅ Cadastro Realizado!
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Sua conta foi criada com sucesso. Você será redirecionado para o login.
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Restaurant sx={{ fontSize: 48, color: '#FF6B35', mb: 2 }} />
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
            Criar Conta
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Configure sua marmitaria em poucos passos
          </Typography>
        </Box>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 4 }}>
          {renderStepContent(activeStep)}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            variant="outlined"
          >
            Voltar
          </Button>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              component={Link}
              to="/login"
              variant="text"
            >
              Já tenho conta
            </Button>
            
            {activeStep === steps.length - 1 ? (
              <Button
                onClick={handleSubmit}
                variant="contained"
                disabled={loading || !validateStep(activeStep)}
                sx={{ bgcolor: '#FF6B35' }}
              >
                {loading ? 'Criando...' : 'Criar Conta'}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                variant="contained"
                disabled={!validateStep(activeStep)}
                sx={{ bgcolor: '#FF6B35' }}
              >
                Próximo
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Register;