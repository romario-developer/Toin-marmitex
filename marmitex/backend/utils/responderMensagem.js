import axios from 'axios';

export async function responderMensagem(client, message) {
  const texto = message.body?.toLowerCase().trim();
  if (!texto) return;

  if (texto === 'oi') {
    try {
      const resposta = await axios.get('http://localhost:5000/api/cardapios/hoje');
      const cardapio = resposta.data;

      let mensagem = '🍽️ *Cardápio de Hoje* 🍽️\n\n';

      cardapio.pratos.forEach((prato) => {
        mensagem += `🥩 Prato do dia: *${prato.nome}*\n`;
        mensagem += `🍚 Acompanhamento: *${prato.descricao}*\n\n`;
      });

      if (cardapio.bebidas.length > 0) {
        const bebidas = cardapio.bebidas.map(b => b.nome).join(' ou ');
        mensagem += `🥤 Bebidas: *${bebidas}*\n\n`;
      }

      mensagem += 'Digite o número do tamanho da marmita:\n';
      mensagem += '1️⃣ Pequena\n';
      mensagem += '2️⃣ Média\n';
      mensagem += '3️⃣ Grande';

      await client.sendText(message.from, mensagem);
    } catch (error) {
      console.error('Erro ao buscar cardápio:', error.message);
      await client.sendText(message.from, '❌ Desculpe, não foi possível carregar o cardápio de hoje.');
    }
  }
}
