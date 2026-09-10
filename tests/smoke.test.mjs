import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { abrirTablero, abrirSoloLectura, leerDB } from './harness.mjs';

let ctx;
before(async () => { ctx = await abrirTablero('dist/dashboard.html'); });
after(async () => { await ctx.browser.close(); });

const PESTANAS = ['resumen', 'cronograma', 'entregables', 'tareas', 'riesgos',
  'comunicaciones', 'recursos', 'ficha', 'datos'];

test('carga sin errores de consola', async () => {
  assert.deepEqual(ctx.errores, []);
  assert.equal(await ctx.page.locator('.brand h1').textContent(), 'Control de Portafolio');
});

test('las nueve pestanas navegan y pintan contenido', async () => {
  for (const t of PESTANAS) {
    await ctx.page.click(`[data-tab="${t}"]`);
    await ctx.page.waitForTimeout(180);
    assert.ok(await ctx.page.locator('main .card, main section').count() > 0, `pestana vacia: ${t}`);
  }
  assert.deepEqual(ctx.errores, []);
});

test('el cuerpo nunca desborda en horizontal', async () => {
  for (const ancho of [1460, 900, 420]) {
    await ctx.page.setViewportSize({ width: ancho, height: 900 });
    for (const t of PESTANAS) {
      await ctx.page.click(`[data-tab="${t}"]`);
      await ctx.page.waitForTimeout(120);
      const desborda = await ctx.page.evaluate(() =>
        document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
      assert.equal(desborda, false, `desborda a ${ancho}px en ${t}`);
    }
  }
  await ctx.page.setViewportSize({ width: 1460, height: 1000 });
});

test('el Gantt dibuja barras, hitos, dependencias y la linea de hoy', async () => {
  await ctx.page.click('[data-tab="cronograma"]');
  await ctx.page.waitForTimeout(250);
  const g = await ctx.page.evaluate(() => ({
    barras: document.querySelectorAll('.g-bar').length,
    hitos: document.querySelectorAll('.g-ms').length,
    deps: document.querySelectorAll('.g-dep path').length,
    hoy: !!document.querySelector('.g-today'),
    izq: document.querySelectorAll('.g-left .g-row').length,
    der: document.querySelectorAll('.g-right .g-row').length,
  }));
  assert.ok(g.barras > 0, 'sin barras');
  assert.ok(g.hitos > 0, 'sin hitos');
  assert.ok(g.deps > 0, 'sin flechas de dependencia');
  assert.ok(g.hoy, 'sin linea de hoy');
  assert.equal(g.izq, g.der, 'las filas del panel izquierdo y del grafico no coinciden');
});

test('el avance del entregable se valida contra el promedio de sus tareas', async () => {
  const { page, recargar } = ctx;
  await page.click('[data-tab="entregables"]');
  await page.waitForTimeout(220);
  assert.match(await page.locator('.banner').first().innerText(), /Avance validado/);

  // se mueve una tarea y el desajuste debe aparecer
  const db = await leerDB(page);
  const ent = db.entregables.find(e => e.faseId);
  const tarea = db.tareas.find(t => t.faseId === ent.faseId);
  await page.click('[data-tab="tareas"]');
  await page.waitForTimeout(180);
  await page.click(`[data-act="edit-tarea"][data-id="${tarea.id}"]`);
  await page.waitForTimeout(180);
  await page.fill('#f_avance', String(tarea.avance === 100 ? 0 : 100));
  await page.click('[data-f="ok"]');
  await recargar();

  await page.click('[data-tab="entregables"]');
  await page.waitForTimeout(220);
  assert.match(await page.locator('.banner').first().innerText(), /desajustado/);

  await page.click('[data-act="ajustar-avances"]');
  await recargar();
  await page.click('[data-tab="entregables"]');
  await page.waitForTimeout(220);
  assert.match(await page.locator('.banner').first().innerText(), /Avance validado/);

  const db2 = await leerDB(page);
  const e2 = db2.entregables.find(e => e.id === ent.id);
  const ts = db2.tareas.filter(t => t.faseId === e2.faseId);
  const prom = Math.round(ts.reduce((a, t) => a + t.avance, 0) / ts.length);
  assert.equal(e2.avance, prom);
});

test('la evidencia se normaliza y solo enlaza http(s)', async () => {
  const { page, recargar } = ctx;
  await page.click('[data-tab="entregables"]');
  await page.waitForTimeout(200);
  const db = await leerDB(page);
  const id = db.entregables[0].id;

  await page.click(`[data-act="edit-entregable"][data-id="${id}"]`);
  await page.waitForTimeout(180);
  await page.fill('#f_evidencia', 'javascript:alert(1)');
  await page.click('[data-f="ok"]');
  await page.waitForTimeout(150);
  assert.match(await page.locator('#f_err').textContent(), /no es válido/);

  await page.fill('#f_evidencia', 'ejemplo.test/carpeta/entregable');
  await page.click('[data-f="ok"]');
  await recargar();
  const db2 = await leerDB(page);
  assert.equal(db2.entregables.find(e => e.id === id).evidencia, 'https://ejemplo.test/carpeta/entregable');

  await page.click('[data-tab="entregables"]');
  await page.waitForTimeout(200);
  const a = page.locator('td a.ev').first();
  assert.equal(await a.getAttribute('rel'), 'noopener noreferrer');
  assert.equal(await a.getAttribute('target'), '_blank');
});

test('la sobreasignacion de una persona se marca en rojo', async () => {
  const { page } = ctx;
  await page.click('[data-tab="recursos"]');
  await page.waitForTimeout(220);
  const totales = await page.evaluate(() => Array.from(document.querySelectorAll('.matrix td.tot'))
    .map(td => ({ txt: td.textContent, over: td.classList.contains('over') })));
  assert.ok(totales.length > 0, 'sin matriz de asignacion');
  for (const t of totales) assert.equal(t.over, parseInt(t.txt, 10) > 100, `mal marcado: ${t.txt}`);
});

test('el modo de solo lectura oculta los botones de edicion', async () => {
  const { browser, page } = await abrirSoloLectura('dist/dashboard.html');
  try {
    assert.match(await page.locator('.banner.ro').innerText(), /modo consulta|solo lectura/i);
    assert.equal(await page.locator('[data-act="edit-proyecto"]').count(), 0);
    assert.equal(await page.locator('[data-act="nuevo-proyecto"]').count(), 0);
    // lo que si debe seguir disponible para quien consulta
    assert.ok(await page.locator('[data-act="pdf"]').count() > 0, 'sin boton de PDF');
    assert.ok(await page.locator('[data-ui="proy"]').count() > 0, 'sin filtro de proyecto');
  } finally { await browser.close(); }
});
