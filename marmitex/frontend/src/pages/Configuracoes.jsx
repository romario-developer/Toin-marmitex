import { useEffect, useState, useCallback } from 'react';
import api from "../services/api";

// Componente para seção do WhatsApp
function WhatsAppSection() {
  const [whatsappStatus, setWhatsappStatus] = useState('disconnected');
  const [qrCode, setQrCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false); // Prevenir múltiplas chamadas
  const [sessionInfo, setSessionInfo] = useState(null); // Informações da sessão salva

  const checkStatus = useCallback(async (forceUpdate = false) => {
     try {
       const { data } = await api.get('/api/clientes/whatsapp/status');
       if (data.sucesso && data.whatsapp) {
         const status = data.whatsapp.isConnected ? 'connected' : 'disconnected';
         
         // Não alterar o status se estiver aguardando QR code, a menos que seja forçado
         if (whatsappStatus === 'qr' && !forceUpdate && status === 'disconnected') {
           console.log('🔄 Mantendo status QR - aguardando escaneamento');
           return;
         }
         
         setWhatsappStatus(status);
         
         // Se conectou com sucesso, limpar o QR code
         if (status === 'connected') {
           setQrCode(null);
           console.log('✅ WhatsApp conectado! QR code removido.');
         }
       } else {
         if (whatsappStatus !== 'qr' || forceUpdate) {
           setWhatsappStatus('disconnected');
         }
       }
     } catch (err) {
       console.error('Erro ao verificar status:', err);
       if (whatsappStatus !== 'qr' || forceUpdate) {
         setWhatsappStatus('disconnected');
       }
     }
   }, [whatsappStatus]);
 
   const connectWhatsApp = async () => {
     // Prevenir múltiplas chamadas simultâneas
     if (isConnecting || loading) {
       console.log('⚠️ Conexão já em andamento, ignorando nova tentativa');
       return;
     }

     setLoading(true);
     setIsConnecting(true);
     try {
       setWhatsappStatus('connecting');
       console.log('🔄 Iniciando conexão WhatsApp...');
       
       const { data } = await api.post('/api/clientes/whatsapp/conectar');
       
       if (data.success) {
         console.log('🚀 Conexão WhatsApp iniciada com sucesso');
         
         // Salvar informações da sessão
         if (data.sessionInfo) {
           setSessionInfo(data.sessionInfo);
           console.log('📁 Informações da sessão:', data.sessionInfo);
         }
         
         // Se tem sessão salva válida, aguardar mais tempo antes de buscar QR
         if (data.sessionInfo?.hasSavedSession && !data.sessionInfo?.sessionExpired) {
           console.log('🔑 Aguardando reconexão automática...');
           // Aguardar 10 segundos para reconexão automática
           setTimeout(() => {
             checkStatus(true); // Forçar verificação de status
           }, 10000);
           
           // Se não conectar em 15 segundos, iniciar polling do QR
           setTimeout(() => {
             if (whatsappStatus !== 'connected') {
               console.log('⏰ Reconexão automática falhou, iniciando QR code...');
               pollForQRCode();
             }
           }, 15000);
         } else {
           // Sem sessão salva ou expirada - iniciar QR imediatamente
           pollForQRCode();
           
           // Verificar status após 5 segundos
           setTimeout(() => {
             checkStatus();
           }, 5000);
         }
       } else {
         console.error('❌ Erro na resposta do servidor:', data);
         alert('Erro ao conectar: ' + data.message);
         setWhatsappStatus('disconnected');
       }
     } catch (error) {
       console.error('❌ Erro ao conectar WhatsApp:', error);
       alert('Erro ao conectar WhatsApp: ' + (error.response?.data?.message || error.message));
       setWhatsappStatus('disconnected');
     } finally {
       setLoading(false);
       setIsConnecting(false);
     }
   };

   const pollForQRCode = async () => {
     let attempts = 0;
     const maxAttempts = 20; // 20 tentativas (60 segundos)
     let qrFound = false;
     
     // Definir status como 'qr' imediatamente para mostrar a área de QR code
     setWhatsappStatus('qr');
     setQrCode(null); // Limpar QR code anterior
     
     console.log('🔄 Iniciando polling para QR code...');
     
     const poll = async () => {
       if (qrFound) return; // Parar se QR já foi encontrado
       
       try {
         console.log(`🔍 Tentativa ${attempts + 1}/${maxAttempts} - Buscando QR code...`);
         
         // Tentar buscar QR code via rota direta (sem autenticação)
         const qrResponse = await fetch('http://localhost:5000/qr/view', {
           method: 'GET',
           headers: {
             'Cache-Control': 'no-cache'
           }
         });
         
         console.log('📡 Resposta da rota QR:', {
           status: qrResponse.status,
           contentType: qrResponse.headers.get('content-type')
         });
         
         if (qrResponse.ok) {
           const contentType = qrResponse.headers.get('content-type');
           if (contentType && contentType.includes('image')) {
             const qrBlob = await qrResponse.blob();
             const qrUrl = URL.createObjectURL(qrBlob);
             setQrCode(qrUrl);
             qrFound = true;
             console.log('✅ QR Code carregado com sucesso via rota direta!');
             return; // QR code encontrado, parar polling
           }
         }
         
         console.log('⚠️ QR code ainda não disponível');
       } catch (error) {
         console.log(`⏳ Tentativa ${attempts + 1}: QR code ainda não disponível...`, error.message);
       }
       
       attempts++;
       if (attempts < maxAttempts && !qrFound) {
         setTimeout(poll, 3000); // Tentar novamente em 3 segundos
       } else {
         console.log('⏰ Timeout ao aguardar QR code');
         alert('Não foi possível carregar o QR Code. Tente conectar novamente.');
       }
     };
     
     // Começar o polling imediatamente
     poll();
   };
 
   const disconnectWhatsApp = async () => {
     setLoading(true);
     try {
       await api.post('/api/clientes/whatsapp/desconectar');
       setWhatsappStatus('disconnected');
       setQrCode('');
     } catch (err) {
       console.error('Erro ao desconectar WhatsApp:', err);
       alert('Erro ao desconectar WhatsApp: ' + (err.response?.data?.erro || err.message));
     } finally {
       setLoading(false);
     }
   };

   const clearSessions = async () => {
     if (!confirm('Tem certeza que deseja limpar todas as sessões salvas? Isso irá desconectar o WhatsApp e você precisará escanear o QR code novamente.')) {
       return;
     }
     
     setLoading(true);
     try {
       const response = await api.post('/api/whatsapp/limpar-sessoes');
       
       if (response.data.success) {
         alert('✅ Sessões limpas com sucesso! Você pode iniciar uma nova conexão agora.');
         setWhatsappStatus('disconnected');
         setQrCode('');
         setSessionInfo(null);
         // Verificar status após limpeza
         setTimeout(() => checkStatus(true), 1000);
       } else {
         alert('❌ Erro ao limpar sessões: ' + response.data.message);
       }
     } catch (err) {
       console.error('Erro ao limpar sessões:', err);
       alert('❌ Erro ao limpar sessões: ' + (err.response?.data?.message || err.message));
     } finally {
       setLoading(false);
     }
   };

   const forceNewConnection = async () => {
     if (!confirm('Tem certeza que deseja forçar uma nova conexão? Isso irá limpar todas as sessões salvas e iniciar uma conexão completamente nova.')) {
       return;
     }
     
     setLoading(true);
     setIsConnecting(true);
     try {
       const response = await api.post('/api/whatsapp/forcar-nova-conexao');
       
       if (response.data.success) {
         alert('🚀 Nova conexão iniciada! Aguarde o QR code para escanear.');
         setWhatsappStatus('connecting');
         setQrCode('');
         setSessionInfo(response.data.sessionInfo || null);
         
         // Aguardar um pouco e começar o polling do QR code
         setTimeout(() => {
           startQRPolling();
         }, 3000);
       } else {
         alert('❌ Erro ao forçar nova conexão: ' + response.data.message);
         setIsConnecting(false);
       }
     } catch (err) {
       console.error('Erro ao forçar nova conexão:', err);
       alert('❌ Erro ao forçar nova conexão: ' + (err.response?.data?.message || err.message));
       setIsConnecting(false);
     } finally {
       setLoading(false);
     }
   };

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const getStatusColor = () => {
     switch (whatsappStatus) {
       case 'connected': return 'text-green-600';
       case 'connecting': return 'text-blue-600';
       case 'qr': return 'text-yellow-600';
       default: return 'text-red-600';
     }
   };
 
   const getStatusText = () => {
     switch (whatsappStatus) {
       case 'connected': return '✅ Conectado';
       case 'connecting': return '🔄 Conectando...';
       case 'qr': return '📱 Aguardando QR Code';
       default: return '❌ Desconectado';
     }
   };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <h2 className="text-lg font-semibold mb-4">📱 WhatsApp</h2>
      
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium">Status da Conexão:</span>
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>
        
        {/* Informações da sessão salva */}
        {sessionInfo && (
          <div className="mb-3 p-3 bg-gray-50 rounded-lg border">
            <div className="text-xs font-medium text-gray-700 mb-2">📁 Informações da Sessão:</div>
            <div className="space-y-1 text-xs">
              {sessionInfo.hasSavedSession ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✅</span>
                    <span>Sessão salva encontrada</span>
                  </div>
                  {sessionInfo.sessionExpired ? (
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-600">⚠️</span>
                      <span className="text-yellow-700">Sessão pode estar expirada - QR code será necessário</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-blue-600">🔑</span>
                      <span className="text-blue-700">Tentando reconexão automática...</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">📱</span>
                  <span>Primeira conexão - QR code será necessário</span>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="flex gap-2 flex-wrap">
           {(whatsappStatus === 'disconnected' || whatsappStatus === 'error') && (
             <button
               onClick={connectWhatsApp}
               disabled={loading || isConnecting}
               className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 text-sm"
             >
               {(loading || isConnecting) ? 'Conectando...' : 'Conectar WhatsApp'}
             </button>
           )}
           
           {(whatsappStatus === 'connected' || whatsappStatus === 'connecting' || whatsappStatus === 'qr') && (
             <button
               onClick={disconnectWhatsApp}
               disabled={loading}
               className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50 text-sm"
             >
               {loading ? 'Desconectando...' : 'Desconectar'}
             </button>
           )}
           
           <button
             onClick={() => checkStatus(true)}
             disabled={loading}
             className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
           >
             {loading ? 'Verificando...' : 'Verificar Status'}
           </button>
           
           <button
             onClick={clearSessions}
             disabled={loading}
             className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 disabled:opacity-50 text-sm"
           >
             {loading ? 'Limpando...' : 'Limpar Cache'}
           </button>
           
           <button
             onClick={forceNewConnection}
             disabled={loading}
             className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50 text-sm"
           >
             {loading ? 'Iniciando...' : 'Nova Conexão'}
           </button>
         </div>
      </div>
      
      {(whatsappStatus === 'connecting' || whatsappStatus === 'qr') && (
         <div className="mt-4 p-4 border rounded bg-gray-50">
           {whatsappStatus === 'connecting' && (
             <div className="text-center">
               <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
               <p className="text-sm text-gray-600">Iniciando conexão WhatsApp...</p>
             </div>
           )}
           
           {whatsappStatus === 'qr' && (
             <>
               <h3 className="text-md font-medium mb-3">Escaneie o QR Code com seu WhatsApp:</h3>
               {qrCode ? (
                 <div className="flex justify-center mb-3">
                   <div className="border-2 border-gray-300 rounded-lg p-2 bg-white">
                     <img 
                       src={qrCode} 
                       alt="QR Code WhatsApp" 
                       className="max-w-xs w-64 h-64 object-contain" 
                       onLoad={() => console.log('✅ Imagem QR Code carregada com sucesso!')}
                       onError={(e) => {
                         console.error('❌ Erro ao carregar imagem do QR Code:', e);
                         console.log('🔍 URL da imagem:', qrCode);
                         e.target.style.display = 'none';
                       }}
                     />
                   </div>
                   <p className="text-xs text-center text-gray-500 mt-2">QR Code carregado: {qrCode ? 'Sim' : 'Não'}</p>
                 </div>
               ) : (
                 <div className="text-center mb-3">
                   <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mb-2"></div>
                   <p className="text-sm text-gray-600">Aguardando QR Code...</p>
                   <p className="text-xs text-gray-500 mt-1">Isso pode levar alguns segundos</p>
                 </div>
               )}
               <p className="text-sm text-gray-600 text-center mb-3">
                 1. Abra o WhatsApp no seu celular<br/>
                 2. Vá em Configurações → Aparelhos conectados<br/>
                 3. Toque em "Conectar um aparelho"<br/>
                 4. Escaneie este QR Code
               </p>
               <div className="text-center">
                 <button
                   onClick={async () => {
                     setQrCode(null); // Limpar QR code atual
                     try {
                       // Tentar buscar QR code via rota direta
                       const qrResponse = await fetch('http://localhost:5000/qr/view', {
                         method: 'GET',
                         headers: {
                           'Cache-Control': 'no-cache'
                         }
                       });
                       
                       if (qrResponse.ok) {
                         const contentType = qrResponse.headers.get('content-type');
                         if (contentType && contentType.includes('image')) {
                           const qrBlob = await qrResponse.blob();
                           const qrUrl = URL.createObjectURL(qrBlob);
                           setQrCode(qrUrl);
                           console.log('QR Code atualizado com sucesso!');
                           return;
                         }
                       }
                       
                       // Se chegou aqui, tentar fallback
                       const apiResponse = await api.get('/api/clientes/whatsapp/qr-code');
                       if (apiResponse.data.success && apiResponse.data.qrCode) {
                         setQrCode(`data:image/png;base64,${apiResponse.data.qrCode}`);
                         console.log('QR Code carregado via API fallback');
                       } else {
                         alert('QR Code não disponível. Tente conectar novamente.');
                       }
                     } catch (err) {
                       console.error('Erro ao buscar QR Code:', err);
                       alert('Erro ao carregar QR Code: ' + (err.message || 'Erro desconhecido'));
                     }
                   }}
                   className="bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700 text-sm"
                 >
                   Atualizar QR Code
                 </button>
               </div>
             </>
           )}
         </div>
       )}
      
      {whatsappStatus === 'connected' && (
        <div className="mt-4 p-3 bg-green-50 rounded text-sm text-green-700">
          <strong>✅ WhatsApp conectado com sucesso!</strong><br/>
          O bot está pronto para receber e responder mensagens.
        </div>
      )}
      
      {/* Orientações sobre limitações do WhatsApp */}
      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="text-sm font-semibold text-blue-800 mb-2">💡 Dicas Importantes:</h4>
        <div className="text-xs text-blue-700 space-y-2">
          <div className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">📱</span>
            <div>
              <strong>Erro "não é possível conectar novos dispositivos":</strong><br/>
              Isso acontece quando o WhatsApp tem muitos dispositivos conectados. Tente:
              <ul className="ml-4 mt-1 list-disc list-inside">
                <li>Desconectar outros dispositivos no WhatsApp</li>
                <li>Usar o botão "Limpar Cache" e tentar novamente</li>
                <li>Aguardar alguns minutos e tentar reconectar</li>
              </ul>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">🔄</span>
            <div>
              <strong>Problemas de conexão:</strong><br/>
              Use "Nova Conexão" para forçar uma conexão completamente limpa quando houver problemas persistentes.
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">⚠️</span>
            <div>
              <strong>Limitações do WhatsApp:</strong><br/>
              O WhatsApp permite apenas 4 dispositivos conectados simultaneamente. Se atingir esse limite, desconecte outros dispositivos primeiro.
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">🛡️</span>
            <div>
              <strong>Segurança:</strong><br/>
              Mantenha seu celular conectado à internet. Se o celular ficar offline por muito tempo, a conexão será perdida.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const formatBRL = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
    .format(Number.isFinite(v) ? v : 0);

const parseToNumber = (s) => {
  const cents = String(s ?? '').replace(/[^\d]/g, '');
  return (Number(cents) || 0) / 100;
};

function CurrencyField({ label, value, onChange }) {
  const handleChange = (e) => onChange(parseToNumber(e.target.value));
  return (
    <div className="flex items-center justify-between gap-2 mb-2">
      <label className="text-sm">{label}</label>
      <input
        inputMode="numeric"
        pattern="[0-9]*"
        className="w-24 sm:w-32 border rounded px-2 py-1 text-sm text-right"
        value={formatBRL(value)}
        onChange={handleChange}
        placeholder="R$ 0,00"
      />
    </div>
  );
}

export default function Configuracoes() {
  const [precos, setPrecos] = useState({
    precosMarmita: { P: 0, M: 0, G: 0 },
    precosBebida: { lata: 0, umLitro: 0, doisLitros: 0 },
    taxaEntrega: 3,
    horarioFuncionamento: {
      ativo: true,
      segunda: { ativo: true, abertura: '11:00', fechamento: '14:00' },
      terca: { ativo: true, abertura: '11:00', fechamento: '14:00' },
      quarta: { ativo: true, abertura: '11:00', fechamento: '14:00' },
      quinta: { ativo: true, abertura: '11:00', fechamento: '14:00' },
      sexta: { ativo: true, abertura: '11:00', fechamento: '14:00' },
      sabado: { ativo: true, abertura: '11:00', fechamento: '14:00' },
      domingo: { ativo: false, abertura: '11:00', fechamento: '14:00' },
      mensagemForaHorario: '🕐 Desculpe, estamos fechados no momento.\n\n📅 Nosso horário de funcionamento:\nSegunda a Sábado: 11:00 às 14:00\nDomingo: Fechado\n\n⏰ Volte durante nosso horário de atendimento!'
    },
    delaysMensagens: {
      antesCardapio: 2000,
      entreCardapios: 1500,
      antesEscolha: 1000
    }
  });
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/api/configuracoes');
      setPrecos({
        precosMarmita: {
          P: Number(data?.precosMarmita?.P ?? 0),
          M: Number(data?.precosMarmita?.M ?? 0),
          G: Number(data?.precosMarmita?.G ?? 0),
        },
        precosBebida: {
          lata: Number(data?.precosBebida?.lata ?? 0),
          umLitro: Number(data?.precosBebida?.umLitro ?? 0),
          doisLitros: Number(data?.precosBebida?.doisLitros ?? 0),
        },
        taxaEntrega: Number(data?.taxaEntrega ?? 3),
        horarioFuncionamento: data?.horarioFuncionamento ?? {
          ativo: true,
          segunda: { ativo: true, abertura: '11:00', fechamento: '14:00' },
          terca: { ativo: true, abertura: '11:00', fechamento: '14:00' },
          quarta: { ativo: true, abertura: '11:00', fechamento: '14:00' },
          quinta: { ativo: true, abertura: '11:00', fechamento: '14:00' },
          sexta: { ativo: true, abertura: '11:00', fechamento: '14:00' },
          sabado: { ativo: true, abertura: '11:00', fechamento: '14:00' },
          domingo: { ativo: false, abertura: '11:00', fechamento: '14:00' },
          mensagemForaHorario: '🕐 Desculpe, estamos fechados no momento.\n\n📅 Nosso horário de funcionamento:\nSegunda a Sábado: 11:00 às 14:00\nDomingo: Fechado\n\n⏰ Volte durante nosso horário de atendimento!'
        },
        delaysMensagens: data?.delaysMensagens ?? {
          antesCardapio: 2000,
          entreCardapios: 1500,
          antesEscolha: 1000
        }
      });
    } catch (err) {
      console.error('Erro ao carregar configurações:', err);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function salvar() {
    setSalvando(true);
    setMsg('');
    try {
      await api.post('/api/configuracoes', precos);
      setMsg('✅ Configurações salvas!');
    } catch (err) {
      console.error('Erro ao salvar:', err);
      setMsg('❌ Erro ao salvar.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="p-3 sm:p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Configurações</h1>
      
      {/* Seção WhatsApp */}
      <WhatsAppSection />
      
      {/* Preços das Marmitas */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">Preços das Marmitas</h2>
        <CurrencyField
          label="Marmita P"
          value={precos.precosMarmita.P}
          onChange={(v) => setPrecos(prev => ({
            ...prev,
            precosMarmita: { ...prev.precosMarmita, P: v }
          }))}
        />
        <CurrencyField
          label="Marmita M"
          value={precos.precosMarmita.M}
          onChange={(v) => setPrecos(prev => ({
            ...prev,
            precosMarmita: { ...prev.precosMarmita, M: v }
          }))}
        />
        <CurrencyField
          label="Marmita G"
          value={precos.precosMarmita.G}
          onChange={(v) => setPrecos(prev => ({
            ...prev,
            precosMarmita: { ...prev.precosMarmita, G: v }
          }))}
        />
      </div>

      {/* Preços das Bebidas */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">Preços das Bebidas</h2>
        <CurrencyField
          label="Coca Lata"
          value={precos.precosBebida.lata}
          onChange={(v) => setPrecos(prev => ({
            ...prev,
            precosBebida: { ...prev.precosBebida, lata: v }
          }))}
        />
        <CurrencyField
          label="Coca 1L"
          value={precos.precosBebida.umLitro}
          onChange={(v) => setPrecos(prev => ({
            ...prev,
            precosBebida: { ...prev.precosBebida, umLitro: v }
          }))}
        />
        <CurrencyField
          label="Coca 2L"
          value={precos.precosBebida.doisLitros}
          onChange={(v) => setPrecos(prev => ({
            ...prev,
            precosBebida: { ...prev.precosBebida, doisLitros: v }
          }))}
        />
      </div>

      {/* Taxa de Entrega */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">Taxa de Entrega</h2>
        <CurrencyField
          label="Taxa de Entrega"
          value={precos.taxaEntrega}
          onChange={(v) => setPrecos(prev => ({ ...prev, taxaEntrega: v }))}
        />
      </div>

      {/* Horário de Funcionamento */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">Horário de Funcionamento</h2>
        
        <div className="mb-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={precos.horarioFuncionamento.ativo}
              onChange={(e) => setPrecos(prev => ({
                ...prev,
                horarioFuncionamento: {
                  ...prev.horarioFuncionamento,
                  ativo: e.target.checked
                }
              }))}
            />
            <span>Ativar controle de horário</span>
          </label>
        </div>
        
        {precos.horarioFuncionamento.ativo && (
          <>
            {['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'].map(dia => (
              <div key={dia} className="flex items-center gap-4 mb-3 p-3 border rounded">
                <div className="w-20">
                  <span className="capitalize font-medium">{dia}</span>
                </div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={precos.horarioFuncionamento[dia].ativo}
                    onChange={(e) => setPrecos(prev => ({
                      ...prev,
                      horarioFuncionamento: {
                        ...prev.horarioFuncionamento,
                        [dia]: {
                          ...prev.horarioFuncionamento[dia],
                          ativo: e.target.checked
                        }
                      }
                    }))}
                  />
                  <span>Aberto</span>
                </label>
                {precos.horarioFuncionamento[dia].ativo && (
                  <>
                    <input
                      type="time"
                      value={precos.horarioFuncionamento[dia].abertura}
                      onChange={(e) => setPrecos(prev => ({
                        ...prev,
                        horarioFuncionamento: {
                          ...prev.horarioFuncionamento,
                          [dia]: {
                            ...prev.horarioFuncionamento[dia],
                            abertura: e.target.value
                          }
                        }
                      }))}
                      className="border rounded px-2 py-1"
                    />
                    <span>às</span>
                    <input
                      type="time"
                      value={precos.horarioFuncionamento[dia].fechamento}
                      onChange={(e) => setPrecos(prev => ({
                        ...prev,
                        horarioFuncionamento: {
                          ...prev.horarioFuncionamento,
                          [dia]: {
                            ...prev.horarioFuncionamento[dia],
                            fechamento: e.target.value
                          }
                        }
                      }))}
                      className="border rounded px-2 py-1"
                    />
                  </>
                )}
              </div>
            ))}
            
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">Mensagem quando fechado:</label>
              <textarea
                value={precos.horarioFuncionamento.mensagemForaHorario}
                onChange={(e) => setPrecos(prev => ({
                  ...prev,
                  horarioFuncionamento: {
                    ...prev.horarioFuncionamento,
                    mensagemForaHorario: e.target.value
                  }
                }))}
                className="w-full border rounded px-3 py-2 text-sm"
                rows={4}
                placeholder="Mensagem que será enviada quando o estabelecimento estiver fechado"
              />
            </div>
          </>
        )}
      </div>

      {/* Delays das Mensagens do Bot */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">⏱️ Tempos das Mensagens do Bot</h2>
        <p className="text-sm text-gray-600 mb-4">
          Configure o tempo de espera entre as mensagens do bot (em milissegundos).
          Valores entre 500ms e 10000ms (10 segundos).
        </p>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <label className="text-sm font-medium">Antes de mostrar o cardápio:</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="500"
                max="10000"
                step="100"
                value={precos.delaysMensagens.antesCardapio}
                onChange={(e) => setPrecos(prev => ({
                  ...prev,
                  delaysMensagens: {
                    ...prev.delaysMensagens,
                    antesCardapio: Number(e.target.value)
                  }
                }))}
                className="w-20 border rounded px-2 py-1 text-sm text-center"
              />
              <span className="text-xs text-gray-500">ms</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between gap-2">
            <label className="text-sm font-medium">Entre cardápio 1 e 2:</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="500"
                max="10000"
                step="100"
                value={precos.delaysMensagens.entreCardapios}
                onChange={(e) => setPrecos(prev => ({
                  ...prev,
                  delaysMensagens: {
                    ...prev.delaysMensagens,
                    entreCardapios: Number(e.target.value)
                  }
                }))}
                className="w-20 border rounded px-2 py-1 text-sm text-center"
              />
              <span className="text-xs text-gray-500">ms</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between gap-2">
            <label className="text-sm font-medium">Antes da mensagem de escolha:</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="500"
                max="10000"
                step="100"
                value={precos.delaysMensagens.antesEscolha}
                onChange={(e) => setPrecos(prev => ({
                  ...prev,
                  delaysMensagens: {
                    ...prev.delaysMensagens,
                    antesEscolha: Number(e.target.value)
                  }
                }))}
                className="w-20 border rounded px-2 py-1 text-sm text-center"
              />
              <span className="text-xs text-gray-500">ms</span>
            </div>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 rounded text-sm text-blue-700">
          <strong>💡 Dica:</strong> Valores maiores fazem o bot parecer mais "humano", 
          mas podem deixar a conversa mais lenta. Recomendado: 1000-3000ms.
        </div>
      </div>

      {/* Botão Salvar */}
      <div className="flex items-center gap-3">
        <button
          onClick={salvar}
          disabled={salvando}
          className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {salvando ? 'Salvando...' : 'Salvar Configurações'}
        </button>
        {msg && <span className="text-sm">{msg}</span>}
      </div>
    </div>
  );
}
