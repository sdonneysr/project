/**
 * Arnes de pruebas: envuelve el contenido de pagina en un documento completo
 * y sustituye window.claude por un doble que captura publicaciones y descargas.
 *
 *   window.__published   ultimo HTML publicado por la pagina (o null)
 *   window.__saved       ultimo archivo entregado ({filename, bytes})
 *   window.__savedData   bytes de ese archivo, como arreglo
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { chromium } from 'playwright';

export const CHROMIUM = process.env.CHROMIUM_PATH || undefined;
const JSPDF = new URL('../node_modules/jspdf/dist/jspdf.umd.min.js', import.meta.url).href;

export const STUB = `
<script>
window.__published = null; window.__saved = null; window.__savedData = null;
window.__JSPDF_SRC__ = ${JSON.stringify(JSPDF)};
window.claude = { use: function (n) {
  return new Promise(function (res) { setTimeout(function () {
    if (n === 'artifact') res({ publish: function (html) {
      window.__published = html; return Promise.resolve({ version: 'test' }); } });
    else if (n === 'downloads') res({ save: function (r) {
      window.__saved = { filename: r.filename, bytes: r.data.byteLength || r.data.length };
      window.__savedData = r.data instanceof ArrayBuffer ? Array.from(new Uint8Array(r.data)) : null;
      return Promise.resolve({ status: 'saved' }); } });
    else res(null);
  }, 5); });
} };
<\/script>`;

export function envuelve(contenido) {
  return `${STUB}<!doctype html><html lang="es"><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<style>body{margin:0}</style></head><body>${contenido}</body></html>`;
}

const TMP = path.join(tmpdir(), 'control-portafolio');
let n = 0;
/** Escribe el documento en disco: Chromium no carga subrecursos file:// desde about:blank. */
async function aArchivo(html) {
  await mkdir(TMP, { recursive: true });
  const f = path.join(TMP, `v${process.pid}-${n++}.html`);
  await writeFile(f, html);
  return 'file://' + f;
}

/** Abre el tablero construido y devuelve {browser, page, errores, recargar}. */
export async function abrirTablero(archivo = 'dist/dashboard.html', viewport = { width: 1460, height: 1000 }) {
  const contenido = await readFile(archivo, 'utf8');
  const browser = await chromium.launch({ executablePath: CHROMIUM });
  const page = await browser.newPage({ viewport });
  const errores = [];
  page.on('pageerror', e => errores.push(`pageerror: ${e.message}`));
  page.on('console', m => {
    const t = m.text();
    // las fuentes de Google no cargan en entornos sin red: no es un fallo del tablero
    if (m.type() === 'error' && !/ERR_(TUNNEL|NAME|INTERNET|CONNECTION|BLOCKED)/.test(t)) errores.push(`console: ${t}`);
  });
  page.on('dialog', d => d.accept());
  await page.goto(await aArchivo(envuelve(contenido)), { waitUntil: 'load' });
  await page.waitForTimeout(400);

  /** Emula la recarga que hace la plataforma tras publicar. */
  async function recargar() {
    await page.waitForFunction('window.__published !== null', null, { timeout: 8000 });
    const html = await page.evaluate('window.__published');
    await page.goto(await aArchivo(STUB + html), { waitUntil: 'load' });
    await page.waitForTimeout(400);
  }
  return { browser, page, errores, recargar };
}

/** Abre el tablero como lo ve alguien sin permiso de escritura. */
export async function abrirSoloLectura(archivo = 'dist/dashboard.html') {
  const contenido = await readFile(archivo, 'utf8');
  const stub = '<script>window.claude={use:function(){return Promise.resolve(null)}}<\/script>';
  const browser = await chromium.launch({ executablePath: CHROMIUM });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  await page.goto(await aArchivo(stub + envuelve(contenido).replace(STUB, '')), { waitUntil: 'load' });
  await page.waitForTimeout(500);
  return { browser, page };
}

export const leerDB = (page) =>
  page.evaluate(() => JSON.parse(document.getElementById('db').textContent));
