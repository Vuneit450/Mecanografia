#!/usr/bin/env node
/* Comprueba los textos largos de las lecciones: longitud mínima y solo caracteres que se pueden teclear.
   Uso: node herramientas/validar-lecciones.js [archivo.js ...]   (sin argumentos revisa js/textos/*.js) */
const fs = require('fs'), path = require('path'), vm = require('vm');
const MIN = 620, MAX = 760;
const dir = path.join(__dirname, '..', 'js', 'textos');
const archivos = process.argv.length > 2 ? process.argv.slice(2) : fs.readdirSync(dir).filter((f) => f.endsWith('.js')).map((f) => path.join(dir, f));
const PERMITIDO = /^[a-zA-Z0-9áéíóúüñÁÉÍÓÚÜÑ .,;:¿?¡!()"%\/-]+$/;
let mal = 0;
for (const a of archivos) {
  const ctx = { window: {} }; vm.runInNewContext(fs.readFileSync(a, 'utf8'), ctx);
  for (const [id, parrafos] of Object.entries(ctx.window.TEXTOS_LECCION || {})) {
    const errores = [];
    if (!Array.isArray(parrafos) || parrafos.some((p) => typeof p !== 'string')) { console.log(`✕ ${id}: debe ser un arreglo de párrafos`); mal++; continue; }
    const t = parrafos.join(' '), n = t.split(/\s+/).length;
    if (n < MIN) errores.push(`solo ${n} palabras (mínimo ${MIN})`);
    if (n > MAX) errores.push(`${n} palabras (máximo ${MAX})`);
    const raros = [...new Set([...t].filter((c) => !PERMITIDO.test(c)))];
    if (raros.length) errores.push('caracteres no permitidos: ' + raros.map((c) => JSON.stringify(c)).join(' '));
    if (/\s\s|^\s|\s$/.test(t) || parrafos.some((p) => p !== p.trim())) errores.push('espacios dobles o sobrantes');
    if (parrafos.length < 5) errores.push('menos de 5 párrafos');
    console.log(errores.length ? `✕ ${id}: ${errores.join('; ')}` : `✓ ${id}: ${n} palabras, ${parrafos.length} párrafos`);
    if (errores.length) mal++;
  }
}
process.exit(mal ? 1 : 0);
