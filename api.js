// Capa de acceso a datos: único módulo que habla con el backend.
import { API_URL } from "./config.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const details = new Map(); // caché en memoria: no se repite una petición ya hecha

async function getJson(path, { retries = 3, onRetry } = {}) {
  let lastErr;
  for (let i = 0; i <= retries; i++) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 25000);
    try {
      const res = await fetch(API_URL + path, { signal: ctl.signal });
      if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status}`), { status: res.status });
      return await res.json();
    } catch (e) {
      if (e.status && e.status < 500) throw e; // 4xx: no tiene sentido reintentar
      lastErr = e;
      if (i < retries) { onRetry?.(i + 1); await sleep(1500 * (i + 1)); } // backoff (cold start)
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr;
}

// Catálogo completo: /api/pokemon admite limit<=100, se pagina con offset (2 peticiones para 150).
export async function listAll(onRetry) {
  const first = await getJson("/api/pokemon?limit=100&offset=0", { onRetry });
  let items = first.data ?? [];
  const total = first.meta?.total ?? items.length;
  while (items.length < total) {
    const page = await getJson(`/api/pokemon?limit=100&offset=${items.length}`, { onRetry });
    if (!page.data?.length) break;
    items = items.concat(page.data);
  }
  return items;
}

export const peekDetail = (id) => details.get(id) ?? null;

export async function getDetail(id, onRetry) {
  if (details.has(id)) return details.get(id);
  const d = await getJson(`/api/pokemon/${id}`, { onRetry });
  details.set(id, d);
  return d;
}
