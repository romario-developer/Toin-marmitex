import { useEffect, useRef, useState } from 'react';
import api, { apiUploadImagem } from "../services/api";

export default function CadastroCardapio() {
  // form
  const [data, setData] = useState(() => new Date().toISOString().substring(0, 10));
  const [cardapios, setCardapios] = useState([
    { numero: 1, item: { descricao: '', imagem: '' } },
    { numero: 2, item: { descricao: '', imagem: '' } }
  ]);
  const [msg, setMsg] = useState('');
  const [editId, setEditId] = useState(null);

  // lista
  const [lista, setLista] = useState([]);

  // refs camera/galeria (dinâmicas)
  const cameraRefs = useRef([]);
  const galeriaRefs = useRef([]);

  // Garantir que temos refs suficientes
  useEffect(() => {
    cameraRefs.current = cameraRefs.current.slice(0, cardapios.length);
    galeriaRefs.current = galeriaRefs.current.slice(0, cardapios.length);
    for (let i = cameraRefs.current.length; i < cardapios.length; i++) {
      cameraRefs.current[i] = null;
      galeriaRefs.current[i] = null;
    }
  }, [cardapios.length]);

  const formRef = useRef(null);

  useEffect(() => { carregarLista(); }, []);
  async function carregarLista() {
    try {
      const { data } = await api.get('/api/cardapios', { params: { limit: 50 } });
      setLista(data);
    } catch {}
  }

  function resetForm() {
    setEditId(null);
    setData(new Date().toISOString().substring(0, 10));
    setCardapios([
      { numero: 1, item: { descricao: '', imagem: '' } },
      { numero: 2, item: { descricao: '', imagem: '' } }
    ]);
  }

  function fullUrl(rel) {
    const base = api.defaults.baseURL?.replace(/\/$/, '') || '';
    return rel?.startsWith('/uploads') ? `${base}${rel}` : rel;
  }

  // upload
  async function uploadImagem(file) {
    const resp = await apiUploadImagem(file, 'file'); // backend espera 'file'
    return resp.url; // rota /api/upload retorna { url: '/uploads/...' }
  }
  async function onPick(file, cardapioIndex) {
    if (!file) return;
    try {
      const url = await uploadImagem(file);
      setCardapios(prev => prev.map((cardapio, index) => 
        index === cardapioIndex 
          ? { ...cardapio, item: { ...cardapio.item, imagem: url } }
          : cardapio
      ));
      setMsg('📸 Imagem enviada!');
    } catch (e) {
      setMsg('❌ Falha no upload da imagem.');
    }
  }

  // Funções para gerenciar cardápios
  function adicionarCardapio() {
    const novoNumero = Math.max(...cardapios.map(c => c.numero)) + 1;
    setCardapios(prev => [...prev, { numero: novoNumero, item: { descricao: '', imagem: '' } }]);
  }

  function removerCardapio(index) {
    if (cardapios.length <= 1) {
      setMsg('❌ Deve haver pelo menos 1 cardápio.');
      return;
    }
    setCardapios(prev => prev.filter((_, i) => i !== index));
  }

  function atualizarDescricaoCardapio(index, descricao) {
    setCardapios(prev => prev.map((cardapio, i) => 
      i === index 
        ? { ...cardapio, item: { ...cardapio.item, descricao } }
        : cardapio
    ));
  }

  // salvar / editar
  async function salvar(e) {
    e.preventDefault();
    setMsg('');

    const payload = {
      data,
      cardapios: cardapios.filter(c => c.item.descricao.trim() !== '')
    };

    try {
      if (!editId) {
        await api.post('/api/cardapios', payload);
        setMsg('✅ Cardápio salvo!');
      } else {
        await api.put(`/api/cardapios/${editId}`, payload);
        setMsg('✅ Cardápio atualizado!');
      }
      await carregarLista();
      resetForm();
      window.dispatchEvent(new CustomEvent('cardapio-atualizado'));
      formRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      const texto = err?.response?.data?.erro || 'Erro ao salvar/atualizar cardápio.';
      setMsg(`❌ ${texto}`);
    }
  }

  function editar(item) {
    setEditId(item._id);
    setData(new Date(item.data).toISOString().substring(0, 10));
    
    // Converter estrutura antiga para nova se necessário
    if (item.cardapios && Array.isArray(item.cardapios)) {
      setCardapios(item.cardapios.map(c => ({
        numero: c.numero,
        item: {
          descricao: c.item?.descricao || '',
          imagem: c.item?.imagem || ''
        }
      })));
    } else {
      // Compatibilidade com estrutura antiga
      setCardapios([
        { numero: 1, item: { descricao: item.cardapio1?.descricao || '', imagem: item.cardapio1?.imagem || '' } },
        { numero: 2, item: { descricao: item.cardapio2?.descricao || '', imagem: item.cardapio2?.imagem || '' } }
      ]);
    }
    
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  async function apagar(id) {
    if (!confirm('Apagar este cardápio?')) return;
    try {
      await api.delete(`/api/cardapios/${id}`);
      await carregarLista();
      if (editId === id) resetForm();
      setMsg('🗑️ Excluído!');
      window.dispatchEvent(new CustomEvent('cardapio-atualizado'));
    } catch {
      setMsg('❌ Erro ao excluir.');
    }
  }

  const ImgPreview = ({ src, alt }) => (
    src ? (
      <img src={fullUrl(src)} alt={alt} className="h-28 w-28 sm:h-32 sm:w-32 object-cover rounded-lg border" />
    ) : (
      <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-lg border flex items-center justify-center text-xs text-gray-500">
        Sem imagem
      </div>
    )
  );

  const Picker = ({ cardapioIndex }) => (
    <div className="flex gap-2 flex-wrap">
      <input
        ref={el => cameraRefs.current[cardapioIndex] = el}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => onPick(e.target.files?.[0], cardapioIndex)}
      />
      <input
        ref={el => galeriaRefs.current[cardapioIndex] = el}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onPick(e.target.files?.[0], cardapioIndex)}
      />
      <button
        type="button"
        onClick={() => cameraRefs.current[cardapioIndex]?.click()}
        className="px-3 py-2 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700 w-full sm:w-auto"
      >
        Tirar foto
      </button>
      <button
        type="button"
        onClick={() => galeriaRefs.current[cardapioIndex]?.click()}
        className="px-3 py-2 text-sm bg-slate-600 text-white rounded hover:bg-slate-700 w-full sm:w-auto"
      >
        Galeria
      </button>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto">
      {/* FORM */}
      <form ref={formRef} onSubmit={salvar} className="bg-white p-3 sm:p-4 rounded shadow">
        <h1 className="text-lg sm:text-2xl font-bold mb-3">
          {editId ? 'Editar Cardápio' : 'Cadastro de Cardápio'}
        </h1>
        {msg && <p className="mb-3 text-sm">{msg}</p>}

        <div>
          <label className="block text-sm font-medium mb-1">Data</label>
          <input
            type="date"
            className="w-full border rounded px-3 py-2"
            value={data}
            onChange={e => setData(e.target.value)}
            required
          />
        </div>

        {/* Cardápios Dinâmicos */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Cardápios</h2>
            <button
              type="button"
              onClick={adicionarCardapio}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              + Adicionar Cardápio
            </button>
          </div>
          
          {cardapios.map((cardapio, index) => (
            <div key={index} className="border rounded p-3 mb-3 bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Cardápio {cardapio.numero}</h3>
                {cardapios.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removerCardapio(index)}
                    className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Remover
                  </button>
                )}
              </div>
              
              <textarea
                className="w-full border rounded px-3 py-2 mb-2"
                placeholder={`Ex.: ${index === 0 ? 'Tropeiro, Salada, Ovo, Carne' : index === 1 ? 'Arroz, Macarrão, Farofa' : 'Descrição do cardápio'}`}
                rows={3}
                value={cardapio.item.descricao}
                onChange={e => atualizarDescricaoCardapio(index, e.target.value)}
                required
              />
              
              <div className="flex items-center gap-3 flex-wrap">
                <ImgPreview src={cardapio.item.imagem} alt={`Cardápio ${cardapio.numero}`} />
                <Picker cardapioIndex={index} />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 sm:flex sm:gap-2">
          <button className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 w-full sm:w-auto">
            {editId ? 'Salvar alterações' : 'Salvar cardápio'}
          </button>
          {editId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-5 py-2 rounded border bg-white hover:bg-gray-50 w-full sm:w-auto mt-2 sm:mt-0"
            >
              Cancelar edição
            </button>
          )}
        </div>
      </form>

      {/* LISTA */}
      <div className="mt-6 bg-white p-3 sm:p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-3">Registros de Cardápio</h2>

        {/* Mobile: cards */}
        <div className="sm:hidden space-y-3">
          {lista.length === 0 && <p className="text-sm text-gray-500">Nenhum cardápio cadastrado.</p>}
          {lista.map(item => (
            <div key={item._id} className="rounded border p-3">
              <div className="text-sm font-medium">
                {new Date(item.data).toLocaleDateString('pt-BR')}
              </div>

              <div className="mt-2 space-y-2">
                {item.cardapios && Array.isArray(item.cardapios) ? (
                  item.cardapios.map((cardapio, index) => (
                    <div key={index}>
                      <div className="text-xs font-semibold mb-1">Cardápio {cardapio.numero}</div>
                      <div className="flex items-center gap-2">
                        {cardapio.item?.imagem ? (
                          <img
                            src={fullUrl(cardapio.item.imagem)}
                            alt={`Cardápio ${cardapio.numero}`}
                            className="h-10 w-10 rounded object-cover border"
                          />
                        ) : <div className="h-10 w-10 rounded border text-[10px] text-gray-400 flex items-center justify-center">—</div>}
                        <span className="text-sm">{cardapio.item?.descricao || '—'}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <>
                    <div>
                      <div className="text-xs font-semibold mb-1">Cardápio 1</div>
                      <div className="flex items-center gap-2">
                        {item.cardapio1?.imagem ? (
                          <img
                            src={fullUrl(item.cardapio1.imagem)}
                            alt="c1"
                            className="h-10 w-10 rounded object-cover border"
                          />
                        ) : <div className="h-10 w-10 rounded border text-[10px] text-gray-400 flex items-center justify-center">—</div>}
                        <span className="text-sm">{item.cardapio1?.descricao || '—'}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold mb-1">Cardápio 2</div>
                      <div className="flex items-center gap-2">
                        {item.cardapio2?.imagem ? (
                          <img
                            src={fullUrl(item.cardapio2.imagem)}
                            alt="c2"
                            className="h-10 w-10 rounded object-cover border"
                          />
                        ) : <div className="h-10 w-10 rounded border text-[10px] text-gray-400 flex items-center justify-center">—</div>}
                        <span className="text-sm">{item.cardapio2?.descricao || '—'}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  className="px-3 py-2 rounded bg-amber-500 text-white hover:bg-amber-600"
                  onClick={() => editar(item)}
                >
                  Editar
                </button>
                <button
                  className="px-3 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                  onClick={() => apagar(item._id)}
                >
                  Apagar
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: tabela */}
        <div className="hidden sm:block overflow-x-auto">
          {lista.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum cardápio cadastrado.</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left text-sm font-medium">Data</th>
                  <th className="px-3 py-2 text-left text-sm font-medium">Cardápios</th>
                  <th className="px-3 py-2 text-left text-sm font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lista.map(item => (
                  <tr key={item._id}>
                    <td className="px-3 py-2 text-sm">
                      {new Date(item.data).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      {item.cardapios && Array.isArray(item.cardapios) ? (
                        <div className="space-y-2">
                          {item.cardapios.map((cardapio, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <span className="font-medium text-xs bg-blue-100 px-2 py-1 rounded">{cardapio.numero}</span>
                              {cardapio.item?.imagem ? (
                                <img
                                  src={fullUrl(cardapio.item.imagem)}
                                  alt={`Cardápio ${cardapio.numero}`}
                                  className="h-8 w-8 rounded object-cover border"
                                />
                              ) : <div className="h-8 w-8 rounded border text-[10px] text-gray-400 flex items-center justify-center">—</div>}
                              <span className="text-sm">{cardapio.item?.descricao || '—'}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-xs bg-blue-100 px-2 py-1 rounded">1</span>
                            {item.cardapio1?.imagem ? (
                              <img
                                src={fullUrl(item.cardapio1.imagem)}
                                alt="Cardápio 1"
                                className="h-8 w-8 rounded object-cover border"
                              />
                            ) : <div className="h-8 w-8 rounded border text-[10px] text-gray-400 flex items-center justify-center">—</div>}
                            <span className="text-sm">{item.cardapio1?.descricao || '—'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-xs bg-blue-100 px-2 py-1 rounded">2</span>
                            {item.cardapio2?.imagem ? (
                              <img
                                src={fullUrl(item.cardapio2.imagem)}
                                alt="Cardápio 2"
                                className="h-8 w-8 rounded object-cover border"
                              />
                            ) : <div className="h-8 w-8 rounded border text-[10px] text-gray-400 flex items-center justify-center">—</div>}
                            <span className="text-sm">{item.cardapio2?.descricao || '—'}</span>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      <div className="flex gap-2">
                        <button
                          className="px-3 py-1 rounded bg-amber-500 text-white hover:bg-amber-600 text-xs"
                          onClick={() => editar(item)}
                        >
                          Editar
                        </button>
                        <button
                          className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 text-xs"
                          onClick={() => apagar(item._id)}
                        >
                          Apagar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
