/* Interfaz: une el motor, el almacén y el análisis con el DOM. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const aj = Almacen.ajustes;
  const ver = Analisis.ver;
  const azar = (a) => a[Math.floor(Math.random() * a.length)];
  const barajar = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const media = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
  const fechaCorta = (f) => new Date(f).toLocaleDateString('es', { day: 'numeric', month: 'short' });
  const duracion = (ms) => { const s = Math.round(ms / 1000); return s < 60 ? s + ' s' : Math.floor(s / 60) + ' min ' + (s % 60 ? (s % 60) + ' s' : ''); };

  const FUENTES = [['lecciones', 'Lecciones IA'], ['glosario', 'Glosario IA'], ['palabras', 'Palabras'], ['propio', 'Mis textos'], ['debiles', 'Puntos débiles']];
  const NOMBRE_FUENTE = { ...Object.fromEntries(FUENTES), errores: 'Repaso de errores' };
  const MEDIDAS = [['tiempo', 'Tiempo'], ['palabras', 'Palabras'], ['completo', 'Completo']];
  const MODOS = [['estricto', 'Estricto', 'No avanza hasta que escribes la letra correcta'], ['libre', 'Libre', 'Avanza aunque falles; puedes borrar para corregir'], ['subita', 'Muerte súbita', 'El primer error termina la prueba']];
  const PALABRAS_U = [...new Set(PALABRAS)];
  const BANCO = [...new Set(PALABRAS.concat(
    (LECCIONES.map((l) => l.texto).join(' ') + ' ' + GLOSARIO.join(' ')).toLowerCase().replace(/[^\p{L}\s]/gu, ' ').split(/\s+/)
  ).filter((w) => w.length >= 2))];

  // ───────────────────────── Texto ─────────────────────────
  function normalizar(t) {
    return t.replace(/[“”«»]/g, '"').replace(/[‘’]/g, "'").replace(/[—–]/g, '-').replace(/…/g, '...')
      .replace(/\s+/g, ' ').trim();
  }
  function transformar(t) {
    t = normalizar(t);
    if (aj.sinAcentos) t = t.replace(/ñ/g, '\u0001').replace(/Ñ/g, '\u0002').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\u0001/g, 'ñ').replace(/\u0002/g, 'Ñ');
    if (aj.minusculas) t = t.toLowerCase();
    if (aj.sinPuntuacion) t = t.replace(/[^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, ' ').trim();
    return t;
  }
  const palabrasAzar = (banco, n) => { const o = []; while (o.length < n) { const w = azar(banco); if (w !== o[o.length - 1]) o.push(w); } return o; };

  let fuenteEspecial = null;
  function construirFuente() {
    const T = transformar;
    const f = { tipo: aj.fuente, titulo: '', texto: '', mas: null, leccion: null, propio: null, nota: '' };
    if (fuenteEspecial) {
      Object.assign(f, { tipo: 'errores', titulo: 'Repaso de las palabras que fallaste', texto: T(fuenteEspecial) });
      return f;                                   // el repaso siempre se escribe completo
    }
    switch (aj.fuente) {
      case 'lecciones': {
        let i = LECCIONES.findIndex((l) => l.id === aj.leccionId);
        if (i < 0) i = LECCIONES.findIndex((l) => !Almacen.progreso.lecciones[l.id]);
        if (i < 0) i = Math.floor(Math.random() * LECCIONES.length);
        const lec = LECCIONES[i]; let k = i;
        // Las lecciones son largas: cualquier formato continúa donde lo dejaste.
        const w = T(lec.texto).split(' ');
        let ini = Almacen.progreso.posLeccion?.[lec.id] || 0;
        if (ini >= w.length) ini = 0;
        Object.assign(f, { leccion: lec, reanuda: { ini, total: w.length }, texto: w.slice(ini).join(' '),
          titulo: `${lec.cat} · ${lec.titulo}` + (ini ? ` · desde la palabra ${ini + 1} de ${w.length}` : '') });
        f.mas = () => { k = (k + 1) % LECCIONES.length; return T(LECCIONES[k].texto); };
        break;
      }
      case 'glosario': {
        let cola = [];
        const sig = () => { if (!cola.length) cola = barajar(GLOSARIO); return T(cola.pop()); };
        Object.assign(f, { titulo: 'Glosario de IA · definiciones al azar', texto: [sig(), sig(), sig(), sig()].join(' '), mas: sig });
        break;
      }
      case 'palabras': {
        const gen = () => T(palabrasAzar(PALABRAS_U, 50).join(' '));
        Object.assign(f, { titulo: 'Palabras frecuentes del español', texto: gen(), mas: gen });
        break;
      }
      case 'debiles': {
        const ag = Analisis.agregar(Almacen.sesiones.slice(-30));
        const gen = () => T(Analisis.practicaDebil(ag, BANCO, 40).palabras.join(' '));
        const top = ag.teclasDebiles.filter((t) => t.k !== '⇧').slice(0, 5).map((t) => ver(t.k));
        f.titulo = top.length ? 'Puntos débiles · refuerzo de ' + top.map((k) => `«${k}»`).join(' ') : 'Puntos débiles';
        if (!top.length) f.nota = 'Aún no hay suficientes datos: por ahora son palabras al azar. Completa algunas pruebas primero.';
        f.texto = gen(); f.mas = gen;
        break;
      }
      case 'propio': {
        const t = Almacen.textos.find((x) => x.id === aj.textoId) || Almacen.textos[0];
        if (!t) { f.nota = 'Todavía no tienes textos. Añade uno en la pestaña «Mis textos».'; f.texto = T('Añade tu propio texto en la pestaña Mis textos para practicar con él.'); break; }
        const w = T(t.texto).split(' ');
        let ini = (Almacen.progreso.textos[t.id]?.palabra || 0);
        if (ini >= w.length) ini = 0;
        f.propio = { id: t.id, ini, total: w.length };
        f.titulo = t.titulo + (ini ? ` · desde la palabra ${ini + 1} de ${w.length}` : '');
        f.texto = w.slice(ini).join(' ');
        f.mas = () => w.join(' ');
        break;
      }
    }
    if (aj.medida === 'palabras') {
      let w = f.texto.split(' ');
      while (w.length < aj.palabras && f.mas) w = w.concat(f.mas().split(' '));
      f.texto = w.slice(0, aj.palabras).join(' '); f.mas = null;
    } else if (aj.medida === 'tiempo') {
      if (!f.mas) { const base = f.texto; f.mas = () => base; }
      while (f.texto.length < 400) f.texto += ' ' + f.mas();
    } else f.mas = null;
    if (!f.texto) f.texto = 'texto vacío';
    return f;
  }

  // ───────────────────────── Prueba ─────────────────────────
  const ent = $('#entrada'), zona = $('#zona'), caja = $('#texto'), inter = $('#texto-int');
  let sesion = null, fuente = null, spans = [], renderizado = 0, reloj = null, cursor = null, fantasma = null, ppmFantasma = 0;

  function limite() { return aj.medida === 'tiempo' ? aj.tiempo : aj.medida === 'palabras' ? aj.palabras : 0; }

  function nuevaPrueba(o = {}) {
    cerrarSesion(false);
    if (!o.especial) fuenteEspecial = null;
    if (!o.repetir || !fuente) fuente = construirFuente();
    sesion = new Motor.Sesion(fuente.texto, aj.modoError);
    spans = []; renderizado = 0;
    inter.innerHTML = ''; inter.style.transform = '';
    cursor = document.createElement('div'); cursor.className = 'cursor';
    fantasma = document.createElement('div'); fantasma.className = 'cursor fantasma'; fantasma.hidden = true;
    inter.append(fantasma, cursor);
    renderHasta(600);
    const comp = Almacen.sesiones.filter((s) => s.completada);
    ppmFantasma = aj.fantasma === 'promedio' ? media(comp.slice(-10).map((s) => s.ppm))
      : aj.fantasma === 'mejor' ? Math.max(0, ...comp.filter((s) => s.medida === aj.medida).map((s) => s.ppm)) : 0;
    $('#p-titulo').innerHTML = `<b>${esc(fuente.titulo)}</b>` + (fuente.nota ? `<span class="nota">${esc(fuente.nota)}</span>` : '')
      + (fuente.leccion && fuente.reanuda?.ini ? ' <button type="button" class="mini" id="desde-cero">Empezar desde el principio</button>' : '');
    $('#resultados').hidden = true; $('#prueba').hidden = false;
    $('#pista').textContent = ''; $('#barra-int').style.width = '0';
    $('#v-ppm').textContent = '0'; $('#v-prec').textContent = '100';
    $('#v-tiempo').textContent = aj.medida === 'tiempo' ? aj.tiempo : '0';
    actualizarCursor(true);
    if (vistaActual === 'practicar') enfocar();
  }

  function renderHasta(n) {
    const t = sesion.texto;
    if (renderizado >= t.length) return;
    let fin = Math.min(t.length, n);
    if (fin <= renderizado) return;
    while (fin < t.length && t[fin - 1] !== ' ') fin++;
    const frag = document.createDocumentFragment(); let w = null;
    for (let i = renderizado; i < fin; i++) {
      if (!w || t[i - 1] === ' ') { w = document.createElement('span'); w.className = 'pal'; frag.append(w); }
      const c = document.createElement('span'); c.textContent = t[i];
      if (t[i] === ' ') c.className = 'esp';
      w.append(c); spans[i] = c;
    }
    inter.append(frag); renderizado = fin;
  }

  const CLASES = ['', 'ok', 'corr', 'mal'];
  function pintar(i) {
    const s = spans[i]; if (!s) return;
    const base = sesion.texto[i] === ' ' ? 'esp ' : '';
    let c = CLASES[sesion.estado[i] || 0];
    if (!c && i === sesion.pos && sesion.fallos[i]) c = 'fallo';
    s.className = base + c;
  }
  function posDe(i) {
    const s = spans[Math.min(i, renderizado - 1)];
    return { x: s.offsetLeft + (i >= renderizado ? s.offsetWidth : 0), y: s.offsetTop, h: s.offsetHeight };
  }
  function actualizarCursor(inmediato) {
    if (!spans.length) return;
    const p = posDe(sesion.pos), lh = aj.tamano * 1.7;
    cursor.style.transition = inmediato ? 'none' : '';
    cursor.style.height = p.h + 'px';
    cursor.style.transform = `translate(${p.x}px,${p.y}px)`;
    inter.style.transition = inmediato ? 'none' : '';
    inter.style.transform = `translateY(${-Math.max(0, p.y - spans[0].offsetTop - lh)}px)`;
  }

  let actx = null;
  function tic(ok) {
    if (!aj.sonido) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime;
      o.type = ok ? 'triangle' : 'square'; o.frequency.value = ok ? 600 + Math.random() * 80 : 150;
      g.gain.setValueAtTime(ok ? 0.05 : 0.07, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
      o.connect(g).connect(actx.destination); o.start(t); o.stop(t + 0.07);
    } catch { /* sin audio */ }
  }

  function procesar(ch) {
    if (!sesion || sesion.terminada || ch === '\n' || ch === '\r') return;
    const ahora = performance.now(), antes = sesion.pos, primera = sesion.inicio == null;
    const r = sesion.teclear(ch, ahora);
    if (r == null) return;
    if (primera) arrancar();
    pintar(antes);
    const fallo = r === 'error' || r === 'fallo' || (r === 'fin' && sesion.estado[antes] === 3);
    tic(!fallo);
    $('#pista').innerHTML = fallo ? `Tocaba <kbd>${esc(ver(sesion.texto[antes]))}</kbd> y escribiste <kbd>${esc(ver(ch === ' ' ? ' ' : ch))}</kbd>` : '';
    if (fallo) { zona.classList.remove('sacude'); void zona.offsetWidth; zona.classList.add('sacude'); }
    if (r === 'fin' || r === 'fallo') return cerrarSesion(true);
    if (fuente.mas && sesion.texto.length - sesion.pos < 300) sesion.extender(' ' + fuente.mas());
    renderHasta(sesion.pos + 500);
    actualizarCursor();
  }
  function borrar() {
    if (!sesion) return;
    if (sesion.borrar()) { pintar(sesion.pos); $('#pista').textContent = ''; actualizarCursor(); }
    else if (sesion.modo === 'estricto' && sesion.inicio != null && !sesion.terminada) $('#pista').textContent = 'En modo estricto no hace falta borrar: escribe la letra correcta.';
  }

  function arrancar() {
    if (aj.enfoque) document.body.classList.add('escribiendo');
    clearInterval(reloj);
    reloj = setInterval(latido, 100);
  }
  function latido() {
    if (!sesion || sesion.terminada) return;
    const ahora = performance.now(), ms = sesion.ms(ahora);
    if (aj.medida === 'tiempo' && !fuenteEspecial && ms >= aj.tiempo * 1000) {
      sesion.terminar(sesion.inicio + aj.tiempo * 1000);
      return cerrarSesion(true);
    }
    $('#v-ppm').textContent = ms > 1000 ? Math.round(sesion.ppm(ahora)) : 0;
    $('#v-prec').textContent = Math.round(sesion.precision());
    const tiempo = aj.medida === 'tiempo' && !fuenteEspecial;
    $('#v-tiempo').textContent = tiempo ? Math.max(0, Math.ceil(aj.tiempo - ms / 1000)) : Math.floor(ms / 1000);
    $('#barra-int').style.width = (100 * (tiempo ? ms / (aj.tiempo * 1000) : sesion.pos / sesion.texto.length)).toFixed(1) + '%';
    if (ppmFantasma > 0) {
      const i = Math.min(renderizado, Math.floor((ms / 60000) * ppmFantasma * 5)), p = posDe(i);
      fantasma.hidden = false; fantasma.style.height = p.h + 'px'; fantasma.style.transform = `translate(${p.x}px,${p.y}px)`;
    }
  }

  /** Cierra la sesión en curso: la guarda (si tiene datos suficientes) y, si procede, muestra resultados. */
  function cerrarSesion(mostrar) {
    clearInterval(reloj); reloj = null;
    document.body.classList.remove('escribiendo');
    if (!sesion || sesion.guardada || sesion.inicio == null) return;
    sesion.guardada = true;
    const porTiempo = aj.medida === 'tiempo' && fuente.tipo !== 'errores';
    const completada = !sesion.fallida && (sesion.pos >= sesion.texto.length || (porTiempo && sesion.terminada));
    if (!sesion.terminada) sesion.terminar(performance.now());
    if (sesion.pulsaciones < 10) { if (mostrar) { aviso('Prueba demasiado corta: no se guardó.'); nuevaPrueba(); } return; }
    const r = Motor.resumen(sesion);
    const medida = fuente.tipo === 'errores' ? 'completo' : aj.medida;
    const previo = Math.max(0, ...Almacen.sesiones.filter((s) => s.completada && s.medida === medida && s.limite === (medida === 'completo' ? 0 : limite())).map((s) => s.ppm));
    const reg = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      fecha: new Date().toISOString(),
      fuente: fuente.tipo, medida, limite: medida === 'completo' ? 0 : limite(), modoError: aj.modoError,
      opciones: { sinAcentos: aj.sinAcentos, minusculas: aj.minusculas, sinPuntuacion: aj.sinPuntuacion },
      titulo: fuente.titulo, leccionId: fuente.leccion?.id || '', textoId: fuente.propio?.id || '',
      completada, fallida: sesion.fallida, ...r, teclas: sesion.teclas,
    };
    Almacen.guardarSesion(reg);
    // Progreso
    const pr = Almacen.progreso;
    const hechas = Math.max(0, sesion.texto.slice(0, sesion.pos).split(' ').length - (sesion.pos >= sesion.texto.length ? 0 : 1));
    let leccionTerminada = false;
    if (fuente.leccion && fuente.reanuda) {
      const id = fuente.leccion.id, pos = (pr.posLeccion = pr.posLeccion || {});
      if (fuente.reanuda.ini + hechas >= fuente.reanuda.total) {
        leccionTerminada = true; delete pos[id];
        const p = pr.lecciones[id] || { veces: 0, mejor: 0 };
        p.veces++; p.mejor = Math.max(p.mejor, r.ppm); pr.lecciones[id] = p;
        if (aj.leccionId) { const i = LECCIONES.findIndex((l) => l.id === aj.leccionId); aj.leccionId = LECCIONES[(i + 1) % LECCIONES.length].id; Almacen.guardarAjustes(); }
      } else pos[id] = fuente.reanuda.ini + hechas;
    }
    if (fuente.propio) pr.textos[fuente.propio.id] = { palabra: (fuente.propio.ini + hechas) % fuente.propio.total };
    Almacen.guardarProgreso();
    pintarCabecera();
    if (mostrar) mostrarResultados(reg, completada && previo > 0 && r.ppm > previo, leccionTerminada);
  }

  function mostrarResultados(s, record, leccionTerminada) {
    const ag = Analisis.agregar([s]);
    const fall = ag.teclas.filter((t) => t.err > 0 && t.k !== '⇧').sort((a, b) => b.err - a.err).slice(0, 12);
    const pals = ag.palabras.slice(0, 12).map((p) => p.k);
    const lec = s.fuente === 'lecciones' ? fuente.leccion : null;
    const estado = s.fallida ? '<span class="chapa mala">✕ Muerte súbita: fallaste una tecla</span>'
      : !s.completada ? '<span class="chapa">Prueba incompleta</span>'
      : record ? '<span class="chapa buena">★ Nuevo récord en este formato</span>' : '';
    const R = $('#resultados');
    R.innerHTML = `
      <div class="res-cab">
        <div class="heroe"><b>${Math.round(s.ppm)}</b><span>palabras por minuto</span>${estado}</div>
        <div class="fichas">
          <div><b>${s.precision}%</b><span>precisión</span></div>
          <div><b>${Math.round(s.bruto)}</b><span>ppm en bruto</span></div>
          <div><b>${s.consistencia}%</b><span>consistencia</span></div>
          <div><b>${duracion(s.duracionMs)}</b><span>tiempo</span></div>
          <div><b>${s.correctas}<small> / ${s.errores}</small></b><span>aciertos / errores</span></div>
        </div>
      </div>
      <div class="tarjeta">
        <h3>Velocidad durante la prueba</h3>
        <div id="res-graf"></div>
        <p class="leyenda"><i class="l-linea"></i> PPM acumuladas, segundo a segundo <span class="l-x">✕</span> segundo con algún error</p>
      </div>
      <div class="res-cols">
        <div class="tarjeta">
          <h3>Teclas que fallaste</h3>
          ${fall.length ? `<div class="chips">${fall.map((t) => `<span class="chip"><kbd>${esc(ver(t.k))}</kbd> ${t.err} de ${t.n}</span>`).join('')}</div>` : '<p class="tenue">Ninguna. Prueba limpia.</p>'}
          ${ag.confusiones.length ? `<p class="tenue">Confusiones: ${ag.confusiones.slice(0, 4).map((c) => `<kbd>${esc(ver(c.tec))}</kbd> en vez de <kbd>${esc(ver(c.esp))}</kbd>`).join(' · ')}</p>` : ''}
        </div>
        ${lec ? `<div class="tarjeta idea"><h3>Idea clave · ${esc(lec.titulo)}</h3><p>${esc(lec.clave)}</p>
          <p class="tenue">${leccionTerminada ? '✓ Lección completada.' : `Llevas ${Math.round((100 * (Almacen.progreso.posLeccion?.[lec.id] || 0)) / fuente.reanuda.total)} % de la lección. La próxima prueba continúa donde lo dejaste.`}</p></div>` : ''}
      </div>
      <div class="fila centro">
        <button class="btn primario" data-acc="siguiente">${lec ? (leccionTerminada ? 'Siguiente lección' : 'Continuar la lección') : 'Siguiente'} <kbd>Tab</kbd></button>
        <button class="btn" data-acc="repetir">Repetir este texto <kbd>Esc</kbd></button>
        ${pals.length ? '<button class="btn" data-acc="errores">Repasar las palabras falladas</button>' : ''}
        <a class="btn" href="#analisis">Ver mi análisis</a>
      </div>`;
    R.dataset.palabras = pals.join(' ');
    $('#prueba').hidden = true; R.hidden = false;
    Graficas.linea($('#res-graf'), {
      puntos: s.serie.map((p) => ({ x: p.s, y: p.ppm, marca: p.err > 0, etq: `segundo ${p.s}` + (p.err ? ` · ${p.err} error${p.err > 1 ? 'es' : ''}` : '') })),
      unidad: ' ppm', etqX: (p) => p.x + ' s', desdeCero: true, nombre: 'PPM por segundo',
    });
  }
  $('#p-titulo').addEventListener('click', (e) => {
    if (e.target.id !== 'desde-cero') return;
    cerrarSesion(false);
    delete Almacen.progreso.posLeccion[fuente.leccion.id]; Almacen.guardarProgreso(); nuevaPrueba();
  });
  $('#resultados').addEventListener('click', (e) => {
    const a = e.target.closest('[data-acc]')?.dataset.acc;
    if (a === 'siguiente') nuevaPrueba();
    else if (a === 'repetir') nuevaPrueba({ repetir: true });
    else if (a === 'errores') {
      const w = $('#resultados').dataset.palabras.split(' ');
      fuenteEspecial = barajar([...w, ...w, ...w]).join(' ');
      nuevaPrueba({ especial: true });
    }
  });

  // ── Entrada de teclado ──
  // El textarea oculto conserva un espacio centinela para que el retroceso genere eventos también en móvil.
  const CENT = ' ';
  ent.value = CENT;
  ent.addEventListener('input', (e) => {
    if (e.isComposing || e.inputType === 'insertCompositionText') return;   // tecla muerta en curso (´ + a → á)
    const tipo = e.inputType || '';
    if (tipo.startsWith('delete')) borrar();
    else if (tipo === 'insertText' && e.data) for (const ch of e.data) procesar(ch);
    ent.value = CENT;
  });
  ent.addEventListener('compositionend', (e) => { if (e.data) for (const ch of e.data) procesar(ch); ent.value = CENT; });
  ent.addEventListener('paste', (e) => e.preventDefault());
  ent.addEventListener('blur', () => { if (vistaActual === 'practicar' && !$('#prueba').hidden) $('#desenfoque').hidden = false; });
  ent.addEventListener('focus', () => { $('#desenfoque').hidden = true; });
  function enfocar() { ent.focus({ preventScroll: true }); ent.value = CENT; }
  zona.addEventListener('mousedown', (e) => { e.preventDefault(); enfocar(); });

  document.addEventListener('keydown', (e) => {
    if (vistaActual !== 'practicar') return;
    const enForm = e.target !== ent && /^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(e.target.tagName);
    if (e.key === 'Tab' && !enForm) { e.preventDefault(); nuevaPrueba(); }
    else if (e.key === 'Escape') { e.preventDefault(); nuevaPrueba({ repetir: true, especial: !!fuenteEspecial }); }
    else if (e.key === 'Enter' && !enForm && !$('#resultados').hidden) { e.preventDefault(); nuevaPrueba(); }
    else if (!enForm && e.target !== ent && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !$('#prueba').hidden) enfocar();
  });
  window.addEventListener('resize', () => { if (sesion && !sesion.terminada) actualizarCursor(true); });

  // ───────────────────────── Configuración de la prueba ─────────────────────────
  function pintarConfig() {
    const pastilla = (k, v, txt, act, tit = '') => `<button type="button" class="${act ? 'act' : ''}" data-k="${k}" data-v="${v}" title="${esc(tit)}" aria-pressed="${act}">${txt}</button>`;
    let extra = '';
    if (aj.fuente === 'lecciones') {
      extra = `<select data-k="leccionId" aria-label="Lección"><option value="">Siguiente pendiente</option>${LECCIONES.map((l) =>
        `<option value="${l.id}" ${l.id === aj.leccionId ? 'selected' : ''}>${Almacen.progreso.lecciones[l.id] ? '✓ ' : ''}${esc(l.titulo)}</option>`).join('')}</select>`;
    } else if (aj.fuente === 'propio') {
      extra = Almacen.textos.length
        ? `<select data-k="textoId" aria-label="Texto">${Almacen.textos.map((t) => `<option value="${t.id}" ${t.id === aj.textoId ? 'selected' : ''}>${esc(t.titulo)}</option>`).join('')}</select>`
        : '<a class="enlace" href="#textos">Añadir un texto →</a>';
    }
    const valores = aj.medida === 'tiempo' ? [15, 30, 60, 120] : aj.medida === 'palabras' ? [10, 25, 50, 100] : [];
    $('#config').innerHTML = `
      <div class="grupo"><div class="sg"><span class="etq">Texto</span><div class="pastillas">${FUENTES.map(([v, t]) => pastilla('fuente', v, t, aj.fuente === v)).join('')}</div></div>${extra}</div>
      <div class="grupo">
        <div class="sg"><span class="etq">Duración</span><div class="pastillas">${MEDIDAS.map(([v, t]) => pastilla('medida', v, t, aj.medida === v)).join('')}</div>
        ${valores.length ? `<div class="pastillas">${valores.map((v) => pastilla(aj.medida, v, v + (aj.medida === 'tiempo' ? ' s' : ''), aj[aj.medida] === v)).join('')}</div>` : ''}</div>
        <div class="sg"><span class="etq">Errores</span><div class="pastillas">${MODOS.map(([v, t, d]) => pastilla('modoError', v, t, aj.modoError === v, d)).join('')}</div></div>
        <div class="sg"><span class="etq">Incluir</span><div class="pastillas">
          ${pastilla('sinAcentos', !aj.sinAcentos, 'á acentos', !aj.sinAcentos, 'Quitar o conservar los acentos')}
          ${pastilla('minusculas', !aj.minusculas, 'Aa mayúsculas', !aj.minusculas, 'Quitar o conservar las mayúsculas')}
          ${pastilla('sinPuntuacion', !aj.sinPuntuacion, '¿? puntuación', !aj.sinPuntuacion, 'Quitar o conservar los signos')}
        </div></div>
      </div>`;
  }
  function cambiaConfig(k, v) {
    if (['sinAcentos', 'minusculas', 'sinPuntuacion'].includes(k)) aj[k] = !aj[k];
    else if (k === 'tiempo' || k === 'palabras') aj[k] = Number(v);
    else aj[k] = v;
    Almacen.guardarAjustes(); pintarConfig(); nuevaPrueba();
  }
  $('#config').addEventListener('click', (e) => { const b = e.target.closest('button[data-k]'); if (b) cambiaConfig(b.dataset.k, b.dataset.v); });
  $('#config').addEventListener('change', (e) => { const s = e.target.closest('select[data-k]'); if (s) cambiaConfig(s.dataset.k, s.value); });

  // ───────────────────────── Lecciones ─────────────────────────
  function pintarLecciones() {
    const pr = Almacen.progreso.lecciones, pos = Almacen.progreso.posLeccion || {}, cats = [...new Set(LECCIONES.map((l) => l.cat))];
    const ppm = media(Almacen.sesiones.filter((s) => s.completada).slice(-10).map((s) => s.ppm)) || 40;
    const info = (l) => { const n = l.texto.split(' ').length; return `${n} palabras · unos ${Math.max(1, Math.round(n / ppm))} min` + (pos[l.id] ? ` · vas en ${Math.round((100 * pos[l.id]) / n)} %` : ''); };
    const hechas = LECCIONES.filter((l) => pr[l.id]).length;
    $('#lecciones').innerHTML = `<p class="avance"><b>${hechas}</b> de ${LECCIONES.length} lecciones completadas · tiempos estimados a ${Math.round(ppm)} ppm</p><div class="barra fija"><i style="width:${(100 * hechas) / LECCIONES.length}%"></i></div>` +
      cats.map((c) => `<h2>${esc(c)}</h2><div class="rejilla">${LECCIONES.filter((l) => l.cat === c).map((l) => `
        <button class="leccion ${pr[l.id] ? 'hecha' : ''}" data-id="${l.id}">
          <span class="marca-l">${pr[l.id] ? '✓' : LECCIONES.indexOf(l) + 1}</span>
          <b>${esc(l.titulo)}</b>
          <span class="tenue">${info(l)}${pr[l.id] ? ` · mejor ${Math.round(pr[l.id].mejor)} ppm · ${pr[l.id].veces}×` : ''}</span>
        </button>`).join('')}</div>`).join('');
  }
  $('#lecciones').addEventListener('click', (e) => {
    const b = e.target.closest('.leccion'); if (!b) return;
    Object.assign(aj, { fuente: 'lecciones', medida: 'completo', leccionId: b.dataset.id });
    Almacen.guardarAjustes(); pintarConfig(); nuevaPrueba(); location.hash = '#practicar';
  });

  // ───────────────────────── Mis textos ─────────────────────────
  const cuenta = () => { const t = normalizar($('#t-texto').value); $('#t-cuenta').textContent = t ? `${t.split(' ').length} palabras · ${t.length} caracteres` : ''; };
  function pintarTextos() {
    const L = Almacen.textos;
    $('#lista-textos').innerHTML = L.length ? L.map((t) => {
      const n = normalizar(t.texto).split(' ').length, p = Almacen.progreso.textos[t.id]?.palabra || 0;
      const veces = Almacen.sesiones.filter((s) => s.textoId === t.id).length;
      return `<div class="tarjeta texto-item" data-id="${t.id}">
        <div><b>${esc(t.titulo)}</b><p class="tenue">${esc(normalizar(t.texto).slice(0, 160))}${t.texto.length > 160 ? '…' : ''}</p>
        <span class="tenue">${n} palabras · ${veces} práctica${veces === 1 ? '' : 's'}${p ? ` · vas en la palabra ${p + 1} (${Math.round((100 * p) / n)} %)` : ''}</span></div>
        <div class="fila"><button class="btn primario" data-acc="practicar">Practicar</button><button class="btn" data-acc="editar">Editar</button>
        ${p ? '<button class="btn" data-acc="reiniciar">Volver al inicio</button>' : ''}<button class="btn peligro" data-acc="borrar">Eliminar</button></div></div>`;
    }).join('') : '<p class="vacio">Aún no has añadido textos.</p>';
  }
  function limpiaForm() { $('#form-texto').reset(); $('#t-id').value = ''; $('#t-cancelar').hidden = true; cuenta(); }
  $('#t-texto').addEventListener('input', cuenta);
  $('#t-cancelar').addEventListener('click', limpiaForm);
  $('#t-archivo').addEventListener('change', async (e) => {
    const a = e.target.files[0]; if (!a) return;
    if (a.size > 2e6) return aviso('El archivo supera 2 MB. Usa un fragmento más corto.');
    $('#t-texto').value = await a.text();
    if (!$('#t-titulo').value) $('#t-titulo').value = a.name.replace(/\.[^.]+$/, '');
    cuenta(); e.target.value = '';
  });
  $('#form-texto').addEventListener('submit', (e) => {
    e.preventDefault();
    const titulo = $('#t-titulo').value.trim(), texto = $('#t-texto').value.trim(), id = $('#t-id').value;
    if (normalizar(texto).length < 20) return aviso('El texto es demasiado corto (mínimo 20 caracteres).');
    if (id) { const t = Almacen.textos.find((x) => x.id === id); Object.assign(t, { titulo, texto }); delete Almacen.progreso.textos[id]; Almacen.guardarProgreso(); }
    else Almacen.textos.unshift({ id: 't' + Date.now().toString(36), titulo, texto, creado: new Date().toISOString() });
    Almacen.guardarTextos(); limpiaForm(); pintarTextos(); pintarConfig(); aviso('Texto guardado.');
  });
  $('#lista-textos').addEventListener('click', (e) => {
    const b = e.target.closest('[data-acc]'); if (!b) return;
    const id = b.closest('[data-id]').dataset.id, t = Almacen.textos.find((x) => x.id === id);
    if (b.dataset.acc === 'practicar') {
      Object.assign(aj, { fuente: 'propio', textoId: id }); Almacen.guardarAjustes(); pintarConfig(); nuevaPrueba(); location.hash = '#practicar';
    } else if (b.dataset.acc === 'editar') {
      $('#t-id').value = id; $('#t-titulo').value = t.titulo; $('#t-texto').value = t.texto; $('#t-cancelar').hidden = false; cuenta();
      $('#form-texto').scrollIntoView({ behavior: 'smooth' });
    } else if (b.dataset.acc === 'reiniciar') {
      delete Almacen.progreso.textos[id]; Almacen.guardarProgreso(); pintarTextos();
    } else if (b.dataset.acc === 'borrar' && confirm(`¿Eliminar «${t.titulo}»? El historial de prácticas se conserva.`)) {
      Almacen.textos = Almacen.textos.filter((x) => x.id !== id); Almacen.guardarTextos(); pintarTextos(); pintarConfig();
    }
  });

  // ───────────────────────── Análisis ─────────────────────────
  const FILAS_TECLADO = ['1234567890', 'qwertyuiop', 'asdfghjklñ', 'zxcvbnm,.-'];
  function pintarAnalisis() {
    $('#rango').innerHTML = [['10', 'Últimas 10'], ['30', 'Últimas 30'], ['todas', 'Todas']].map(([v, t]) =>
      `<button type="button" class="${aj.rango === v ? 'act' : ''}" data-v="${v}">${t}</button>`).join('');
    const todas = Almacen.sesiones, A = $('#analisis');
    if (!todas.length) { A.innerHTML = '<div class="tarjeta vacio"><p>Todavía no hay datos. Completa tu primera prueba y vuelve aquí.</p><a class="btn primario" href="#practicar">Ir a practicar</a></div>'; return; }
    const ses = aj.rango === 'todas' ? todas : todas.slice(-Number(aj.rango));
    const ag = Analisis.agregar(ses), act = Analisis.actividad(todas);
    const pct = (x) => (x * 100).toFixed(x < 0.1 ? 1 : 0) + ' %';
    const barras = (lista, etq) => {
      if (!lista.length) return '<p class="tenue">Sin fallos suficientes para destacar nada. Sigue practicando.</p>';
      const max = Math.max(...lista.map((t) => t.tasa), 0.01);
      return `<div class="barras">${lista.map((t) => `<div class="fila-b" title="${t.err} fallos en ${t.n} intentos">
        <kbd>${esc(etq(t))}</kbd><div class="pista-b"><i style="width:${Math.max(2, (100 * t.tasa) / max)}%"></i></div>
        <span><b>${pct(t.tasa)}</b> ${t.ms ? `· ${Math.round(t.ms)} ms` : ''}</span></div>`).join('')}</div>`;
    };
    // Mapa de calor del teclado: las vocales acentuadas cuentan en su tecla base.
    const tec = new Map();
    for (const t of ag.teclas) { if (t.k === '⇧') continue; const b = Analisis.teclaBase(t.k); const o = tec.get(b) || { n: 0, err: 0, lat: 0, latN: 0 }; o.n += t.n; o.err += t.err; o.lat += t.lat; o.latN += t.latN; tec.set(b, o); }
    const valor = (o) => (!o || o.n < 3 ? null : aj.calor === 'errores' ? o.err / o.n : o.latN >= 3 ? o.lat / o.latN : null);
    const vals = [...tec.values()].map(valor).filter((v) => v != null);
    const vMin = aj.calor === 'errores' ? 0 : Math.min(...vals), vMax = Math.max(...vals, aj.calor === 'errores' ? 0.01 : vMin + 1);
    const tecla = (c, cls = '') => {
      const o = tec.get(c), v = valor(o), i = v == null ? 0 : (v - vMin) / (vMax - vMin || 1);
      const inf = o ? `${o.err} fallos en ${o.n} intentos (${pct(o.err / o.n)})${o.latN ? ` · ${Math.round(o.lat / o.latN)} ms de media` : ''}` : 'sin datos';
      return `<div class="tecla ${cls} ${v == null ? 'nd' : ''} ${i > 0.55 ? 'fuerte' : ''}" style="--i:${i.toFixed(2)}" data-inf="«${esc(ver(c))}»: ${inf}" tabindex="0">${c === ' ' ? 'espacio' : esc(c)}</div>`;
    };
    const comp = ses.filter((s) => s.completada), base = comp.length ? comp : ses;
    A.innerHTML = `
      <div class="fichas grandes">
        <div><b>${ses.length}</b><span>pruebas</span></div>
        <div><b>${duracion(ses.reduce((a, s) => a + s.duracionMs, 0))}</b><span>tiempo tecleando</span></div>
        <div><b>${Math.round(media(base.map((s) => s.ppm)))}</b><span>ppm de media</span></div>
        <div><b>${Math.round(Math.max(...base.map((s) => s.ppm)))}</b><span>mejor ppm</span></div>
        <div><b>${media(ses.map((s) => s.precision)).toFixed(1)}%</b><span>precisión media</span></div>
        <div><b>${act.racha}</b><span>día${act.racha === 1 ? '' : 's'} de racha</span></div>
      </div>
      <div class="tarjeta consejos"><h3>Qué trabajar ahora</h3><ul>${Analisis.consejos(ag, ses).map((c) => `<li>${esc(c)}</li>`).join('') || '<li>Todo en orden. Sigue así.</li>'}</ul>
        <button class="btn primario" id="ir-debiles">Practicar mis puntos débiles</button></div>
      <div class="cols">
        <div class="tarjeta"><h3>Teclas más débiles</h3><p class="tenue">Porcentaje de veces que fallas la tecla y tiempo medio en pulsarla.</p>${barras(ag.teclasDebiles.slice(0, 8), (t) => (t.k === '⇧' ? '⇧ mayús' : ver(t.k)))}</div>
        <div class="tarjeta"><h3>Combinaciones más débiles</h3><p class="tenue">Pares de letras seguidas en los que fallas la segunda.</p>${barras(ag.bigramasDebiles.slice(0, 8), (t) => t.k)}</div>
      </div>
      <div class="tarjeta">
        <div class="titulo-fila"><h3>Mapa del teclado</h3><div class="pastillas" id="calor">
          <button type="button" class="${aj.calor === 'errores' ? 'act' : ''}" data-v="errores">Fallos</button>
          <button type="button" class="${aj.calor === 'lentitud' ? 'act' : ''}" data-v="lentitud">Lentitud</button></div></div>
        <div class="teclado">${FILAS_TECLADO.map((f, i) => `<div class="fila-t f${i}">${[...f].map((c) => tecla(c)).join('')}</div>`).join('')}<div class="fila-t">${tecla(' ', 'espacio')}</div></div>
        <p class="leyenda"><span>${aj.calor === 'errores' ? 'menos fallos' : 'más rápida'}</span><i class="escala"></i><span>${aj.calor === 'errores' ? 'más fallos' : 'más lenta'}</span><span id="inf-tecla" class="tenue">Pasa el cursor sobre una tecla para ver el detalle.</span></p>
      </div>
      <div class="cols">
        <div class="tarjeta"><h3>Confusiones frecuentes</h3>${ag.confusiones.length ? `<table><tr><th>Tocaba</th><th>Escribiste</th><th class="num">Veces</th></tr>${ag.confusiones.slice(0, 8).map((c) =>
          `<tr><td><kbd>${esc(ver(c.esp))}</kbd></td><td><kbd>${esc(ver(c.tec))}</kbd></td><td class="num">${c.n}</td></tr>`).join('')}</table>` : '<p class="tenue">Sin confusiones repetidas.</p>'}</div>
        <div class="tarjeta"><h3>Palabras que más fallas</h3>${ag.palabras.length ? `<table><tr><th>Palabra</th><th class="num">Fallos</th><th class="num">Intentos</th></tr>${ag.palabras.slice(0, 8).map((p) =>
          `<tr><td>${esc(p.k)}</td><td class="num">${p.err}</td><td class="num">${p.n}</td></tr>`).join('')}</table>` : '<p class="tenue">Ninguna todavía.</p>'}</div>
        <div class="tarjeta"><h3>Por dedo</h3><table><tr><th>Dedo</th><th class="num">Error</th><th class="num">ms</th></tr>${['Meñique izq.', 'Anular izq.', 'Medio izq.', 'Índice izq.', 'Pulgar', 'Índice der.', 'Medio der.', 'Anular der.', 'Meñique der.']
          .map((n) => ag.dedos.find((d) => d.k === n)).filter(Boolean).map((d) => `<tr><td>${d.k}</td><td class="num">${pct(d.tasa)}</td><td class="num">${d.ms ? Math.round(d.ms) : '–'}</td></tr>`).join('')}</table></div>
      </div>
      <div class="cols">
        <div class="tarjeta"><h3>Velocidad por prueba (ppm)</h3><div id="g-ppm"></div></div>
        <div class="tarjeta"><h3>Precisión por prueba (%)</h3><div id="g-prec"></div></div>
      </div>
      <div class="tarjeta"><h3>Actividad · últimas 15 semanas</h3>${calendario(act)}</div>`;
    const pts = (campo) => ses.map((s, i) => ({ x: i + 1, y: Math.round(s[campo] * 10) / 10, etq: `${fechaCorta(s.fecha)} · ${NOMBRE_FUENTE[s.fuente] || s.fuente}` }));
    Graficas.linea($('#g-ppm'), { puntos: pts('ppm'), etqX: (p) => '#' + p.x, nombre: 'PPM por prueba' });
    Graficas.linea($('#g-prec'), { puntos: pts('precision'), unidad: '%', etqX: (p) => '#' + p.x, nombre: 'Precisión por prueba' });
  }
  function calendario(act) {
    const hoy = new Date(); hoy.setHours(12, 0, 0, 0);
    const ini = new Date(hoy); ini.setDate(ini.getDate() - ((ini.getDay() + 6) % 7) - 14 * 7);
    let h = '<div class="cal">';
    for (const d = new Date(ini); d <= hoy; d.setDate(d.getDate() + 1)) {
      const m = act.porDia.get(Analisis.diaLocal(d)) || 0, i = m ? Math.max(0.2, Math.min(1, m / aj.metaMin)) : 0;
      h += `<i style="--i:${i.toFixed(2)}" title="${d.toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' })}: ${m ? m.toFixed(1) + ' min' : 'sin práctica'}"></i>`;
    }
    return h + `</div><p class="leyenda"><span>Cada cuadro es un día (columnas = semanas, de lunes a domingo). Color pleno = meta diaria de ${aj.metaMin} min.</span></p>`;
  }
  $('#rango').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { aj.rango = b.dataset.v; Almacen.guardarAjustes(); pintarAnalisis(); } });
  $('#analisis').addEventListener('click', (e) => {
    const c = e.target.closest('#calor button');
    if (c) { aj.calor = c.dataset.v; Almacen.guardarAjustes(); pintarAnalisis(); }
    else if (e.target.id === 'ir-debiles') { aj.fuente = 'debiles'; Almacen.guardarAjustes(); pintarConfig(); nuevaPrueba(); location.hash = '#practicar'; }
  });
  const infTecla = (e) => { const t = e.target.closest?.('.tecla'); if (t) $('#inf-tecla').textContent = t.dataset.inf; };
  $('#analisis').addEventListener('pointerover', infTecla); $('#analisis').addEventListener('focusin', infTecla);

  // ───────────────────────── Historial y datos ─────────────────────────
  function pintarHistorial() {
    const L = [...Almacen.sesiones].reverse();
    $('#historial').innerHTML = L.length ? `<p class="tenue">${L.length} pruebas guardadas${L.length > 300 ? ' (se muestran las 300 más recientes)' : ''}.</p>
      <div class="tabla-scroll"><table><tr><th>Fecha</th><th>Texto</th><th>Formato</th><th>Errores</th><th class="num">PPM</th><th class="num">Precisión</th><th class="num">Consist.</th><th class="num">Tiempo</th><th></th></tr>
      ${L.slice(0, 300).map((s) => `<tr>
        <td>${new Date(s.fecha).toLocaleString('es', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
        <td class="corta" title="${esc(s.titulo)}">${esc(NOMBRE_FUENTE[s.fuente] || s.fuente)}${s.completada ? '' : ' <span class="tenue">(incompleta)</span>'}</td>
        <td>${s.medida === 'tiempo' ? s.limite + ' s' : s.medida === 'palabras' ? s.limite + ' palabras' : 'completo'}</td>
        <td>${{ estricto: 'estricto', libre: 'libre', subita: 'súbita' }[s.modoError]}</td>
        <td class="num"><b>${Math.round(s.ppm)}</b></td><td class="num">${s.precision}%</td><td class="num">${s.consistencia}%</td><td class="num">${duracion(s.duracionMs)}</td>
        <td><button class="mini" data-id="${s.id}" title="Eliminar esta prueba" aria-label="Eliminar esta prueba">✕</button></td></tr>`).join('')}</table></div>`
      : '<p class="vacio">Aún no hay pruebas guardadas.</p>';
  }
  function descargar(nombre, contenido, tipo) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([contenido], { type: tipo })); a.download = nombre;
    document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  const hoyTxt = () => Analisis.diaLocal(new Date());
  $('#x-json').addEventListener('click', () => descargar(`mecanografia-${hoyTxt()}.json`, Almacen.exportarJSON(), 'application/json'));
  $('#x-csv-s').addEventListener('click', () => descargar(`mecanografia-sesiones-${hoyTxt()}.csv`, Almacen.csvSesiones(), 'text/csv;charset=utf-8'));
  $('#x-csv-t').addEventListener('click', () => descargar(`mecanografia-pulsaciones-${hoyTxt()}.csv`, Almacen.csvTeclas(), 'text/csv;charset=utf-8'));
  $('#x-importar').addEventListener('change', async (e) => {
    const a = e.target.files[0]; if (!a) return;
    try { const n = Almacen.importarJSON(await a.text()); aviso(`Importadas ${n} pruebas nuevas.`); pintarHistorial(); pintarCabecera(); pintarConfig(); }
    catch (err) { aviso('No se pudo importar: ' + err.message); }
    e.target.value = '';
  });
  $('#x-borrar').addEventListener('click', () => {
    if (!Almacen.sesiones.length) return aviso('No hay nada que borrar.');
    if (confirm(`¿Borrar las ${Almacen.sesiones.length} pruebas guardadas? Esta acción no se puede deshacer. Exporta antes si quieres conservarlas.`)) { Almacen.borrarSesiones(); pintarHistorial(); pintarCabecera(); }
  });
  $('#historial').addEventListener('click', (e) => { const b = e.target.closest('.mini'); if (b) { Almacen.borrarSesion(b.dataset.id); pintarHistorial(); pintarCabecera(); } });

  // ───────────────────────── Ajustes ─────────────────────────
  function aplicarAjustes() {
    document.documentElement.dataset.tema = aj.tema;
    document.documentElement.style.setProperty('--tam', aj.tamano + 'px');
  }
  function pintarAjustes() {
    const sel = (k, ops) => `<select data-k="${k}">${ops.map(([v, t]) => `<option value="${v}" ${String(aj[k]) === String(v) ? 'selected' : ''}>${t}</option>`).join('')}</select>`;
    $('#ajustes').innerHTML = `
      <label class="ajuste"><span><b>Tema</b><small>Colores de la aplicación</small></span>${sel('tema', [['tinta', 'Tinta (oscuro)'], ['papel', 'Papel (claro)'], ['terminal', 'Terminal']])}</label>
      <label class="ajuste"><span><b>Tamaño del texto</b><small>Texto de la prueba</small></span>${sel('tamano', [[20, 'Pequeño'], [26, 'Mediano'], [32, 'Grande'], [38, 'Muy grande']])}</label>
      <label class="ajuste"><span><b>Cursor fantasma</b><small>Un segundo cursor que avanza a una velocidad objetivo para que lo persigas</small></span>${sel('fantasma', [['no', 'Desactivado'], ['promedio', 'Mi promedio (últimas 10)'], ['mejor', 'Mi mejor marca']])}</label>
      <label class="ajuste"><span><b>Sonido de teclas</b><small>Clic al acertar y tono grave al fallar</small></span>${sel('sonido', [[false, 'No'], [true, 'Sí']])}</label>
      <label class="ajuste"><span><b>Modo enfoque</b><small>Atenúa el menú y las opciones mientras escribes</small></span>${sel('enfoque', [[true, 'Sí'], [false, 'No']])}</label>
      <label class="ajuste"><span><b>Meta diaria</b><small>Minutos de práctica por día</small></span>${sel('metaMin', [[5, '5 min'], [10, '10 min'], [15, '15 min'], [20, '20 min'], [30, '30 min']])}</label>
      <p class="tenue">Tus datos (pruebas, pulsaciones, textos y ajustes) se guardan únicamente en este navegador. No se envía nada a ningún servidor. Haz copias desde <a class="enlace" href="#historial">Historial</a>.</p>`;
  }
  $('#ajustes').addEventListener('change', (e) => {
    const s = e.target.closest('select'); if (!s) return;
    const k = s.dataset.k, v = s.value;
    aj[k] = ['tamano', 'metaMin'].includes(k) ? Number(v) : ['sonido', 'enfoque'].includes(k) ? v === 'true' : v;
    Almacen.guardarAjustes(); aplicarAjustes(); pintarCabecera(); nuevaPrueba();
  });

  // ───────────────────────── Navegación y arranque ─────────────────────────
  let vistaActual = 'practicar', tAviso = null;
  function aviso(t) { const a = $('#aviso'); a.textContent = t; a.hidden = false; clearTimeout(tAviso); tAviso = setTimeout(() => { a.hidden = true; }, 3200); }
  function pintarCabecera() {
    const act = Analisis.actividad(Almacen.sesiones), p = Math.min(1, act.hoy / aj.metaMin);
    $('#cab-der').innerHTML = `<span title="Días seguidos practicando"><b>${act.racha}</b> día${act.racha === 1 ? '' : 's'} de racha</span>
      <span class="meta" title="Meta diaria"><i style="--p:${p}"></i><b>${Math.floor(act.hoy)}</b>/${aj.metaMin} min hoy</span>`;
  }
  const PINTA = { lecciones: pintarLecciones, textos: pintarTextos, analisis: pintarAnalisis, historial: pintarHistorial, ajustes: pintarAjustes };
  function navegar() {
    const v = (location.hash || '#practicar').slice(1), ok = v === 'practicar' || PINTA[v] ? v : 'practicar';
    if (vistaActual === 'practicar' && ok !== 'practicar' && sesion && !sesion.terminada && sesion.inicio != null) { cerrarSesion(false); nuevaPrueba(); }
    vistaActual = ok;
    $$('.vista').forEach((s) => { s.hidden = s.id !== 'v-' + ok; });
    $$('#nav a').forEach((a) => a.classList.toggle('act', a.getAttribute('href') === '#' + ok));
    if (PINTA[ok]) PINTA[ok]();
    if (ok === 'practicar') { pintarConfig(); actualizarCursor(true); enfocar(); } else { ent.blur(); $('#desenfoque').hidden = true; }
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', navegar);

  aplicarAjustes();
  Almacen.abrir().then(() => {
    pintarCabecera(); pintarConfig(); nuevaPrueba(); navegar();
    if (document.fonts?.ready) document.fonts.ready.then(() => actualizarCursor(true));
  });
})();
