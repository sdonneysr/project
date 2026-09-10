#!/usr/bin/env node
/** Genera data/demo.json ejecutando el sembrador de demostracion de la propia pagina. */
import { writeFile } from 'node:fs/promises';
import { abrirTablero, leerDB } from '../tests/harness.mjs';

const { browser, page, recargar, errores } = await abrirTablero('dist/dashboard.html');
await page.click('[data-act="ejemplo"]');
await recargar();
// el plan base de comunicaciones e interesados, para que la demo tenga todas las pestanas con datos
await page.click('[data-tab="datos"]');
await page.waitForTimeout(200);
await page.click('[data-act="plan-base"]');
await recargar();
const db = await leerDB(page);
await writeFile('data/demo.json', JSON.stringify(db, null, 1) + '\n');
console.log('data/demo.json:', Object.entries(db).filter(([, v]) => Array.isArray(v)).map(([k, v]) => `${k}=${v.length}`).join(' '));
if (errores.length) console.error('errores:', errores);
await browser.close();
