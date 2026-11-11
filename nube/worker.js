// Nube de Mecanografía: guarda una copia de los datos por llave.
// GET  /api/datos  → { datos, actualizado } o 404 si aún no hay nada.
// PUT  /api/datos  → guarda el JSON del cuerpo (lo que exporta la app).
// La llave va en "Authorization: Bearer <llave>". El servidor solo guarda su
// SHA-256 como nombre del Durable Object: la llave nunca se almacena.
import { DurableObject } from 'cloudflare:workers';

const MIN_LLAVE = 12;
const MAX_BYTES = 25 * 1024 * 1024;
const TROZO = 100 * 1024; // el almacenamiento limita el tamaño de cada valor
const ORIGENES = ['https://vuneit450.github.io', 'http://localhost:8000', 'http://127.0.0.1:8000'];

function cors(origen) {
  const h = { 'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS', 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Access-Control-Max-Age': '86400', Vary: 'Origin' };
  if (ORIGENES.includes(origen)) h['Access-Control-Allow-Origin'] = origen;
  return h;
}
const json = (obj, status, extra) => new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', ...extra } });

async function sha256(txt) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(txt));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export class Cuenta extends DurableObject {
  async leer() {
    const meta = await this.ctx.storage.get('meta');
    if (!meta) return null;
    const claves = Array.from({ length: meta.trozos }, (_, i) => 't' + i);
    const mapa = await this.ctx.storage.get(claves);
    return { datos: claves.map((k) => mapa.get(k) || '').join(''), actualizado: meta.actualizado };
  }
  async escribir(txt) {
    const anterior = (await this.ctx.storage.get('meta'))?.trozos || 0;
    const trozos = Math.max(1, Math.ceil(txt.length / TROZO));
    const actualizado = Date.now();
    await this.ctx.storage.transaction(async (t) => {
      for (let i = 0; i < trozos; i++) await t.put('t' + i, txt.slice(i * TROZO, (i + 1) * TROZO));
      for (let i = trozos; i < anterior; i++) await t.delete('t' + i);
      await t.put('meta', { trozos, actualizado });
    });
    return actualizado;
  }
}

export default {
  async fetch(req, env) {
    const origen = req.headers.get('Origin') || '';
    const h = cors(origen);
    const url = new URL(req.url);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });
    if (url.pathname !== '/api/datos') return json({ error: 'No existe' }, 404, h);
    const llave = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    if (llave.length < MIN_LLAVE) return json({ error: `La llave debe tener al menos ${MIN_LLAVE} caracteres.` }, 401, h);
    try {
      const cuenta = env.CUENTAS.get(env.CUENTAS.idFromName(await sha256(llave)));
      if (req.method === 'GET') {
        const r = await cuenta.leer();
        return r ? json(r, 200, h) : json({ error: 'Sin datos todavía' }, 404, h);
      }
      if (req.method === 'PUT') {
        const txt = await req.text();
        if (txt.length > MAX_BYTES) return json({ error: 'Los datos son demasiado grandes.' }, 413, h);
        let d;
        try { d = JSON.parse(txt); } catch { d = null; }
        if (!d || d.app !== 'mecanografia' || !Array.isArray(d.sesiones)) return json({ error: 'Formato no válido.' }, 400, h);
        return json({ actualizado: await cuenta.escribir(txt) }, 200, h);
      }
      return json({ error: 'Método no permitido' }, 405, h);
    } catch (e) {
      return json({ error: 'Error del servidor: ' + (e && e.message) }, 500, h);
    }
  },
};
