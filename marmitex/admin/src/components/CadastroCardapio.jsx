import { useEffect, useRef, useState } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
      const { data } = await axios.get(`${API}/api/cardapios?limit=50`);
      setLista(data);
    } catch {/* ignore */}
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
    return rel?.startsWith('/uploads') ? `${API}${rel}` : rel;
  }

  // ---- upload ----
  async function uploadImagem(file) {
    const form = new FormData();
    form.append('file', file);
    const { data } = await axios.post(`${API}/api/upload`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data.url; // ex: /uploads/123.jpg
  }

  async function onPick(file, setImg) {
    if (!file) return;
    try {
      const url = await uploadImagem(file);
      setImg(url);
      setMsg('📸 Imagem enviada!');
    } catch {
      setMsg('❌ Falha no upload da imagem.');
    }
  }

  // ---- salvar/editar ----
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
        await axios.post(`${API}/api/cardapios`, payload);
        setMsg('✅ Cardápio salvo!');
      } else {
        await axios.put(`${API}/api/cardapios/${editId}`, payload);
        setMsg('✅ Cardápio atualizado!');
      }
      await carregarLista();
      resetForm();
      // Atualiza simulador (se aberto)
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
      await axios.delete(`${API}/api/cardapios/${id}`);
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
      <img src={fullUrl(src)} alt={alt} className="h-32 w-32 object-cover rounded-lg border" />
    ) : (
      <div className="h-32 w-32 rounded-lg border flex items-center justify-center text-xs text-gray-500">
        Sem imagem
      </div>
    )
  );

  const Picker = ({ camRef, galRef, onPickFile }) => (
    <div className="flex gap-2 flex-wrap">
      {/* inputs ocultos */}
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
      {/* botões */}
      <button
        type="button"
        onClick={() => camRef.current?.click()}
        className="px-3 py-2 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700"
      >
        Tirar foto
      </button>
      <button
        type="button"
        onClick={() => galRef.current?.click()}
        className="px-3 py-2 text-sm bg-slate-600 text-white rounded hover:bg-slate-700"
      >
        Galeria
      </button>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto">
      {/* FORM */}
      <form ref={formRef} onSubmit={salvar} className="bg-white p-4 rounded shadow">
        <h1 className="text-xl sm:text-2xl font-bold mb-3">
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
        <div className="mt-2 flex items-center gap-3">
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
        <div className="mt-2 flex items-center gap-3">
          <ImgPreview src={img2} alt="Cardápio 2" />
          <Picker camRef={cam2Ref} galRef={gal2Ref} onPickFile={(file) => onPick(file, setImg2)} />
        </div>

        <div className="mt-4 flex gap-2">
          <button className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700">
            {editId ? 'Salvar alterações' : 'Salvar cardápio'}
          </button>
          {editId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 rounded border bg-white hover:bg-gray-50"
            >
              Cancelar edição
            </button>
          )}
        </div>
      </form>

      {/* LISTA */}
      <div className="mt-6 bg-white p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-3">Registros de Cardápio</h2>
        {lista.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhum cardápio cadastrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left text-sm font-medium">Data</th>
                  <th className="px-3 py-2 text-left text-sm font-medium">Cardápio 1</th>
                  <th className="px-3 py-2 text-left text-sm font-medium">Cardápio 2</th>
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
                      <div className="flex items-center gap-2">
                        {item.cardapio1?.imagem ? (
                          <img
                            src={fullUrl(item.cardapio1.imagem)}
                            alt="c1"
                            className="h-10 w-10 rounded object-cover border"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded border flex items-center justify-center text-[10px] text-gray-400">—</div>
                        )}
                        <span>{item.cardapio1?.descricao}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-sm">
                      <div className="flex items-center gap-2">
                        {item.cardapio2?.imagem ? (
                          <img
                            src={fullUrl(item.cardapio2.imagem)}
                            alt="c2"
                            className="h-10 w-10 rounded object-cover border"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded border flex items-center justify-center text-[10px] text-gray-400">—</div>
                        )}
                        <span>{item.cardapio2?.descricao}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-sm">
                      <div className="flex gap-2">
                        <button
                          className="px-3 py-1 rounded bg-amber-500 text-white hover:bg-amber-600"
                          onClick={() => editar(item)}
                        >
                          Editar
                        </button>
                        <button
                          className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
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
          </div>
        )}
      </div>
    </div>
  );
}
