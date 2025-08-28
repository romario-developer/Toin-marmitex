# 🚀 Guia de Instalação - MarmiteX

## 📋 Checklist de Pré-requisitos

Antes de começar, verifique se você tem:

- [ ] **Node.js 16+** instalado
- [ ] **MongoDB** instalado e rodando
- [ ] **Git** instalado
- [ ] **Editor de código** (VS Code recomendado)

## 🔧 Instalação Rápida (Windows)

### Opção 1: Script Automático
```bash
# Clone o repositório
git clone <url-do-repositorio>
cd marmitex

# Execute o script de instalação
setup.bat
```

### Opção 2: Instalação Manual

#### 1. Clone e instale dependências
```bash
git clone <url-do-repositorio>
cd marmitex

# Instalar todas as dependências
npm run install:all
```

#### 2. Configure o ambiente
```bash
# Copie o arquivo de exemplo
cd backend
copy .env.example .env

# Edite o .env com suas configurações
notepad .env
```

#### 3. Configure o MongoDB
```bash
# Inicie o MongoDB (se não estiver rodando)
net start MongoDB

# Teste a conexão
mongosh
```

#### 4. Inicie o projeto
```bash
# Volte para a raiz
cd ..

# Inicie backend e frontend simultaneamente
npm run dev
```

## 🐧 Instalação no Linux/Mac

```bash
# Clone o repositório
git clone <url-do-repositorio>
cd marmitex

# Instale dependências
npm run install:all

# Configure ambiente
cd backend
cp .env.example .env
nano .env  # ou vim .env

# Inicie MongoDB
sudo systemctl start mongod

# Volte para raiz e inicie
cd ..
npm run dev
```

## ⚙️ Configuração Detalhada do .env

### Configurações Obrigatórias
```env
# Banco de dados - OBRIGATÓRIO
MONGODB_URI=mongodb://localhost:27017/marmitex

# JWT Secret - OBRIGATÓRIO (mude em produção!)
JWT_SECRET=meu_jwt_secret_super_seguro_123456

# Porta do servidor
PORT=5000
```

### Configurações Opcionais
```env
# WhatsApp (para funcionalidade completa)
WPP_SESSION_PATH=./sessions
WPP_WEBHOOK_URL=http://localhost:5000/api/webhooks/whatsapp

# Mercado Pago (para pagamentos)
MERCADO_PAGO_ACCESS_TOKEN=seu_token_aqui
MERCADO_PAGO_PUBLIC_KEY=sua_chave_aqui

# CORS
FRONTEND_URL=http://localhost:5173
```

## 🧪 Testando a Instalação

### 1. Verifique se os serviços estão rodando
```bash
# Backend deve estar em:
http://localhost:5000

# Frontend deve estar em:
http://localhost:5173
```

### 2. Teste a API
```bash
# Teste básico da API
curl http://localhost:5000/api/health
```

### 3. Acesse o sistema
1. Abra `http://localhost:5173`
2. Clique em "Registrar"
3. Preencha os dados de um estabelecimento
4. Faça login

## 🔍 Solução de Problemas

### Erro: "MongoDB connection failed"
```bash
# Verifique se o MongoDB está rodando
mongosh

# Se não estiver, inicie:
# Windows:
net start MongoDB

# Linux/Mac:
sudo systemctl start mongod
```

### Erro: "Port 5000 already in use"
```bash
# Mate o processo na porta 5000
npx kill-port 5000

# Ou mude a porta no .env
PORT=5001
```

### Erro: "Cannot find module"
```bash
# Reinstale as dependências
rm -rf node_modules
npm install

# Para backend e frontend
cd backend && rm -rf node_modules && npm install
cd ../frontend && rm -rf node_modules && npm install
```

### Erro: "JWT_SECRET is required"
```bash
# Verifique se o .env existe e tem JWT_SECRET
cd backend
cat .env | grep JWT_SECRET

# Se não existir, adicione:
echo "JWT_SECRET=meu_secret_123" >> .env
```

## 📱 Configuração do WhatsApp (Opcional)

1. **Primeira execução:**
   - Um QR code aparecerá no console
   - Escaneie com seu WhatsApp
   - A sessão será salva automaticamente

2. **Problemas com WhatsApp:**
   ```bash
   # Limpe as sessões
   rm -rf backend/sessions/*
   
   # Reinicie o backend
   npm run dev:backend
   ```

## 🚀 Comandos Úteis

```bash
# Desenvolvimento
npm run dev              # Inicia backend + frontend
npm run dev:backend      # Só backend
npm run dev:frontend     # Só frontend

# Produção
npm run build           # Build do frontend
npm start               # Inicia só o backend

# Manutenção
npm run install:all     # Instala todas as dependências
npm run setup           # Setup completo
```

## 📞 Precisa de Ajuda?

1. **Verifique os logs** no console
2. **Confirme as dependências** estão instaladas
3. **Teste a conexão** com MongoDB
4. **Verifique o arquivo .env**

---

✅ **Instalação concluída com sucesso!** 

Agora você pode começar a usar o MarmiteX! 🍽️