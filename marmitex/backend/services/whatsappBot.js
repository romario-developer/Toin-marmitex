// backend/services/whatsappBot.js
import { conectarWhatsapp } from '../config/wppconnect.js';
import { responderMensagem } from '../utils/responderMensagem.js'; // <<< já está completa
let clienteWhatsapp;

export async function iniciarBot() {
  clienteWhatsapp = await conectarWhatsapp(responderMensagem);
}
