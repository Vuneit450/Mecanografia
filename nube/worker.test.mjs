// Prueba el Worker con un Durable Object falso en memoria: node --test nube/
import test from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';

// "cloudflare:workers" no existe en Node: se sustituye por una clase vacía.
register('data:text/javascript,' + encodeURIComponent(`
export async function resolve(s, c, n) { return s === 'cloudflare:workers' ? { url: 'data:text/javascript,export class DurableObject { constructor(ctx, env) { this.ctx = ctx; this.env = env; } }', shortCircuit: true } : n(s, c); }`));
const { default: worker, Cuenta } = await import('./worker.js');

function almacen() {
  const m = new Map();
  const api = {
    get: async (k) => (Array.isArray(k) ? new Map(k.filter((x) => m.has(x)).map((x) => [x, m.get(x)])) : m.get(k)),
    put: async (k, v) => { m.set(k, v); }, delete: async (k) => m.delete(k),
    transaction: async (fn) => fn(api), _m: m,
  };
  return api;
}
function entorno() {
  const objs = new Map();
  return { CUENTAS: { idFromName: (n) => n, get: (id) => { if (!objs.has(id)) objs.set(id, new Cuenta({ storage: almacen() }, {})); return objs.get(id); } }, objs };
}
const pedir = (env, metodo, llave, cuerpo, origen = 'https://vuneit450.github.io') => worker.fetch(new Request('https://x/api/datos', {
  method: metodo, body: cuerpo, headers: { Origin: origen, ...(llave ? { Authorization: 'Bearer ' + llave } : {}) } }), env);
const datos = (n, extra = '') => JSON.stringify({ app: 'mecanografia', sesiones: Array.from({ length: n }, (_, i) => ({ id: 's' + i, nota: extra })) });

test('sin llave o con llave corta se rechaza', async () => {
  const env = entorno();
  assert.equal((await pedir(env, 'GET', '')).status, 401);
  assert.equal((await pedir(env, 'GET', 'corta')).status, 401);
});

test('guardar y leer con la misma llave; otra llave no ve nada', async () => {
  const env = entorno();
  assert.equal((await pedir(env, 'GET', 'llave-larga-uno')).status, 404);
  assert.equal((await pedir(env, 'PUT', 'llave-larga-uno', datos(3))).status, 200);
  const r = await pedir(env, 'GET', 'llave-larga-uno');
  assert.equal(r.status, 200);
  assert.equal(JSON.parse((await r.json()).datos).sesiones.length, 3);
  assert.equal((await pedir(env, 'GET', 'llave-larga-dos')).status, 404);
  assert.ok(![...env.objs.keys()].some((k) => k.includes('llave')), 'la llave no se guarda en claro');
});

test('datos grandes se parten en trozos y al achicarse se borran los sobrantes', async () => {
  const env = entorno();
  const grande = datos(50, 'x'.repeat(10000));
  await pedir(env, 'PUT', 'llave-larga-uno', grande);
  assert.equal(JSON.parse((await (await pedir(env, 'GET', 'llave-larga-uno')).json()).datos).sesiones.length, 50);
  await pedir(env, 'PUT', 'llave-larga-uno', datos(1));
  const st = [...env.objs.values()][0].ctx.storage._m;
  assert.equal([...st.keys()].filter((k) => k.startsWith('t')).length, 1);
  assert.equal(JSON.parse((await (await pedir(env, 'GET', 'llave-larga-uno')).json()).datos).sesiones.length, 1);
});

test('rechaza formato inválido y responde CORS solo al sitio propio', async () => {
  const env = entorno();
  assert.equal((await pedir(env, 'PUT', 'llave-larga-uno', '{"hola":1}')).status, 400);
  assert.equal((await pedir(env, 'PUT', 'llave-larga-uno', 'no json')).status, 400);
  const ok = await pedir(env, 'OPTIONS', '', undefined);
  assert.equal(ok.headers.get('Access-Control-Allow-Origin'), 'https://vuneit450.github.io');
  const ajeno = await pedir(env, 'OPTIONS', '', undefined, 'https://malo.example');
  assert.equal(ajeno.headers.get('Access-Control-Allow-Origin'), null);
});
