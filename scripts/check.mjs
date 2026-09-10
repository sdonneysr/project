#!/usr/bin/env node
/**
 * Revisiones que no requieren navegador:
 *   1. el script de la aplicacion es JavaScript valido
 *   2. la plantilla no contiene la etiqueta de cierre de script dentro del codigo
 *   3. la base de datos embebida es JSON valido y no tiene ids repetidos
 *   4. ningun color queda definido solo dentro de un bloque de tema
 *   5. no hay rastros de datos internos en la plantilla
 */
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';

const SRC = process.argv[2] || 'src/dashboard.html';
const s = await readFile(SRC, 'utf8');
let fallos = 0;
const ok = (m) => console.log('  ok    ' + m);
const mal = (m) => { console.error('  FALLA ' + m); fallos++; };

// 1 y 2
const i = s.indexOf('<script id="app">') + '<script id="app">'.length;
const j = s.lastIndexOf('</script>');
const js = s.slice(i, j);
if (js.includes('</script>')) mal('el codigo contiene </script> literal: rompe la publicacion');
else ok('sin </script> literal dentro del codigo');

const tmp = path.join(tmpdir(), 'cp-check-' + Date.now() + '.js');
await writeFile(tmp, js);
await new Promise((res) => execFile(process.execPath, ['--check', tmp], (e, _o, err) => {
  e ? mal('sintaxis del script: ' + String(err).split('\n')[0]) : ok('sintaxis del script valida'); res();
}));

// 3
const m = s.match(/<script type="application\/json" id="db">([\s\S]*?)<\/script>/);
if (!m) mal('no se encontro el bloque de datos');
else {
  try {
    const db = JSON.parse(m[1].replace(/\\u003c/g, '<'));
    const ids = new Set(); let dup = 0;
    for (const [, v] of Object.entries(db)) if (Array.isArray(v))
      for (const f of v) { if (ids.has(f.id)) dup++; ids.add(f.id); }
    dup ? mal(`${dup} id(s) repetidos en los datos`) : ok('datos embebidos validos, sin ids repetidos');
  } catch (e) { mal('datos embebidos no son JSON: ' + e.message); }
}

// 4
const css = (s.match(/<style id="css">([\s\S]*?)<\/style>/) || [, ''])[1];
const enBloques = new Set();
for (const b of css.matchAll(/@media \(prefers-color-scheme: dark\)\{([\s\S]*?)\n\}|:root\[data-theme="dark"\]\{([\s\S]*?)\n\}/g))
  for (const t of (b[1] || b[2] || '').matchAll(/(--[\w-]+):/g)) enBloques.add(t[1]);
const enRaiz = new Set();
const raiz = (css.match(/:root\{([\s\S]*?)\n\}/) || [, ''])[1];
for (const t of raiz.matchAll(/(--[\w-]+):/g)) enRaiz.add(t[1]);
const huerfanos = [...enBloques].filter(t => !enRaiz.has(t));
huerfanos.length ? mal('tokens definidos solo en el tema oscuro: ' + huerfanos.join(', '))
                 : ok('todos los tokens de color tienen definicion en :root');

// 5 — la lista de terminos vive fuera del control de versiones: nombrarlos aqui seria la fuga
const GENERICOS = [
  { re: /[\w.+-]+@[\w-]+\.[\w.]{2,}/, que: 'direccion de correo' },
  { re: /(drive|docs)\.google\.com\/[\w/-]{10,}/i, que: 'enlace a un documento interno' },
  { re: /https?:\/\/[^\s"'<>]*\.(gov|mil|local|internal)\b/i, que: 'enlace a un dominio interno' },
  { re: /\b(?:CECO|CC)\s?\d{2,}/i, que: 'centro de costo' },
];
const LISTA = 'data/private/deny-list.txt';
const propios = existsSync(LISTA)
  ? (await readFile(LISTA, 'utf8')).split('\n').map(l => l.trim())
      .filter(l => l && !l.startsWith('#'))
      .map(l => ({ re: new RegExp(l.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), que: 'termino de la lista privada' }))
  : [];
if (!existsSync(LISTA))
  console.log('  nota  sin ' + LISTA + ': solo se revisan patrones genericos (ver data/deny-list.example.txt)');

const hallazgos = [];
s.split('\n').forEach((l, n) => {
  for (const { re, que } of [...GENERICOS, ...propios]) if (re.test(l)) hallazgos.push(`linea ${n + 1}: ${que}`);
});
hallazgos.length ? mal('posibles datos internos en la plantilla -> ' + hallazgos.slice(0, 8).join('; '))
                 : ok('sin rastros de datos internos en la plantilla');

console.log(fallos ? `\n${fallos} revision(es) fallaron\n` : '\nTodas las revisiones pasaron\n');
process.exit(fallos ? 1 : 0);
