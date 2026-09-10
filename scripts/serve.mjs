#!/usr/bin/env node
/**
 * Servidor de desarrollo: abre el tablero en el navegador con un doble de la
 * plataforma, de modo que guardar y descargar funcionen fuera de claude.ai.
 *
 *   guardar    la pagina publica su nuevo HTML -> data/local.html
 *   descargar  el archivo se escribe en downloads/
 *   PDF        jsPDF se sirve desde node_modules, sin salir a internet
 *
 * Uso:  npm run serve  [--puerto 4173] [--data data/demo.json]
 */
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import path from 'node:path';

const args = process.argv.slice(2);
const arg = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const PUERTO = Number(arg('--puerto', process.env.PORT || 4173));
const DATA = arg('--data', null);
const LOCAL = 'data/local.html';

const STUB = `
<script>
window.__JSPDF_SRC__ = '/vendor/jspdf.umd.min.js';
window.claude = { use: async function (n) {
  if (n === 'artifact') return { publish: async function (html) {
    const r = await fetch('/__save', { method: 'POST', headers: { 'content-type': 'text/html' }, body: html });
    if (!r.ok) throw { code: 'upstream_error', message: 'el servidor de desarrollo no pudo guardar' };
    location.reload();               // la plataforma real recarga las vistas abiertas
    return { version: String(Date.now()) };
  } };
  if (n === 'downloads') return { save: async function (req) {
    const r = await fetch('/__download', { method: 'POST',
      headers: { 'x-filename': encodeURIComponent(req.filename) }, body: req.data });
    if (!r.ok) throw { code: 'unavailable', message: 'no se pudo escribir el archivo' };
    console.log('[dev] archivo escrito en downloads/' + req.filename);
    return { status: 'saved' };
  } };
  return null;
} };
<\/script>`;

async function construir() {
  await new Promise((res, rej) => execFile(process.execPath,
    ['scripts/build.mjs', ...(DATA ? ['--data', DATA] : [])],
    (e, out) => e ? rej(e) : (process.stdout.write(out), res()))); 
}

const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json' };

const servidor = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');

    if (req.method === 'POST' && url.pathname === '/__save') {
      const trozos = []; for await (const c of req) trozos.push(c);
      await mkdir('data', { recursive: true });
      await writeFile(LOCAL, Buffer.concat(trozos));
      res.writeHead(204).end(); return;
    }
    if (req.method === 'POST' && url.pathname === '/__download') {
      const trozos = []; for await (const c of req) trozos.push(c);
      const nombre = path.basename(decodeURIComponent(req.headers['x-filename'] || 'archivo.bin'));
      await mkdir('downloads', { recursive: true });
      await writeFile(path.join('downloads', nombre), Buffer.concat(trozos));
      res.writeHead(204).end(); return;
    }
    if (url.pathname === '/vendor/jspdf.umd.min.js') {
      const f = 'node_modules/jspdf/dist/jspdf.umd.min.js';
      if (!existsSync(f)) { res.writeHead(404).end('falta jspdf: corre npm install'); return; }
      res.writeHead(200, { 'content-type': TIPOS['.js'] }).end(await readFile(f)); return;
    }
    if (url.pathname === '/' || url.pathname === '/index.html') {
      // si ya hubo un guardado local, esa version manda: es el estado vivo
      const fuente = existsSync(LOCAL) ? LOCAL : 'dist/standalone.html';
      const html = await readFile(fuente, 'utf8');
      res.writeHead(200, { 'content-type': TIPOS['.html'], 'cache-control': 'no-store' });
      res.end(STUB + html); return;
    }
    if (url.pathname === '/__reset') {
      if (existsSync(LOCAL)) await writeFile(LOCAL, await readFile('dist/standalone.html'));
      res.writeHead(200, { 'content-type': 'text/plain' }).end('estado local reiniciado; recarga la pagina');
      return;
    }
    res.writeHead(404).end('no encontrado');
  } catch (e) {
    res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' }).end('Error: ' + e.message);
  }
});

await construir();
servidor.listen(PUERTO, () => {
  console.log(`\n  Tablero en  http://localhost:${PUERTO}`);
  console.log(`  Estado      ${existsSync(LOCAL) ? LOCAL + ' (guardado local)' : 'dist/standalone.html'}`);
  console.log(`  Reiniciar   http://localhost:${PUERTO}/__reset\n`);
});
