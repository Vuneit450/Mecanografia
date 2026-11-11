/* Motor de mecanografía: lógica pura, sin DOM (se puede probar con Node).
   Estados por carácter: 0 pendiente · 1 correcto · 2 corregido (hubo fallo antes) · 3 incorrecto (modo libre). */
const Motor = (() => {
  class Sesion {
    /** @param {string} texto  @param {'estricto'|'libre'|'subita'} modo */
    constructor(texto, modo) {
      this.texto = texto; this.modo = modo;
      this.pos = 0; this.estado = []; this.fallos = {};
      this.teclas = [];               // [posición, esperado, tecleado, ms desde el inicio, 1|0]
      this.inicio = null; this.fin = null;
      this.pulsaciones = 0; this.aciertos = 0; this.correctas = 0;
      this.terminada = false; this.fallida = false;
    }
    extender(t) { this.texto += t; }
    ms(ahora) { return this.inicio == null ? 0 : (this.fin ?? ahora) - this.inicio; }
    terminar(ahora) { if (!this.terminada) { this.terminada = true; this.fin = ahora; } }

    /** Procesa un carácter. Devuelve 'ok' | 'error' | 'fin' | 'fallo' | null. */
    teclear(ch, ahora) {
      if (this.terminada || this.pos >= this.texto.length) return null;
      if (this.inicio == null) this.inicio = ahora;
      if (ch === ' ') ch = ' ';
      const esp = this.texto[this.pos], ok = ch === esp;
      this.teclas.push([this.pos, esp, ch, Math.round(ahora - this.inicio), ok ? 1 : 0]);
      this.pulsaciones++;
      if (ok) {
        this.aciertos++; this.correctas++;
        this.estado[this.pos] = this.fallos[this.pos] ? 2 : 1;
        this.pos++;
      } else {
        this.fallos[this.pos] = (this.fallos[this.pos] || 0) + 1;
        if (this.modo === 'subita') { this.fallida = true; this.terminar(ahora); return 'fallo'; }
        if (this.modo === 'libre') { this.estado[this.pos] = 3; this.pos++; }
        // estricto: el cursor no avanza hasta acertar
      }
      if (this.pos >= this.texto.length) { this.terminar(ahora); return 'fin'; }
      return ok ? 'ok' : 'error';
    }
    /** Retroceso: solo tiene efecto en modo libre. */
    borrar() {
      if (this.modo !== 'libre' || this.terminada || this.pos === 0) return false;
      this.pos--;
      if (this.estado[this.pos] === 1 || this.estado[this.pos] === 2) this.correctas--;
      this.estado[this.pos] = 0;
      return true;
    }
    ppm(ahora) { const m = this.ms(ahora) / 60000; return m > 0 ? this.correctas / 5 / m : 0; }
    precision() { return this.pulsaciones ? (this.aciertos / this.pulsaciones) * 100 : 100; }
  }

  /** Métricas finales de una sesión terminada. */
  function resumen(s, duracionMs) {
    const ms = Math.max(1, duracionMs ?? s.ms(s.fin));
    const min = ms / 60000;
    const seg = Math.max(1, Math.ceil(ms / 1000));
    const todas = Array(seg).fill(0), ok = Array(seg).fill(0), err = Array(seg).fill(0);
    for (const k of s.teclas) {
      const b = Math.min(seg - 1, Math.floor(k[3] / 1000));
      todas[b]++; k[4] ? ok[b]++ : err[b]++;
    }
    const serie = []; let acum = 0;
    for (let i = 0; i < seg; i++) {
      acum += ok[i];
      const t = i === seg - 1 ? ms / 1000 : i + 1;
      serie.push({ s: i + 1, ppm: Math.round(acum / 5 / (t / 60)), bruto: todas[i] * 12, err: err[i] });
    }
    // Consistencia: 100 − coeficiente de variación del ritmo por segundo (suavizado).
    const completos = ms % 1000 < 500 && seg > 1 ? todas.slice(0, -1) : todas;
    const suave = completos.map((_, i) => { const v = completos.slice(Math.max(0, i - 1), i + 2); return v.reduce((a, b) => a + b, 0) / v.length; });
    const media = suave.reduce((a, b) => a + b, 0) / suave.length;
    const sd = Math.sqrt(suave.reduce((a, b) => a + (b - media) ** 2, 0) / suave.length);
    const consistencia = media > 0 ? Math.round(100 * (1 - Math.min(1, sd / media))) : 0;
    return {
      duracionMs: Math.round(ms),
      ppm: Math.round((s.correctas / 5 / min) * 10) / 10,
      bruto: Math.round((s.pulsaciones / 5 / min) * 10) / 10,
      precision: Math.round(s.precision() * 10) / 10,
      consistencia, serie,
      caracteres: s.pos, correctas: s.correctas, errores: s.pulsaciones - s.aciertos,
    };
  }

  return { Sesion, resumen };
})();
if (typeof module !== 'undefined') module.exports = Motor;
