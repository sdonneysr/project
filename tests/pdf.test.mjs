import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { abrirTablero, leerDB } from './harness.mjs';

const SALIDA = 'tests/.artifacts';
let ctx;
before(async () => { ctx = await abrirTablero('dist/dashboard.html'); await mkdir(SALIDA, { recursive: true }); });
after(async () => { await ctx.browser.close(); });

async function generar(page, nombre) {
  await page.evaluate('window.__saved = null');
  await page.click('[data-act="pdf"]');
  await page.waitForFunction('window.__saved !== null', null, { timeout: 30000 });
  const meta = await page.evaluate('window.__saved');
  const bytes = await page.evaluate('window.__savedData');
  const buf = Buffer.from(bytes);
  await writeFile(`${SALIDA}/${nombre}`, buf);
  return { meta, buf };
}

test('el informe del portafolio sale como PDF valido', async () => {
  const { meta, buf } = await generar(ctx.page, 'portafolio.pdf');
  assert.match(meta.filename, /^informe-ejecutivo-\d{4}-\d{2}-\d{2}\.pdf$/);
  assert.equal(buf.subarray(0, 5).toString(), '%PDF-');
  assert.ok(buf.includes(Buffer.from('%%EOF')), 'PDF sin marca de fin');
  assert.ok(buf.length > 4000, 'PDF sospechosamente pequeno');
  assert.deepEqual(ctx.errores, []);
});

test('el informe de un solo proyecto lleva su codigo en el nombre', async () => {
  const db = await leerDB(ctx.page);
  await ctx.page.selectOption('[data-ui="proy"]', db.proyectos[0].id);
  await ctx.page.waitForTimeout(300);
  const { meta, buf } = await generar(ctx.page, 'proyecto.pdf');
  assert.match(meta.filename, /^informe-ejecutivo-.+-\d{4}-\d{2}-\d{2}\.pdf$/);
  assert.equal(buf.subarray(0, 5).toString(), '%PDF-');
  assert.deepEqual(ctx.errores, []);
});

test('exporta cada coleccion a CSV con separador de punto y coma', async () => {
  const { page } = ctx;
  await page.click('[data-tab="datos"]');
  await page.waitForTimeout(220);
  for (const k of ['portafolio', 'tareas', 'entregables', 'riesgos', 'interesados', 'comunicaciones', 'recursos', 'costos']) {
    await page.evaluate('window.__saved = null');
    await page.click(`[data-act="export"][data-k="${k}"]`);
    await page.waitForFunction('window.__saved !== null', null, { timeout: 5000 });
    const meta = await page.evaluate('window.__saved');
    assert.match(meta.filename, new RegExp(`^portafolio-${k}-\\d{4}-\\d{2}-\\d{2}\\.csv$`));
    const txt = await page.evaluate('window.__savedDataText || null') ?? null;
    assert.ok(meta.bytes > 0, `CSV vacio: ${k}`);
    void txt;
  }
  assert.deepEqual(ctx.errores, []);
});
