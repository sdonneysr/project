# Control de Portafolio

Tablero de gerencia de proyectos en **un solo archivo HTML**, sin backend y sin build obligatorio.
Se publica como Artifact de Claude y **guarda sus propios datos**: quien tiene permiso de escritura
edita desde formularios en la página, y quien no, entra en modo consulta.

Nació de una necesidad concreta: tener cronograma, entregables, tareas, recursos, riesgos y
comunicaciones en una sola vista, en vez de repartidos entre un Excel, un Word y una carpeta de Drive.

## Qué trae

| Pestaña | Para qué |
|---|---|
| **Resumen ejecutivo** | KPIs, portafolio con semáforo, qué se entrega esta semana y este mes, riesgos priorizados. Es la vista que se imprime. |
| **Cronograma** | Gantt propio en SVG: fases, tareas con relleno de avance, hitos en rombo, flechas de dependencia, línea de hoy y escalas día / semana / mes. |
| **Entregables** | Descripción, fase que lo produce, avance validado contra sus tareas, estado, fecha comprometida y enlace de evidencia. |
| **Tareas** | Fase, responsable, fechas, duración, avance, estado y predecesoras, con alerta de traslape. |
| **Riesgos** | Probabilidad × impacto → nivel calculado, plan de contingencia, responsable y estado. |
| **Bitácora** | Cada cambio de porcentaje en una tarea queda registrado con la fecha capturada automáticamente y una nota, agrupado semana a semana. |
| **Comunicaciones** | Matriz de comunicaciones que **calcula la próxima ocurrencia**, mapa de interesados poder × interés, registro de interesados y matriz de evaluación del involucramiento. |
| **Recursos y costos** | Matriz persona × proyecto con alerta de sobreasignación, presupuesto vs. ejecutado y detalle de costos. |
| **Ficha del proyecto** | Objetivo, nota de avance y alcance por dimensión, con lo que queda fuera resaltado. |
| **Datos** | Altas y bajas, exportación CSV de las ocho colecciones, carga del portafolio de demostración y vaciado. |

Además: informe ejecutivo en **PDF real** (texto seleccionable, no una captura), exportación **CSV** de nueve colecciones,
compatible con Excel en español, y tema claro y oscuro según la preferencia de quien lo abre.

## Cómo se ejecuta

```bash
npm install          # playwright y jspdf, solo para desarrollo y pruebas
npm run build        # dist/dashboard.html (para publicar) y dist/standalone.html
npm run build:demo   # lo mismo, con el portafolio de demostración dentro
npm run serve        # http://localhost:4173 con guardado y descargas simuladas
npm run check        # revisiones estáticas, sin navegador
npm test             # 14 pruebas de extremo a extremo con Playwright
```

`npm run serve` levanta un doble de la plataforma: al guardar, la página se escribe en
`data/local.html` y esa versión pasa a ser el estado vivo; las descargas caen en `downloads/`.
Es la forma de usar el tablero fuera de claude.ai. `/__reset` vuelve al estado del último build.

## Cómo se publica

El archivo `dist/dashboard.html` es **contenido de página**: no lleva `<!doctype>`, `<html>`,
`<head>` ni `<body>`, porque el publicador de Artifacts los agrega. Se publica declarando
dos capacidades:

```json
{ "artifact": {}, "downloads": true }
```

- `artifact` es lo que permite que la página se guarde a sí misma publicando una versión nueva.
- `downloads` es lo que permite entregar el PDF y los CSV.

`dist/standalone.html` es el documento completo, para abrir con doble clic o alojar en cualquier
servidor estático. Ahí no hay guardado: sin la plataforma, `claude.use()` devuelve `null` y el
tablero se rinde en modo consulta, que es el comportamiento correcto.

## Cómo guarda

No hay base de datos. El estado vive como JSON dentro del propio documento:

```html
<script type="application/json" id="db">{"v":3,"proyectos":[…],…}</script>
```

