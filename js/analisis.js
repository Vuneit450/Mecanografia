/* Análisis de puntos débiles a partir del registro de pulsaciones de cada sesión. */
const Analisis = (() => {
  const DEDOS = {
    'Meñique izq.': '1qaz', 'Anular izq.': '2wsx', 'Medio izq.': '3edc', 'Índice izq.': '45rtfgvb',
    'Índice der.': '67yuhjnm', 'Medio der.': '8ik,;', 'Anular der.': '9ol.:', 'Meñique der.': "0pñ-_'?¿¡!´\"()", 'Pulgar': ' ',
  };
  const DEDO_DE = {};
  for (const [d, cs] of Object.entries(DEDOS)) for (const c of cs) DEDO_DE[c] = d;
  const SIN_ACENTO = { á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', ü: 'u' };
  /** Tecla física aproximada de un carácter (distribución español/latinoamericano). */
  const teclaBase = (c) => { c = c.toLowerCase(); return SIN_ACENTO[c] || c; };
  const dedoDe = (c) => DEDO_DE[teclaBase(c)] || 'Otros';
  const ver = (c) => (c === ' ' ? '␣' : c);

  const nuevo = () => ({ n: 0, err: 0, lat: 0, latN: 0 });
  const toma = (m, k) => { let v = m.get(k); if (!v) m.set(k, (v = nuevo())); return v; };
  const mediana = (a) => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };

  function agregar(sesiones) {
    const car = new Map(), big = new Map(), conf = new Map(), pal = new Map(), dedos = new Map();
    let pulsaciones = 0;
    for (const s of sesiones) {
      const reg = []; let cur = null, ultMs = 0;
      for (const [i, esp, tec, ms, ok] of s.teclas || []) {
        pulsaciones++;
        if (!cur || cur.i !== i) { cur = { i, esp, ms0: ms, antMs: ultMs, err: 0 }; reg.push(cur); }
        if (!ok) { cur.err++; const k = esp + '\u0000' + tec; conf.set(k, (conf.get(k) || 0) + 1); }
        ultMs = ms;
      }
      const txt = [], malo = new Set();
      reg.forEach((r, j) => {
        const ant = j > 0 && reg[j - 1].i === r.i - 1 ? reg[j - 1] : null;
        const lat = r.ms0 - r.antMs;
        const limpio = ant && !ant.err && !r.err && lat > 0 && lat < 2000;
        const apunta = (o) => { o.n++; if (r.err) o.err++; if (limpio) { o.lat += lat; o.latN++; } };
        apunta(toma(car, r.esp.toLowerCase()));
        if (r.esp !== r.esp.toLowerCase()) apunta(toma(car, '⇧'));
        apunta(toma(dedos, dedoDe(r.esp)));
        if (ant) apunta(toma(big, (ant.esp + r.esp).toLowerCase()));
        txt[r.i] = r.esp; if (r.err) malo.add(r.i);
      });
      // Palabras: se reconstruye el texto tecleado y se marca cada palabra con algún fallo.
      let w = '', mal = false;
      const cierra = () => {
        const p = w.toLowerCase().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
        if (p.length > 1) { const o = toma(pal, p); o.n++; if (mal) o.err++; }
        w = ''; mal = false;
      };
      for (let i = 0; i < txt.length; i++) {
        const c = txt[i];
        if (c === undefined || c === ' ') { cierra(); continue; }
        w += c; if (malo.has(i)) mal = true;
      }
      cierra();
    }
    const lista = (m) => [...m].map(([k, v]) => ({ k, ...v, tasa: v.n ? v.err / v.n : 0, ms: v.latN ? v.lat / v.latN : 0 }));
    const teclas = lista(car), bigramas = lista(big);
    const medMs = mediana(teclas.filter((t) => t.latN >= 5 && t.k !== ' ').map((t) => t.ms));
    const medBig = mediana(bigramas.filter((t) => t.latN >= 4).map((t) => t.ms));
    // Puntuación de debilidad: fallos (peso principal) + lentitud relativa a tu mediana.
    const punt = (t, med) => t.tasa * 100 + (med && t.ms ? Math.max(0, (t.ms - med) / med) * 30 : 0);
    teclas.forEach((t) => { t.debil = punt(t, medMs); });
    bigramas.forEach((t) => { t.debil = punt(t, medBig); });
    return {
      pulsaciones, medMs,
      teclas, bigramas,
      teclasDebiles: teclas.filter((t) => t.n >= 8 && t.debil >= 3).sort((a, b) => b.debil - a.debil),
      bigramasDebiles: bigramas.filter((t) => t.n >= 5 && t.debil >= 3 && !t.k.includes(' ')).sort((a, b) => b.debil - a.debil),
      confusiones: [...conf].map(([k, n]) => { const [esp, tec] = k.split('\u0000'); return { esp, tec, n }; })
        .filter((c) => c.n >= 2).sort((a, b) => b.n - a.n),
      palabras: lista(pal).filter((p) => p.err > 0).sort((a, b) => b.err - a.err || b.tasa - a.tasa),
      dedos: lista(dedos).filter((d) => d.k !== 'Otros'),
    };
  }

  /** Genera práctica dirigida: elige palabras que contienen tus teclas y bigramas más débiles. */
  function practicaDebil(ag, banco, n) {
    const pc = new Map(ag.teclasDebiles.slice(0, 8).map((t) => [t.k, t.debil]));
    const pb = new Map(ag.bigramasDebiles.slice(0, 10).map((t) => [t.k, t.debil]));
    const falladas = new Set(ag.palabras.slice(0, 25).map((p) => p.k));
    const hayDatos = pc.size + pb.size + falladas.size > 0;
    const pesos = banco.map((w) => {
      let p = 1;
      for (let i = 0; i < w.length; i++) {
        p += (pc.get(w[i]) || 0) / 4;
        if (i) p += (pb.get(w[i - 1] + w[i]) || 0) / 4;
      }
      if (falladas.has(w)) p += 25;
      return hayDatos ? p * p : 1;
    });
    const total = pesos.reduce((a, b) => a + b, 0);
    const out = [];
    while (out.length < n) {
      let r = Math.random() * total, i = 0;
      while (i < banco.length - 1 && (r -= pesos[i]) > 0) i++;
      if (banco[i] !== out[out.length - 1]) out.push(banco[i]);
    }
    return { palabras: out, hayDatos };
  }

  /** Recomendaciones en lenguaje claro. */
  function consejos(ag, sesiones) {
    const c = [];
    if (sesiones.length < 3) c.push('Completa al menos tres pruebas para que el análisis sea representativo.');
    if (!sesiones.length) return c;
    const ult = sesiones.slice(-10);
    const prec = ult.reduce((a, s) => a + s.precision, 0) / ult.length;
    const cons = ult.reduce((a, s) => a + s.consistencia, 0) / ult.length;
    if (prec < 92) c.push(`Tu precisión reciente es ${prec.toFixed(1)} %. Baja el ritmo hasta superar 96 %: la velocidad llega sola cuando dejas de corregir.`);
    else if (prec >= 97) c.push(`Precisión reciente de ${prec.toFixed(1)} %: tienes margen para empujar la velocidad. Activa el cursor fantasma con tu mejor marca.`);
    if (cons < 60) c.push(`Tu ritmo es irregular (consistencia ${cons.toFixed(0)} %). Intenta teclear a velocidad constante, como con metrónomo, en vez de acelerar y frenar.`);
    const t = ag.teclasDebiles[0];
    if (t && t.tasa >= 0.05) c.push(t.k === '⇧'
      ? `Las mayúsculas te cuestan: fallas ${(t.tasa * 100).toFixed(0)} % de ellas. Usa el Shift de la mano contraria a la letra.`
      : `Tu tecla más débil es «${ver(t.k)}» (${dedoDe(t.k).toLowerCase()}): la fallas ${(t.tasa * 100).toFixed(0)} % de las veces.`);
    const lenta = ag.teclas.filter((x) => x.latN >= 8 && x.k !== ' ' && x.k !== '⇧').sort((a, b) => b.ms - a.ms)[0];
    if (lenta && ag.medMs && lenta.ms > ag.medMs * 1.4) c.push(`«${lenta.k}» es tu tecla más lenta: ${Math.round(lenta.ms)} ms frente a tu mediana de ${Math.round(ag.medMs)} ms.`);
    const cf = ag.confusiones[0];
    if (cf && cf.n >= 3) c.push(`Confusión frecuente: pulsas «${ver(cf.tec)}» cuando toca «${ver(cf.esp)}» (${cf.n} veces). Revisa la posición de reposo de esa mano.`);
    const ac = ag.teclas.filter((x) => 'áéíóú'.includes(x.k)).reduce((a, x) => ({ n: a.n + x.n, err: a.err + x.err }), { n: 0, err: 0 });
    if (ac.n >= 15 && ac.err / ac.n > 0.12) c.push(`Los acentos te frenan: fallas ${(100 * ac.err / ac.n).toFixed(0)} % de las vocales acentuadas. Practica con la fuente «Palabras», que incluye muchas.`);
    const d = [...ag.dedos].filter((x) => x.n >= 30 && x.k !== 'Pulgar').sort((a, b) => b.tasa - a.tasa)[0];
    if (d && d.tasa > 0.08) c.push(`El dedo con más fallos es el ${d.k.toLowerCase()} (${(d.tasa * 100).toFixed(0)} % de error).`);
    if (ag.teclasDebiles.length) c.push('Usa la fuente «Puntos débiles»: genera práctica cargada con las teclas y combinaciones que más fallas.');
    return c;
  }

  /** Racha de días consecutivos y minutos practicados por día. */
  const diaLocal = (d) => { d = new Date(d); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  function actividad(sesiones) {
    const porDia = new Map();
    for (const s of sesiones) { const k = diaLocal(s.fecha); porDia.set(k, (porDia.get(k) || 0) + s.duracionMs / 60000); }
    let racha = 0; const d = new Date();
    if (!porDia.has(diaLocal(d))) d.setDate(d.getDate() - 1);
    while (porDia.has(diaLocal(d))) { racha++; d.setDate(d.getDate() - 1); }
    return { porDia, racha, hoy: porDia.get(diaLocal(new Date())) || 0 };
  }

  return { agregar, practicaDebil, consejos, actividad, teclaBase, ver, diaLocal };
})();
