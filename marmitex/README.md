# 🍽️ MarmiteX - Sistema de Gestão para Marmitarias

Sistema completo para gestão de marmitarias com dashboard personalizado, integração WhatsApp e pagamentos via PIX.

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado em sua máquina:

- **Node.js** (versão 16 ou superior) - [Download aqui](https://nodejs.org/)
- **MongoDB** (versão 4.4 ou superior) - [Download aqui](https://www.mongodb.com/try/download/community)
- **Git** - [Download aqui](https://git-scm.com/)

## 🚀 Instalação

### 1. Clone o repositório
```bash
git clone <url-do-repositorio>
cd marmitex
```

### 2. Instale as dependências do Backend
```bash
cd backend
npm install
```

### 3. Instale as dependências do Frontend
```bash
cd ../frontend
npm install
```

## ⚙️ Configuração

### 1. Variáveis de Ambiente do Backend

Crie um arquivo `.env` na pasta `backend` com as seguintes variáveis:

```env
# Banco de dados
MONGODB_URI=mongodb://localhost:27017/marmitex

# JWT
JWT_SECRET=seu_jwt_secret_super_seguro_aqui

# Servidor
PORT=5000

# WhatsApp (WPPConnect)
WPP_SESSION_PATH=./sessions
WPP_WEBHOOK_URL=http://localhost:5000/api/webhooks/whatsapp

# Mercado Pago (opcional)
MERCADO_PAGO_ACCESS_TOKEN=seu_access_token_aqui
MERCADO_PAGO_PUBLIC_KEY=sua_public_key_aqui
```

### 2. Configuração do MongoDB

Certifique-se de que o MongoDB está rodando:

```bash
# Windows (se instalado como serviço)
net start MongoDB

# Linux/Mac
sudo systemctl start mongod
```

### 3. Criar usuário administrador (opcional)

Para criar um usuário admin inicial:

```bash
cd backend
node createAdmin.js
```

## 🏃‍♂️ Executando o Projeto

### Desenvolvimento

1. **Inicie o Backend:**
```bash
cd backend
npm start
```
O servidor rodará em: `http://localhost:5000`

2. **Inicie o Frontend (em outro terminal):**
```bash
cd frontend
npm run dev
```
O frontend rodará em: `http://localhost:5173`

### Produção

1. **Build do Frontend:**
```bash
cd frontend
npm run build
```

2. **Inicie o Backend:**
```bash
cd backend
npm run start:prod
```

## 📁 Estrutura do Projeto

```
marmitex/
├── backend/                 # API Node.js + Express
│   ├── controllers/         # Controladores da API
│   ├── models/             # Modelos do MongoDB
│   ├── routes/             # Rotas da API
│   ├── middleware/         # Middlewares de autenticação
│   ├── services/           # Serviços (WhatsApp, Pagamentos)
│   └── utils/              # Utilitários
├── frontend/               # Interface React + Vite
│   ├── src/
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── pages/          # Páginas da aplicação
│   │   └── services/       # Serviços de API
│   └── public/             # Arquivos estáticos
└── README.md              # Este arquivo
```

## 🔧 Funcionalidades

- ✅ **Dashboard personalizado** para cada estabelecimento
- ✅ **Sistema de autenticação** seguro com JWT
- ✅ **Gestão de cardápio** com upload de imagens
- ✅ **Controle de pedidos** em tempo real
- ✅ **Configurações de PIX** para pagamentos
- ✅ **Integração WhatsApp** via WPPConnect
- ✅ **Sistema multi-tenant** (múltiplos clientes)
- ✅ **Painel administrativo**

## 🛠️ Tecnologias Utilizadas

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT para autenticação
- WPPConnect para WhatsApp
- Multer para upload de arquivos
- Bcrypt para hash de senhas

### Frontend
- React 18
- Vite
- Tailwind CSS
- React Router
- Axios

## 📱 Endpoints da API

### Autenticação de Clientes
- `POST /api/clientes/register` - Registro de novo cliente
- `POST /api/clientes/login` - Login de cliente
- `GET /api/clientes/me` - Dados do cliente logado

### Cardápio
- `GET /api/cardapios` - Listar cardápio
- `POST /api/cardapios` - Criar item do cardápio
- `PUT /api/cardapios/:id` - Atualizar item
- `DELETE /api/cardapios/:id` - Deletar item

### Pedidos
- `GET /api/pedidos` - Listar pedidos
- `POST /api/pedidos` - Criar pedido
- `PUT /api/pedidos/:id` - Atualizar status do pedido

## 🔒 Segurança

- Autenticação JWT
- Hash de senhas com bcrypt
- Validação de dados de entrada
- Middleware de autenticação
- CORS configurado

## 🐛 Solução de Problemas

### Erro de conexão com MongoDB
```bash
# Verifique se o MongoDB está rodando
mongosh
```

### Erro de porta em uso
```bash
# Mate o processo na porta 5000
npx kill-port 5000
```

### Problemas com WhatsApp
- Verifique se a pasta `sessions` existe no backend
- Escaneie o QR code quando solicitado

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs do console
2. Confirme se todas as dependências foram instaladas
3. Verifique se o MongoDB está rodando
4. Confirme se as variáveis de ambiente estão configuradas

## 📄 Licença

Este projeto está sob a licença MIT.

---

**Desenvolvido com ❤️ para facilitar a gestão de marmitarias**