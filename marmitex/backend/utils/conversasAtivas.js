// backend/utils/conversasAtivas.js
export const conversasAtivas = new Map();

export function resetarConversa(numero) {
  conversasAtivas.set(numero, {
    etapa: 'inicio',
    escolhaCardapio: null,
    tamanho: null,
    bebida: null,
    pagamento: null,
    valorTotal: 0
  });
}
