import { useEffect, useRef, useState } from 'react';
import api, { apiUploadImagem } from "../services/api";

export default function CadastroCardapio() {
  // form
  const [data, setData] = useState(() => new Date().toISOString().substring(0, 10));
  const [c1Desc, setC1Desc] = useState('');
  const [c2Desc, setC2Desc] = useState('');
  const [img1, setImg1] = useState('');
  const [img2, setImg2] = useState('');
  const [msg, setMsg] = useState('');
  const [editId, setEditId] = useState(null);

  // lista
  const [lista, setLista] = useState([]);

  // refs camera/galeria
  const cam1Ref = useRef(null);
  const gal1Ref = useRef(null);
  const cam2Ref = useRef(null);
  const gal2Ref = useRef(null);

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
    setC1Desc('');
    setC2Desc('');
    setImg1('');
    setImg2('');
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
  async function onPick(file, setImg) {
    if (!file) return;
    try {
      const url = await uploadImagem(file);
      setImg(url);
      setMsg('📸 Imagem enviada!');
    } catch (e) {
      setMsg('❌ Falha no upload da imagem.');
    }
  }

  // salvar / editar
  async function salvar(e) {
    e.preventDefault();
    setMsg('');

    const payload = {
      data,
      cardapio1: { descricao: c1Desc, imagem: img1 },
      cardapio2: { descricao: c2Desc, imagem: img2 }
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
    setC1Desc(item.cardapio1?.descricao || '');
    setC2Desc(item.cardapio2?.descricao || '');
    setImg1(item.cardapio1?.imagem || '');
    setImg2(item.cardapio2?.imagem || '');
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

  const Picker = ({ camRef, galRef, onPickFile }) => (
    <div className="flex gap-2 flex-wrap">
      <input
        ref={camRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => onPickFile(e.target.files?.[0])}
      />
      <input
        ref={galRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onPickFile(e.target.files?.[0])}
      />
      <button
        type="button"
        onClick={() => camRef.current?.click()}
        className="px-3 py-2 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700 w-full sm:w-auto"
      >
        Tirar foto
      </button>
      <button
        type="button"
        onClick={() => galRef.current?.click()}
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

        {/* Cardápio 1 */}
        <h2 className="mt-4 font-semibold">Cardápio 1</h2>
        <textarea
          className="w-full border rounded px-3 py-2"
          placeholder="Ex.: Tropeiro, Salada, Ovo, Carne"
          rows={3}
          value={c1Desc}
          onChange={e => setC1Desc(e.target.value)}
          required
        />
        <div className="mt-2 flex items-center gap-3 flex-wrap">
          <ImgPreview src={img1} alt="Cardápio 1" />
          <Picker camRef={cam1Ref} galRef={gal1Ref} onPickFile={(file) => onPick(file, setImg1)} />
        </div>

        {/* Cardápio 2 */}
        <h2 className="mt-4 font-semibold">Cardápio 2</h2>
        <textarea
          className="w-full border rounded px-3 py-2"
          placeholder="Ex.: Arroz, Macarrão, Farofa"
          rows={3}
          value={c2Desc}
          onChange={e => setC2Desc(e.target.value)}
          required
        />
        <div className="mt-2 flex items-center gap-3 flex-wrap">
          <ImgPreview src={img2} alt="Cardápio 2" />
          <Picker camRef={cam2Ref} galRef={gal2Ref} onPickFile={(file) => onPick(file, setImg2)} />
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

      {/* LISTA (mesmo conteúdo que você já tinha) */}
      {/* ...mantém a lista/tabela exatamente como estava... */}
    </div>
  );
}
