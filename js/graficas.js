/* Gráficas SVG sin dependencias. Una sola serie por gráfica y un solo eje. */
const Graficas = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const el = (n, at = {}, txt) => { const e = document.createElementNS(NS, n); for (const k in at) e.setAttribute(k, at[k]); if (txt != null) e.textContent = txt; return e; };

  function pasos(min, max, n = 4) {
    const r = max - min || 1, bruto = r / n, mag = 10 ** Math.floor(Math.log10(bruto));
    const paso = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((p) => p >= bruto);
    const ini = Math.floor(min / paso) * paso, out = [];
    for (let v = ini; v <= max + paso * 0.999; v += paso) out.push(Math.round(v * 100) / 100);
    return out;
  }

  /** Línea de una serie.
   *  o = { puntos:[{x,y,etq?,marca?}], unidad, etqX:(p)=>string, alto, desdeCero, nombre } */
  function linea(cont, o) {
    cont.innerHTML = '';
    cont.classList.add('grafica');
    const pts = o.puntos;
    if (!pts.length) { cont.innerHTML = '<p class="vacio">Aún no hay datos.</p>'; return; }
    const W = Math.max(280, cont.clientWidth || 600), H = o.alto || 190;
    const m = { i: 40, d: 18 + 7.5 * String(pts[pts.length - 1].y + (o.unidad || '')).length, a: 12, b: 24 };
    const ys = pts.map((p) => p.y);
    const tk = pasos(o.desdeCero ? 0 : Math.min(...ys), Math.max(...ys, o.desdeCero ? 1 : -Infinity));
    const y0 = tk[0], y1 = tk[tk.length - 1];
    const x0 = pts[0].x, x1 = pts[pts.length - 1].x;
    const X = (x) => m.i + (x1 === x0 ? 0.5 : (x - x0) / (x1 - x0)) * (W - m.i - m.d);
    const Y = (y) => m.a + (1 - (y - y0) / (y1 - y0 || 1)) * (H - m.a - m.b);
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'img', 'aria-label': o.nombre || 'Gráfica' });
    for (const t of tk) {
      svg.append(el('line', { x1: m.i, x2: W - m.d, y1: Y(t), y2: Y(t), class: 'g-rejilla' }));
      svg.append(el('text', { x: m.i - 8, y: Y(t) + 4, 'text-anchor': 'end', class: 'g-eje' }, t));
    }
    const nEtq = Math.min(pts.length, Math.max(2, Math.floor((W - m.i - m.d) / 90)));
    for (let j = 0; j < nEtq; j++) {
      const p = pts[Math.round((j * (pts.length - 1)) / Math.max(1, nEtq - 1))];
      svg.append(el('text', { x: X(p.x), y: H - 6, 'text-anchor': 'middle', class: 'g-eje' }, o.etqX ? o.etqX(p) : p.x));
    }
    for (const p of pts) if (p.marca) svg.append(el('path', { d: `M${X(p.x) - 3} ${H - m.b - 7}l6 6m0 -6l-6 6`, class: 'g-marca' }));
    svg.append(el('path', { d: pts.map((p, i) => (i ? 'L' : 'M') + X(p.x).toFixed(1) + ' ' + Y(p.y).toFixed(1)).join(''), class: 'g-linea' }));
    if (pts.length <= 40) for (const p of pts) svg.append(el('circle', { cx: X(p.x), cy: Y(p.y), r: 3, class: 'g-punto' }));
    const ult = pts[pts.length - 1];
    svg.append(el('text', { x: X(ult.x) + 8, y: Y(ult.y) + 4, class: 'g-valor' }, ult.y + (o.unidad || '')));
    // Capa de interacción: línea guía + punto + etiqueta flotante.
    const guia = el('line', { y1: m.a, y2: H - m.b, class: 'g-guia', visibility: 'hidden' });
    const foco = el('circle', { r: 5, class: 'g-foco', visibility: 'hidden' });
    svg.append(guia, foco);
    const tip = document.createElement('div'); tip.className = 'g-tip'; tip.hidden = true;
    const mover = (ev) => {
      const r = svg.getBoundingClientRect(), px = ((ev.clientX - r.left) / r.width) * W;
      let mejor = pts[0];
      for (const p of pts) if (Math.abs(X(p.x) - px) < Math.abs(X(mejor.x) - px)) mejor = p;
      guia.setAttribute('x1', X(mejor.x)); guia.setAttribute('x2', X(mejor.x));
      foco.setAttribute('cx', X(mejor.x)); foco.setAttribute('cy', Y(mejor.y));
      guia.setAttribute('visibility', 'visible'); foco.setAttribute('visibility', 'visible');
      tip.hidden = false;
      tip.innerHTML = `<b>${mejor.y}${o.unidad || ''}</b><span>${mejor.etq || (o.etqX ? o.etqX(mejor) : mejor.x)}</span>`;
      const izq = (X(mejor.x) / W) * r.width;
      tip.style.left = Math.min(r.width - 150, Math.max(0, izq + (izq > r.width - 170 ? -150 : 12))) + 'px';
      tip.style.top = Math.max(0, (Y(mejor.y) / H) * r.height - 44) + 'px';
    };
    const salir = () => { tip.hidden = true; guia.setAttribute('visibility', 'hidden'); foco.setAttribute('visibility', 'hidden'); };
    svg.addEventListener('pointermove', mover); svg.addEventListener('pointerdown', mover); svg.addEventListener('pointerleave', salir);
    cont.append(svg, tip);
  }

  return { linea };
})();
