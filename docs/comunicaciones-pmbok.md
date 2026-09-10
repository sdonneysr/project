# Base de la pestaña de comunicaciones

La pestaña combina dos cosas: la estructura de una matriz de comunicaciones de proyecto ya probada
en la práctica, y los artefactos del dominio de desempeño de interesados del PMBOK.

## Lo que aporta cada parte

La matriz de comunicaciones responde, por fila: **qué** se comunica, **por qué**, **a quién**, por
qué **canal**, con qué **frecuencia**, y quién **prepara, aprueba y envía**. Eso es el plan
documental clásico, y es lo que se firma.

Los artefactos del PMBOK son los que lo vuelven una herramienta de gestión y no un anexo:

| Artefacto | Qué resuelve |
|---|---|
| **Registro de interesados** | Deja por escrito quién es, qué necesita saber y cómo se lo involucra. Identificar interesados es un proceso continuo, no un evento de inicio: el registro se edita cuando cambia la realidad. |
| **Mapa poder × interés** | Cuatro cuadrantes con una estrategia base cada uno: gestionar de cerca, mantener satisfecho, mantener informado, monitorear. |
| **Matriz de evaluación del involucramiento** | Postura **actual** contra **deseada** en la escala Desconoce · Resistente · Neutral · Apoya · Lidera. Cuando la actual queda por debajo, hay una brecha que se cierra con acciones concretas, no con más correos. |
| **Próxima ocurrencia** | Monitorear las comunicaciones exige saber cuándo toca la siguiente. El tablero la calcula y avisa a siete días. |

## Decisiones al modelarlo

**El nivel de involucramiento se valora, no se supone.** El plan base que carga el botón deja
`posturaActual` en blanco a propósito. Poder e interés se pueden inferir del rol —un patrocinador
es alto en ambos por definición—, pero la postura real de una persona es una observación que solo
hace quien trata con ella. Rellenarla habría llenado la matriz de datos falsos que se ven bien.

**El patrocinador entra con postura deseada «Lidera».** Un patrocinador activo es factor crítico de
éxito, y la diferencia entre uno que aprueba y uno que lidera es la que se paga cuando hay que
desbloquear algo.

**La cadencia es mixta.** Coordinación diaria por chat, seguimiento e informe semanal, comité
mensual. Es la adaptación razonable para un proyecto grande de ERP: lo operativo se resuelve
rápido y lo formal no se diluye.

## Lo que la pestaña no hace

No tiene sección de firmas ni control de versiones del plan. Un plan de comunicaciones formal se
aprueba y se firma; el tablero es la herramienta operativa. Para el documento firmado se exporta
`interesados` y `comunicaciones` a CSV y se arma aparte.
