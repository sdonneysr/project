# Decisiones de arquitectura

## Por qué un solo archivo

El tablero corre como Artifact: una página que la plataforma sirve en un marco restringido y que
puede publicar versiones nuevas de sí misma. Eso descarta un backend y también un bundler, porque
el artefacto publicado tiene que ser autosuficiente. La consecuencia es que `src/dashboard.html`
lleva el CSS, los datos y todo el código; `scripts/build.mjs` solo inyecta el archivo de datos.

## Por qué la página se regenera y no se serializa

Para guardar, la página llama `artifact.publish(html)` con el documento completo. Ese documento se
arma leyendo el **texto fuente** de sus propios `<style id="css">` y `<script id="app">` y
pegándolos alrededor del JSON nuevo:

```js
function buildDoc(){
  const css = document.getElementById('css').textContent;
  const js  = document.getElementById('app').textContent;
  return '<!doctype html>…<style id="css">' + css + '</style>…'
       + '<script type="application/json" id="db">' + datos + '</script>'
       + '<script id="app">' + js + '</script>…';
}
```

La alternativa evidente —`document.documentElement.outerHTML`— está descartada: arrastra estado de
sesión, scripts que inyecta la plataforma y cualquier cosa que el DOM tenga en ese instante. Leer
el texto de los dos elementos devuelve el fuente exacto, sin nada de eso.

De ahí sale una regla que hay que respetar al editar el código: **el script no puede contener la
cadena de cierre de etiqueta literal**, porque se reinserta dentro de un `<script>`. Se escribe
partida (`'<\/script>'`). `npm run check` lo verifica.

## Por qué el render es completo y no incremental

Cada cambio vuelve a pintar `#root` entero desde el estado, con delegación de eventos en
`document`. Con uno a cinco proyectos el costo es imperceptible y elimina toda una clase de bugs
de sincronización entre DOM y estado. La posición del scroll se preserva a mano; el Gantt se
reposiciona en «hoy» al pintarse.

## Por qué el Gantt es propio

Las librerías de Gantt no entran: el visor solo permite scripts de `cdnjs`, y cargar una para
dibujar barras posicionadas es desproporcionado. El Gantt son divs absolutos sobre un lienzo de
`totalDías × píxelesPorDía`, con las flechas de dependencia en un SVG superpuesto. El panel de
nombres es una columna `sticky` a la izquierda; el gráfico desplaza en horizontal por su cuenta,
de modo que el cuerpo de la página nunca desborda.

## Por qué el avance de los entregables se valida y no se sincroniza

El tablero **detecta** el desajuste entre el avance guardado de un entregable y el promedio de sus
tareas, lo muestra y ofrece corregirlo, pero no lo reescribe solo. Un avance es una cifra que el
gerente reporta y sostiene; cambiarla en silencio porque alguien movió una tarea le quita el
control sobre lo que va a presentar. El ajuste queda como un acto explícito y auditable.

## Por qué el PDF se genera y no se imprime

`window.print()` no responde dentro del marco del visor. En vez de dejar un botón que no hace nada,
el informe ejecutivo se arma con jsPDF —cargado desde cdnjs solo al pedirlo— y se entrega con
`downloads.save()`. El resultado es texto vectorial, seleccionable y de pocos kilobytes, en vez de
una captura. Las fuentes estándar de PDF solo cubren Latin-1, así que `pdfTxt()` normaliza flechas,
rombos y comillas tipográficas antes de escribirlas.

## Temas claro y oscuro

Quien mira tiene tres estados, no dos: eligió claro, eligió oscuro, o no eligió nada y manda el
sistema. Por eso la paleta completa se define en `:root` a secas, se redefine bajo
`@media (prefers-color-scheme: dark)` con el guardián `:root:not([data-theme="light"])`, y otra vez
bajo `:root[data-theme="dark"]`. Ningún color se declara **solo** dentro de un bloque de tema:
`npm run check` falla si aparece uno, porque ese es el bug clásico de texto de un tema sobre el
fondo del otro.

## Qué se guarda en el navegador y qué no

`sessionStorage` guarda únicamente preferencias de quien mira: la pestaña activa y los filtros, para
que sobrevivan a la recarga que hace la plataforma después de publicar. Siempre entre `try/catch`,
porque en algunos contextos el acceso lanza. Nada compartido ni durable depende de ello.

## Modo consulta

No hay forma de preguntar de antemano si esta vista puede escribir. La página asume que sí, y la
primera vez que `publish` responde `not_writer` o `not_granted` se marca de solo lectura, esconde
los controles de edición y muestra una banda que lo explica. Lo que se conserva para quien consulta:
filtros, navegación, Gantt, impresión, PDF y exportación CSV.
