// Simulação de confirmação de pagamento Pix

export const verificarPagamentoPix = async (cpf, valor) => {
  console.log(`🧾 Simulando pagamento PIX para CPF: ${cpf} - Valor: R$ ${valor}`);
  
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('✅ Pagamento confirmado!');
      resolve(true);
    }, 4000); // 4 segundos de simulação
  });
};
