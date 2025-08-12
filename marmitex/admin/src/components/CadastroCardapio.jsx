import { useEffect, useState, useRef } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function CadastroCardapio() {
  const [data, setData] = useState(() => new Date().toISOString().substring(0, 10));
  const [c1Desc, setC1Desc] = useState('');
  const [c2Desc, setC2Desc] = useState('');
  const [img1, setImg1] = useState('');
  const [img2, setImg2] = useState('');
  const [msg, setMsg] = useState('');
  const [isHoje, setIsHoje] = useState(true);
  const [editingHoje, setEditingHoje] = useState(false);

  // refs para inputs de arquivo (camera/galeria)
  const cam1Ref = useRef(null);
  const gal1Ref = useRef(null);
  const cam2Ref = useRef(null);
  const gal2Ref = useRef(null);

  useEffect(() => { carregarHoje(); }, []);
  useEffect(() => {
    const hojeStr = new Date().toISOString().substring(0, 10);
    setIsHoje(data === hojeStr);
  }, [data]);

  async function carregarHoje() {
    try {
      const { data: d } = await axios.get(`${API}/api/cardapios/hoje`);
      setData(new Date(d.data).toISOString().substring(0, 10));
      setC1Desc(d.cardapio1?.descricao || '');
      setC2Desc(d.cardapio2?.descricao || '');
      setImg1(d.cardapio1?.imagem || '');
      setImg2(d.cardapio2?.imagem || '');
      setEditingHoje(true);
      setMsg('ℹ️ Carregado cardápio de hoje.');
    } catch {
      setEditingHoje(false);
      setMsg('');
    }
  }

  async function uploadImagem(file) {
    const form = new FormData();
    form.append('file', file);
    const { data } = await axios.post(`${API}/api/upload`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data.url; // /uploads/arquivo.jpg
  }

  async function onPick(file, setImg) {
    if (!file) return;
    const url = await uploadImagem(file);
    setImg(url);
  }

  async function salvar(e) {
    e.preventDefault();
    setMsg('');

    const payload = {
      data,
      cardapio1: { descricao: c1Desc, imagem: img1 },
      cardapio2: { descricao: c2Desc, imagem: img2 }
    };

    try {
      if (isHoje && editingHoje) {
        await axios.put(`${API}/api/cardapios/hoje`, payload);
        setMsg('✅ Cardápio de hoje atualizado com sucesso!');
      } else if (isHoje && !editingHoje) {
        await axios.post(`${API}/api/cardapios`, payload);
        setEditingHoje(true);
        setMsg('✅ Cardápio de hoje salvo com sucesso!');
      } else {
        await axios.post(`${API}/api/cardapios`, payload);
        setMsg('✅ Cardápio salvo com sucesso!');
      }
      window.dispatchEvent(new CustomEvent('cardapio-atualizado'));
    } catch {
      setMsg('❌ Erro ao salvar/atualizar cardápio.');
    }
  }

  const fullUrl = (rel) => rel?.startsWith('/uploads') ? `${API}${rel}` : rel;

  const ImgPreview = ({ src, alt }) => (
    src ? (
      <img
        src={fullUrl(src)}
        alt={alt}
        className="h-32 w-32 object-cover rounded-lg border"
      />
    ) : (
      <div className="h-32 w-32 rounded-lg border flex items-center justify-center text-xs text-gray-500">
        Sem imagem
      </div>
    )
  );

  const Picker = ({ camRef, galRef, onPickFile }) => (
    <div className="flex gap-2 flex-wrap">
      {/* Hidden inputs */}
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
      {/* Buttons */}
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
        Escolher da galeria
      </button>
    </div>
  );

  return (
    <form onSubmit={salvar} className="bg-white p-3 sm:p-4 rounded shadow max-w-3xl mx-auto">
      <h1 className="text-xl sm:text-2xl font-bold mb-2 text-center">Cadastro de Cardápio</h1>
      {msg && <p className="mb-3 text-sm">{msg}</p>}

      <div className="mb-3">
        <label className="block text-sm font-medium mb-1">Data</label>
        <input
          type="date"
          className="w-full border rounded px-3 py-2"
          value={data}
          onChange={e => setData(e.target.value)}
          required
        />
        {isHoje && editingHoje && (
          <p className="text-xs text-emerald-700 mt-1">Editando o cardápio de hoje.</p>
        )}
      </div>

      {/* Cardápio 1 */}
      <h2 className="mt-2 font-semibold">Cardápio 1</h2>
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
        <Picker
          camRef={cam1Ref}
          galRef={gal1Ref}
          onPickFile={(file) => onPick(file, setImg1)}
        />
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
        <Picker
          camRef={cam2Ref}
          galRef={gal2Ref}
          onPickFile={(file) => onPick(file, setImg2)}
        />
      </div>

      <button className="mt-4 bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 w-full sm:w-auto">
        {isHoje ? (editingHoje ? 'Atualizar Cardápio de Hoje' : 'Salvar Cardápio de Hoje') : 'Salvar Cardápio'}
      </button>
    </form>
  );
}
