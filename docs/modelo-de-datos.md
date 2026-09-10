# Modelo de datos

Once colecciones planas, unidas por `id`. Todo vive en un único objeto JSON embebido en el
documento, bajo `<script type="application/json" id="db">`.

`v` es la versión del esquema; hoy `3`.

## Colecciones

### `proyectos`
| Campo | Notas |
|---|---|
| `id`, `nombre` | obligatorios |
| `codigo` | código interno o centro de costo |
| `cliente`, `gerente` | texto libre |
| `estado` | `Planeado` · `En curso` · `En riesgo` · `Retrasado` · `Cerrado` |
| `fechaInicio`, `fechaFin` | `AAAA-MM-DD` |
| `avanceManual` | 0–100. Lo fija el gerente; el tablero muestra al lado el calculado por tareas |
| `notaAvance` | justificación del avance declarado |
| `presupuestoCOP` | número, sin formato |
| `descripcion` | objetivo del proyecto |

### `fases`
`id`, `proyectoId`, `nombre`, `orden` (numérico, ordena el Gantt), `fechaInicio`, `fechaFin`.

Si una fase no tiene fechas, el Gantt deriva su barra del rango de sus tareas.

### `tareas`
`id`, `proyectoId`, `faseId`, `nombre`, `responsableId`, `fechaInicio`, `fechaFin`,
`avance` (0–100), `estado` (`Pendiente` · `En curso` · `Completada` · `Bloqueada`),
`predecesorasIds` (arreglo de ids de tareas), `esHito` (booleano).

En un hito, `fechaFin` se iguala a `fechaInicio` al guardar. Las predecesoras se validan contra
ciclos; el Gantt marca en rojo la dependencia cuando la tarea arranca antes de que cierre la suya.

### `entregables`
`id`, `proyectoId`, `faseId`, `nombre`, `descripcion` (de qué trata), `responsableId`,
`fechaComprometida`, `avance` (0–100), `estado` (`Pendiente` · `En curso` · `Entregado` ·
`Aprobado` · `Retrasado`), `evidencia` (URL o ubicación), `observaciones`.

`faseId` es lo que hace posible la validación: el avance del entregable debe ser el **promedio
simple** del avance de las tareas de esa fase.

### `riesgos`
`id`, `proyectoId`, `nombre`, `categoria`, `probabilidad` y `impacto` (`Baja` · `Media` · `Alta`),
`planContingencia`, `responsableId`, `estado` (`Abierto` · `En mitigación` · `Mitigado` ·
`Materializado` · `Cerrado`).

El nivel no se guarda: se calcula cruzando probabilidad e impacto (producto de 1–3 por eje).
6 o más es alto, 3 a 4 medio, 2 o menos bajo. Sin ambos ejes valorados queda «Sin valorar».

### `interesados`
`id`, `proyectoId`, `nombre`, `rol`, `organizacion`, `categoria`, `poder` y `interes`
(`Alto` · `Bajo`), `posturaActual` y `posturaDeseada`, `contacto`, `necesidades`, `estrategia`.

Las posturas usan la escala `Desconoce` · `Resistente` · `Neutral` · `Apoya` · `Lidera`.
La brecha es la distancia entre actual y deseada.

### `comunicaciones`
`id`, `proyectoId`, `que`, `porQue`, `destinatarios`, `canal`, `frecuencia`, `fechaInicio`,
`formato`, `responsablePrep`, `aprueba`, `envia`, `repositorio`, `estado`.

La próxima ocurrencia se calcula, no se guarda: se itera desde `fechaInicio` con el paso de la
frecuencia hasta pasar hoy. `Diaria` salta fines de semana; `Mensual` respeta el día del mes y lo
recorta en meses cortos; `Por hito/entregable` y `Según necesidad` no tienen fecha.

### `alcance`
`id`, `proyectoId`, `dimension`, `alcance`, `descripcion`. Una fila por dimensión.
La fila cuya dimensión contiene «fuera» se resalta.

### `recursos`, `asignaciones`, `costos`
- `recursos`: `id`, `nombre`, `rol`, `area`, `costoHoraCOP`.
- `asignaciones`: `id`, `recursoId`, `proyectoId`, `porcentajeAsignacion`, `fechaDesde`, `fechaHasta`.
  El total por persona se suma entre proyectos; por encima de 100 % se marca en rojo.
- `costos`: `id`, `proyectoId`, `concepto`, `tipo`, `montoCOP`, `fecha`, `estado`
  (`Planeado` · `Ejecutado`). Solo los ejecutados cuentan como consumo del presupuesto.

## Reglas transversales

- Las fechas se **guardan** como `AAAA-MM-DD` y se **muestran** como `DD/MM/AAAA`.
- Los montos se guardan como número y se formatean en pesos colombianos al mostrarse.
- Los ids se generan en el cliente con un prefijo por colección (`p-`, `f-`, `t-`, `e-`, `g-`,
  `in-`, `cm-`, `al-`, `r-`, `a-`, `c-`).
- Borrar un proyecto arrastra en cascada todo lo que le cuelga.
- Borrar una persona no borra sus tareas: deja el responsable vacío.

## Cálculos derivados

Nada de esto se guarda; todo se recalcula al pintar.

| Cálculo | Regla |
|---|---|
| Avance de un entregable | Promedio **simple** del avance de las tareas de su fase |
| Avance de un proyecto (referencia) | Promedio de tareas **ponderado por duración** |
| Avance promedio del portafolio | Promedio de proyectos abiertos ponderado por presupuesto |
| Nivel de un riesgo | Probabilidad × impacto, en escala 1–3 por eje |
| Cuadrante de un interesado | Poder × interés |
| Próxima comunicación | Iteración desde la fecha de inicio con el paso de la frecuencia |
| Consumo de presupuesto | Suma de costos ejecutados sobre el presupuesto del proyecto |

Los dos primeros usan criterios distintos **a propósito**: un entregable es un producto y sus
tareas pesan igual, mientras que el avance de un proyecto se distorsiona si una tarea de dos días
pesa lo mismo que una de dos meses. Que sean distintos es una decisión, no una inconsistencia.
