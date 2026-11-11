/* Nube: sincroniza los datos entre equipos con una llave.
   Al abrir y después de cada cambio: baja la copia de la nube, la une con la
   local (Almacen.importarJSON) y sube el resultado. Sin llave no hace nada. */
const Nube = (() => {
  const API = 'https://mecanografia-sync.jesusjonathan171.workers.dev/api/datos';
  const K_LLAVE = 'meca.nube.llave', K_ULTIMA = 'meca.nube.ultima';
  const MIN = 12;
  const lee = (k) => { try { return localStorage.getItem(k) || ''; } catch { return ''; } };
  const pon = (k, v) => { try { v ? localStorage.setItem(k, v) : localStorage.removeItem(k); } catch { /* modo privado */ } };

  let enCurso = null, otraVez = false, temporizador = null;
  const oyentes = [];
  let estado = '';
  function avisar(t) { estado = t; oyentes.forEach((f) => f(t)); }

  const llave = () => lee(K_LLAVE);
  function ponerLlave(v) {
    v = (v || '').trim();
    if (v && v.length < MIN) throw new Error(`La llave debe tener al menos ${MIN} caracteres.`);
    pon(K_LLAVE, v);
    avisar(v ? 'Llave guardada.' : 'Sincronización desactivada.');
  }
  function textoUltima() {
    const t = Number(lee(K_ULTIMA));
    if (!t) return 'Aún no se ha sincronizado en este equipo.';
    const min = Math.round((Date.now() - t) / 60000);
    return 'Última sincronización: ' + (min < 1 ? 'justo ahora' : min < 60 ? `hace ${min} min` : new Date(t).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })) + '.';
  }

  async function pedir(metodo, cuerpo) {
    const r = await fetch(API, { method: metodo, body: cuerpo, headers: { Authorization: 'Bearer ' + llave(), ...(cuerpo ? { 'Content-Type': 'application/json' } : {}) } });
    if (r.status === 404 && metodo === 'GET') return null;
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || `Error ${r.status}`);
    return d;
  }

  // Devuelve cuántas pruebas nuevas llegaron de la nube (o lanza error).
  function sincronizar() {
    if (!llave()) return Promise.resolve(0);
    if (enCurso) { otraVez = true; return enCurso; }
    avisar('Sincronizando…');
    enCurso = (async () => {
      const remoto = await pedir('GET');
      const n = remoto ? Almacen.importarJSON(remoto.datos) : 0;
      await pedir('PUT', Almacen.exportarJSON());
      pon(K_ULTIMA, String(Date.now()));
      avisar(textoUltima());
      return n;
    })().catch((e) => {
      avisar('No se pudo sincronizar: ' + (navigator.onLine === false ? 'sin conexión.' : e.message));
      throw e;
    }).finally(() => {
      enCurso = null;
      if (otraVez) { otraVez = false; programar(); }
    });
    return enCurso;
  }
  function programar() {
    if (!llave()) return;
    clearTimeout(temporizador);
    temporizador = setTimeout(() => sincronizar().catch(() => {}), 2500);
  }
  window.addEventListener('online', programar);

  return { llave, ponerLlave, sincronizar, programar, textoUltima, alCambiar: (f) => oyentes.push(f), get estado() { return estado; }, MIN };
})();
