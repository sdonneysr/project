# Registro de cambios

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).

## [1.0.0] — 2026-09-10

Primera versión publicable del tablero, con el repositorio, las pruebas y la documentación.

### Agregado
- Nueve pestañas: resumen ejecutivo, cronograma, entregables, tareas, riesgos, comunicaciones,
  recursos y costos, ficha del proyecto y datos.
- Gantt propio en SVG con fases, tareas, hitos, flechas de dependencia, línea de hoy, escalas
  día / semana / mes y posicionamiento automático en la fecha actual.
- Persistencia por autopublicación: la página regenera su documento y lo publica como versión nueva.
- Modo consulta automático para quien no tiene permiso de escritura.
- Registro de riesgos con nivel calculado por probabilidad × impacto.
- Plan de comunicaciones con próxima ocurrencia calculada, mapa de interesados poder × interés,
  registro de interesados y matriz de evaluación del involucramiento.
- Ficha de proyecto con objetivo y alcance por dimensión.
- Entregables con descripción, fase que los produce, avance, estado y enlace de evidencia.
- Validación del avance de los entregables contra el promedio de las tareas de su fase, con
  corrección en un clic.
- Informe ejecutivo en PDF vectorial y exportación CSV de las ocho colecciones.
- Tema claro y oscuro, y vista de impresión.
- Repositorio: build, servidor de desarrollo con doble de la plataforma, revisiones estáticas,
  once pruebas de extremo a extremo y documentación del modelo y de las decisiones.

### Notas
- El repositorio no incluye datos reales. `data/private/` está fuera del control de versiones y
  `npm run check` falla si detecta rastros de datos internos en la plantilla.
