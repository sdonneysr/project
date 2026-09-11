# Registro de cambios

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).

## [1.1.0] — 2026-09-11

### Agregado
- **Bitácora de avances.** Cada vez que cambia el porcentaje de una tarea se guarda un registro con
  la fecha capturada automáticamente, el valor anterior, el nuevo, la diferencia y una nota.
- Pestaña propia que agrupa los registros por semana, con totales de registros y puntos de avance,
  y filtros por tarea y periodo.
- Botón «+ Avance» en cada fila de la tabla de tareas, e historial de la tarea dentro de su
  formulario de edición.
- La tabla de tareas muestra la fecha y la diferencia del último registro.
- Exportación CSV de la bitácora y sección «Avances de la semana» en el informe ejecutivo en PDF.
- Tres pruebas nuevas: captura automática de la fecha, registro desde el formulario de la tarea, y
  reversión del avance al borrar un registro.

### Cambiado
- Esquema de datos a la versión 4: nueva colección `avances`.

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
