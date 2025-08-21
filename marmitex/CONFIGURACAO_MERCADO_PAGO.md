# 🔧 Guia de Configuração do Mercado Pago

## 📋 O que você precisa configurar

Para que o sistema de pagamento PIX funcione automaticamente, você precisa configurar:

### 1. **Access Token do Mercado Pago**
- ✅ **Já configurado** no seu `.env`: `TEST-1757905169843278-081914-0f4c8328d717bf7a4aabe6f7f99c9072-806446515`
- Este é um token de **TESTE**. Para produção, você precisará do token real.

### 2. **Webhook Secret**
- ✅ **Já configurado** no seu `.env`: `45471ec86943499e76178f85b09f9e8b91c625bb87a7647f7c29f86cd0515650`

### 3. **URL Pública (Webhook URL)**
- ⚠️ **PRECISA SER CONFIGURADO**: `https://sua-url-ngrok.ngrok.io`
- Esta é a URL que o Mercado Pago usará para notificar sobre pagamentos

---

## 🚀 Passos para Configuração

### Passo 1: Obter URL Pública com ngrok

1. **Instale o ngrok** (se não tiver):
   ```bash
   # Windows (com Chocolatey)
   choco install ngrok
   
   # Ou baixe em: https://ngrok.com/download
   ```

2. **Execute o ngrok** para expor seu servidor local:
   ```bash
   ngrok http 5000
   ```

3. **Copie a URL HTTPS** que aparece (ex: `https://abc123.ngrok.io`)

4. **Atualize o .env**:
   ```env
   BASE_URL=https://abc123.ngrok.io
   ```

### Passo 2: Configurar Webhook no Mercado Pago

1. **Acesse**: https://www.mercadopago.com.br/developers/panel
2. **Faça login** com sua conta Mercado Pago
3. **Vá em "Suas integrações"** → **"Webhooks"**
4. **Clique em "Criar webhook"**
5. **Configure**:
   - **URL**: `https://sua-url-ngrok.ngrok.io/api/webhooks/mercadopago`
   - **Eventos**: Selecione `payment`
   - **Versão da API**: v1

### Passo 3: Obter Tokens de Produção (quando sair do teste)

1. **No painel do Mercado Pago**:
   - Vá em "Suas integrações" → "Credenciais"
   - Copie o **Access Token de Produção**
   - Atualize no `.env`:
   ```env
   MERCADO_PAGO_ACCESS_TOKEN=APP_USR-seu-token-de-producao-aqui
   ```

---

## 🔍 Como Testar se Está Funcionando

### 1. **Teste o Webhook**
- Faça um pedido PIX pelo WhatsApp
- Verifique se o QR Code é gerado
- Simule um pagamento no ambiente de teste do Mercado Pago
- O status do pedido deve mudar automaticamente para "pago"

### 2. **Verificar Logs**
- No terminal do servidor, você deve ver:
  ```
  ✅ Pagamento confirmado automaticamente: [ID_DO_PEDIDO]
  ```

### 3. **Testar Webhook Manualmente**
- Use uma ferramenta como Postman
- Envie um POST para: `https://sua-url-ngrok.ngrok.io/api/webhooks/mercadopago`
- Com o corpo:
  ```json
  {
    "type": "payment",
    "data": {
      "id": "123456789"
    }
  }
  ```

---

## ⚠️ Problemas Comuns

### 1. **Webhook não recebe notificações**
- ✅ Verifique se a URL do ngrok está correta no `.env`
- ✅ Confirme que o webhook está configurado no painel do Mercado Pago
- ✅ Teste se a URL está acessível: `https://sua-url-ngrok.ngrok.io/api/webhooks/mercadopago`

### 2. **Erro de assinatura inválida**
- ✅ Verifique se o `MERCADO_PAGO_WEBHOOK_SECRET` está correto
- ✅ Confirme que está usando o secret correto do painel do Mercado Pago

### 3. **Pagamentos não são confirmados automaticamente**
- ✅ Verifique se o `mercadoPagoId` está sendo salvo no pedido
- ✅ Confirme que o webhook está sendo chamado (verifique os logs)
- ✅ Teste se a função `verificarStatusPagamento` está funcionando

---

## 📱 Status Atual do Sistema

### ✅ **Já Implementado**
- Geração de QR Code PIX
- Webhook para receber notificações
- Confirmação automática de pagamentos
- Notificação via WhatsApp quando pago
- Interface no painel admin para marcar como pago manualmente

### ⚠️ **Precisa Configurar**
- URL pública com ngrok
- Webhook no painel do Mercado Pago
- Tokens de produção (quando sair do teste)

---

## 🆘 Suporte

Se tiver dúvidas:
1. Verifique os logs do servidor
2. Teste a URL do webhook manualmente
3. Confirme as configurações no painel do Mercado Pago
4. Verifique se o ngrok está rodando

**Documentação oficial**: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/webhooks