Cuando alguien guarda, la página **regenera el documento completo** desde su propio `<style>` y
`<script>` y lo publica como versión nueva; todas las vistas abiertas recargan a esa versión.
Nunca se serializa el DOM vivo, porque arrastraría estado de sesión.

Consecuencias que conviene tener presentes:

- Un `conflict` al publicar es normal, no un error: alguien más guardó primero y la plataforma ya
  está recargando a la versión ganadora. No se reintenta.
- Los cambios se agrupan: hay un retardo corto antes de publicar para no generar una versión por tecla.
- La primera vez que `publish` responde `not_writer` o `not_granted`, la vista se marca de solo
  lectura y esconde los controles de edición. No se detecta antes: no hay forma de preguntar.

## Estructura

```
src/dashboard.html      la aplicación completa: CSS, datos y código en un archivo
data/demo.json          portafolio ficticio de demostración
data/private/           datos reales del portafolio — nunca se versiona
scripts/build.mjs       inyecta un archivo de datos en la plantilla
scripts/serve.mjs       servidor de desarrollo con doble de la plataforma
scripts/check.mjs       revisiones estáticas
scripts/gen-demo.mjs    regenera data/demo.json desde el sembrador de la página
tests/                  pruebas de extremo a extremo
docs/                   modelo de datos, decisiones de arquitectura, base PMBOK
```

## Integración continua

`.github/workflows/ci.yml` corre `npm run check`, el build y las 14 pruebas en cada push a `main`
y en cada pull request, y guarda los PDF que generan las pruebas como artefacto del run.

`.github/workflows/pages.yml` publica en GitHub Pages una versión de **demostración**, y solo
cuando se lanza a mano. Construye a propósito con `data/demo.json`: Pages es público, y lo que
esta herramienta contiene no lo es. La copia publicada además es de solo lectura — fuera de la
plataforma de Artifacts no existe `claude.use()`, así que la página se rinde en modo consulta.

## Datos y privacidad

**Este repositorio no contiene datos reales.** La plantilla trae la base vacía y `data/demo.json`
es un portafolio ficticio. Los datos reales del portafolio van en `data/private/`, que está en
`.gitignore`, y `npm run check` falla si detecta rastros de nombres de clientes, personas o
enlaces internos en la plantilla.

`npm run check` revisa patrones genéricos —correos, enlaces a documentos internos, centros de
costo— y, si existe `data/private/deny-list.txt`, también los términos que pongas ahí. Ese archivo
no se versiona a propósito: una lista de exclusión con los nombres reales de tus clientes y tu
equipo, dentro del repositorio, **sería** la fuga que intenta evitar. Hay una plantilla en
`data/deny-list.example.txt`.

Vale la pena repetirlo antes de compartir un enlace: el tablero incluye el registro de riesgos con
sus planes de contingencia, el presupuesto y la valoración de poder, interés y postura de cada
interesado. Eso último es material interno de gerencia. Antes de publicar el enlace más allá del
equipo, conviene revisar esa pestaña.

## Restricciones del entorno

El visor de Artifacts es un marco restringido, y eso define varias decisiones del código:

- **Los scripts externos solo cargan desde `cdnjs.cloudflare.com`.** De ahí sale jsPDF, y solo
  cuando se pide un PDF. Todo el resto —CSS, JS, el Gantt— va en línea, sin dependencias.
- **`window.print()` no responde** cuando el tablero corre embebido. Por eso el informe se genera
  como PDF y se entrega por la capacidad de descargas; el botón de imprimir queda como alternativa
  para cuando la página se abre en su propia pestaña.
- **La página no puede iniciar descargas por su cuenta**: ni `<a download>` ni blobs. La única vía
  es `downloads.save()`.
- **`localStorage` solo guarda preferencias de quien mira** —la pestaña activa, los filtros—, y
  siempre dentro de `try/catch`. Nada compartido depende de él.
- Las fuentes vienen de Google Fonts, el único host de hojas de estilo permitido, siempre con una
  pila de reserva declarada.

## Licencia

MIT. Ver [LICENSE](LICENSE).
