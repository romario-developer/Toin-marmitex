// marmitex/frontend/src/services/api.js
import axios from 'axios';

// Base URL do backend
const API_BASE =
  import.meta.env.VITE_API_BASE ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000';

// Mantemos compat com 'adm_token' e 'token'
const TOKEN_KEYS = ['adm_token', 'token'];

export function getToken() {
  for (const k of TOKEN_KEYS) {
    const v = localStorage.getItem(k);
    if (v) return v;
  }
  return null;
}

export function setToken(t) {
  for (const k of TOKEN_KEYS) {
    if (t) localStorage.setItem(k, t);
    else localStorage.removeItem(k);
  }
}

export function clearToken() {
  setToken(null);
}

// Cliente axios único
const api = axios.create({ baseURL: API_BASE });

// Interceptor: Authorization e Content-Type
api.interceptors.request.use((config) => {
  const token = getToken();
  config.headers = config.headers || {};
  if (token) config.headers.Authorization = `Bearer ${token}`;

  const isForm =
    typeof FormData !== 'undefined' && config.data instanceof FormData;
  if (!isForm) {
    config.headers['Content-Type'] =
      config.headers['Content-Type'] || 'application/json';
  } else if (config.headers['Content-Type']) {
    delete config.headers['Content-Type']; // deixa o browser setar o boundary
  }
  return config;
});

// 401 -> /login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401 && location.pathname !== '/login') {
      location.replace('/login');
    }
    return Promise.reject(err);
  }
);

// ---------- AUTH ----------
export async function apiLogin({ email, senha }) {
  const { data } = await api.post('/api/auth/login', {
    email,
    password: senha,
  });
  return data; // { token, email, ... }
}

// ---------- UPLOAD ----------
export async function apiUploadImagem(file, fieldName = 'file') {
  const fd = new FormData();
  fd.append(fieldName, file);
  const { data } = await api.post('/api/upload', fd);
  return data; // { url: '/uploads/...' }
}

// ---------- CARDÁPIOS ----------
export async function apiListarCardapios({ limit = 50 } = {}) {
  const { data } = await api.get(`/api/cardapios?limit=${limit}`);
  return data; // array
}
export async function apiCriarCardapio(payload) {
  const { data } = await api.post('/api/cardapios', payload);
  return data;
}
export async function apiAtualizarCardapio(id, payload) {
  const { data } = await api.put(`/api/cardapios/${id}`, payload);
  return data;
}
export async function apiExcluirCardapio(id) {
  const { data } = await api.delete(`/api/cardapios/${id}`);
  return data;
}

// ---------- CONFIGURAÇÕES ----------
export async function apiGetConfiguracoes() {
  const { data } = await api.get('/api/configuracoes');
  return data;
}
export async function apiSalvarConfiguracoes(payload) {
  const { data } = await api.put('/api/configuracoes', payload);
  return data;
}

// ---------- PEDIDOS ----------
export async function apiGetPedidos({ status, limit = 100 } = {}) {
  const qs = new URLSearchParams();
  if (status) qs.set('status', status);
  if (limit) qs.set('limit', String(limit));
  const { data } = await api.get(`/api/pedidos?${qs.toString()}`);
  return data;
}
export async function apiPatchPedido(id, payload) {
  const { data } = await api.patch(`/api/pedidos/${id}`, payload);
  return data;
}

export default api;
