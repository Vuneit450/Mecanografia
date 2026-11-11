/* Almacén: todos los datos viven en el navegador del usuario.
   - Sesiones (con cada pulsación) → IndexedDB "mecanografia" / almacén "sesiones".
   - Ajustes, textos propios y progreso → localStorage.
   Todo es exportable a JSON y CSV desde la vista Historial. */
const Almacen = (() => {
  const K_AJUSTES = 'meca.ajustes', K_TEXTOS = 'meca.textos', K_PROGRESO = 'meca.progreso', K_BORRADAS = 'meca.borradas';
  const AJUSTES_DEF = {
    fuente: 'lecciones', medida: 'completo', tiempo: 60, palabras: 25, modoError: 'estricto',
    sinAcentos: false, minusculas: false, sinPuntuacion: false,
    leccionId: '', textoId: '',
    tema: 'tinta', tamano: 26, sonido: false, fantasma: 'no', enfoque: true, metaMin: 10,
    rango: 'todas', calor: 'errores',
  };

  const leer = (k, def) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? def; } catch { return def; } };
  const escribir = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin espacio o modo privado */ } };

  let ajustes = { ...AJUSTES_DEF, ...leer(K_AJUSTES, {}) };
  let textos = leer(K_TEXTOS, []);
  let progreso = { lecciones: {}, textos: {}, ...leer(K_PROGRESO, {}) };
  // Ids de pruebas borradas: viajan con la nube para que no "revivan" desde otro equipo.
  let borradas = new Set(leer(K_BORRADAS, []));
  let sesiones = [];   // caché en memoria, ordenada por fecha ascendente
  let db = null;

  function abrir() {
    return new Promise((res) => {
      if (!('indexedDB' in window)) return res();
      let pet;
      try { pet = indexedDB.open('mecanografia', 1); } catch { return res(); }
      pet.onupgradeneeded = () => pet.result.createObjectStore('sesiones', { keyPath: 'id' });
      pet.onerror = () => res();
      pet.onsuccess = () => {
        db = pet.result;
        const todo = db.transaction('sesiones').objectStore('sesiones').getAll();
        todo.onsuccess = () => { sesiones = todo.result.sort((a, b) => a.fecha < b.fecha ? -1 : 1); res(); };
        todo.onerror = () => res();
      };
    });
  }
  const tx = (fn) => { if (db) try { fn(db.transaction('sesiones', 'readwrite').objectStore('sesiones')); } catch { /* ignorar */ } };

  // Avisa a la nube que hubo cambios (salvo mientras se importan datos de ella).
  let silencio = false;
  const cambio = () => { if (!silencio && typeof Nube !== 'undefined') Nube.programar(); };

  function guardarSesion(s) { sesiones.push(s); tx((st) => st.put(s)); cambio(); }
  function marcarBorradas(ids) { for (const id of ids) borradas.add(id); escribir(K_BORRADAS, [...borradas]); }
  function borrarSesion(id) { marcarBorradas([id]); sesiones = sesiones.filter((s) => s.id !== id); tx((st) => st.delete(id)); cambio(); }
  function borrarSesiones() { marcarBorradas(sesiones.map((s) => s.id)); sesiones = []; tx((st) => st.clear()); cambio(); }

  function guardarAjustes() { escribir(K_AJUSTES, ajustes); }
  function guardarTextos() { escribir(K_TEXTOS, textos); cambio(); }
  function guardarProgreso() { escribir(K_PROGRESO, progreso); cambio(); }

  // ── Exportación ──
  function exportarJSON() {
    return JSON.stringify({ app: 'mecanografia', version: 1, exportado: new Date().toISOString(),
      ajustes, textos, progreso, sesiones, borradas: [...borradas] });
  }
  // Une los datos recibidos con los locales (no reemplaza): agrega pruebas y
  // textos que falten y respeta lo borrado en cualquiera de los dos lados.
  function importarJSON(txt) {
    const d = JSON.parse(txt);
    if (!d || !Array.isArray(d.sesiones)) throw new Error('El archivo no tiene el formato esperado.');
    silencio = true;
    try { return unir(d); } finally { silencio = false; }
  }
  function unir(d) {
    if (Array.isArray(d.borradas)) {
      const nuevas = d.borradas.filter((id) => !borradas.has(id));
      if (nuevas.length) {
        marcarBorradas(nuevas);
        const quitar = new Set(nuevas);
        sesiones = sesiones.filter((s) => !quitar.has(s.id));
        tx((st) => nuevas.forEach((id) => st.delete(id)));
      }
    }
    const ids = new Set(sesiones.map((s) => s.id));
    let n = 0;
    for (const s of d.sesiones) if (s && s.id && !ids.has(s.id) && !borradas.has(s.id)) { guardarSesion(s); n++; }
    sesiones.sort((a, b) => a.fecha < b.fecha ? -1 : 1);
    if (Array.isArray(d.textos)) {
      const tid = new Set(textos.map((t) => t.id));
      for (const t of d.textos) if (t && t.id && !tid.has(t.id)) textos.push(t);
      guardarTextos();
    }
    if (d.progreso) {
      progreso.lecciones = { ...d.progreso.lecciones, ...progreso.lecciones };
      progreso.textos = { ...d.progreso.textos, ...progreso.textos };
      guardarProgreso();
    }
    return n;
  }
  const celda = (v) => { const s = String(v ?? ''); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  const csv = (filas) => '﻿' + filas.map((f) => f.map(celda).join(',')).join('\r\n');

  function csvSesiones() {
    const f = [['sesion_id', 'fecha', 'fuente', 'medida', 'limite', 'modo_error', 'titulo', 'duracion_s', 'ppm', 'ppm_bruto',
      'precision_pct', 'consistencia_pct', 'caracteres', 'correctas', 'errores', 'completada', 'sin_acentos', 'minusculas', 'sin_puntuacion']];
    for (const s of sesiones) f.push([s.id, s.fecha, s.fuente, s.medida, s.limite, s.modoError, s.titulo, (s.duracionMs / 1000).toFixed(1),
      s.ppm, s.bruto, s.precision, s.consistencia, s.caracteres, s.correctas, s.errores, s.completada ? 1 : 0,
      s.opciones?.sinAcentos ? 1 : 0, s.opciones?.minusculas ? 1 : 0, s.opciones?.sinPuntuacion ? 1 : 0]);
    return csv(f);
  }
  function csvTeclas() {
    const f = [['sesion_id', 'fecha', 'n', 'posicion', 'anterior', 'esperado', 'tecleado', 'ms', 'latencia_ms', 'correcto']];
    for (const s of sesiones) {
      let ant = 0, antEsp = '';
      (s.teclas || []).forEach((k, n) => {
        f.push([s.id, s.fecha, n + 1, k[0], antEsp, k[1], k[2], k[3], k[3] - ant, k[4]]);
        ant = k[3]; if (k[4]) antEsp = k[1];
      });
    }
    return csv(f);
  }

  return {
    abrir, AJUSTES_DEF,
    get ajustes() { return ajustes; }, get textos() { return textos; }, get progreso() { return progreso; },
    get sesiones() { return sesiones; },
    set textos(v) { textos = v; },
    guardarAjustes, guardarTextos, guardarProgreso, guardarSesion, borrarSesion, borrarSesiones,
    exportarJSON, importarJSON, csvSesiones, csvTeclas,
  };
})();
