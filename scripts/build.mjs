#!/usr/bin/env node
/**
 * Inyecta un archivo de datos en la plantilla y produce dos salidas:
 *
 *   dist/dashboard.html   contenido de pagina, para publicar con la herramienta Artifact
 *                         (sin doctype/html/head/body: el publicador los agrega)
 *   dist/standalone.html  documento completo, para abrir en el navegador o alojar aparte
 *
 * Uso:  node scripts/build.mjs [--data data/demo.json] [--out dist]
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const arg = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };

const SRC  = arg('--src', 'src/dashboard.html');
const OUT  = arg('--out', 'dist');
const DATA = arg('--data', null);
const TITULO = 'Control de Portafolio';
const FUENTES = 'https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700&family=Source+Sans+3:ital,wght@0,400;0,500;0,600;1,400&family=IBM+Plex+Mono:wght@400;500;600&display=swap';

const VACIO = { v: 4, proyectos: [], fases: [], tareas: [], entregables: [],
  recursos: [], asignaciones: [], costos: [], riesgos: [], alcance: [],
  interesados: [], comunicaciones: [], avances: [] };

const COLECCIONES = Object.keys(VACIO).filter(k => k !== 'v');

function normaliza(datos) {
  const db = { ...VACIO, ...datos };
  for (const k of COLECCIONES) if (!Array.isArray(db[k])) db[k] = [];
  const ids = new Set();
  for (const k of COLECCIONES) for (const fila of db[k]) {
    if (!fila.id) throw new Error(`Fila sin id en "${k}": ${JSON.stringify(fila).slice(0, 120)}`);
    if (ids.has(fila.id)) throw new Error(`Id repetido: ${fila.id}`);
    ids.add(fila.id);
  }
  return db;
}

const escapaJSON = (db) => JSON.stringify(db).replace(/</g, '\\u003c');

async function main() {
  const plantilla = await readFile(SRC, 'utf8');
  let datos = VACIO;
  if (DATA) {
    if (!existsSync(DATA)) throw new Error(`No existe el archivo de datos: ${DATA}`);
    datos = JSON.parse(await readFile(DATA, 'utf8'));
  }
  const db = normaliza(datos);

  const contenido = plantilla.replace(
    /<script type="application\/json" id="db">[\s\S]*?<\/script>/,
    `<script type="application/json" id="db">${escapaJSON(db)}</script>`
  );
  if (contenido === plantilla && DATA) throw new Error('No se encontro el bloque <script id="db"> en la plantilla.');

  const completo =
    '<!doctype html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
    `<title>${TITULO}</title>\n` +
    `<link rel="stylesheet" href="${FUENTES}">\n` +
    '<style>body{margin:0}</style>\n</head>\n<body>\n' +
    contenido + '\n</body>\n</html>\n';

  await mkdir(OUT, { recursive: true });
  await writeFile(path.join(OUT, 'dashboard.html'), contenido);
  await writeFile(path.join(OUT, 'standalone.html'), completo);

  const conteo = COLECCIONES.map(k => `${k}=${db[k].length}`).join(' ');
  console.log(`OK  ${DATA ?? 'base de datos vacia'}`);
  console.log(`    ${conteo}`);
  console.log(`    ${path.join(OUT, 'dashboard.html')}  ${(contenido.length / 1024).toFixed(1)} KB`);
  console.log(`    ${path.join(OUT, 'standalone.html')} ${(completo.length / 1024).toFixed(1)} KB`);
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
