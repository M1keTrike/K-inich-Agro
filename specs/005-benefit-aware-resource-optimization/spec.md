# Especificación: Optimización de recursos basada en beneficios

**Feature Branch**: `005-benefit-aware-resource-optimization`  
**Creada**: 2026-09-24  
**Estado**: Draft  
**Input**: Continuar el plan de optimización incorporando outputs útiles, disponibilidad temporal, reservas y evaluación global.

## Escenarios de usuario y pruebas

### Historia 1 — Evaluar cadenas de producción posibles (P1)

Como operador del sistema, quiero que los recursos producidos estén disponibles solo en periodos posteriores y que las dependencias circulares se rechacen, para que el optimizador no proponga procesos que se habilitan a sí mismos.

**Prueba independiente**: activar una plantilla acíclica de planta energética y cultivo, simular varios periodos y observar que el cultivo recibe la energía después de su producción. Intentar activar la misma plantilla con un ciclo y recibir un error 422 con su ruta.

**Aceptación**:

1. **Given** una plantilla acíclica con outputs, **When** se evalúa, **Then** cada output se agenda para `periodo + max(1, available_after_periods)` y no se consume antes de estar disponible.
2. **Given** un ciclo directo o indirecto, **When** se activa la plantilla, **Then** se rechaza antes de iniciar SSE y se incluye la ruta del ciclo.
3. **Given** un output con eficiencia y máximo por periodo, **When** opera el nodo, **Then** la cantidad respeta ambos parámetros.

### Historia 2 — Comparar beneficios, déficit y seguridad (P1)

Como miembro de la asamblea, quiero comparar beneficios útiles, demandas pendientes, consumo y reservas en las soluciones Pareto, para entender los intercambios y descartar alternativas inseguras.

**Prueba independiente**: evaluar una plantilla con demanda objetivo y otra con producción excedente; comprobar que el excedente no recibe utilidad, que las reservas se protegen y que una demanda crítica incumplida no produce una solución aplicable.

**Aceptación**:

1. La utilidad de una salida no supera la demanda restante; el excedente no recibe valor fuera de la capacidad declarada.
2. Una demanda crítica pendiente o una reserva imposible vuelve inviable el individuo, aunque su utilidad sea alta.
3. Las dimensiones Pareto separan beneficios por recurso y eficiencia de consumo; las soluciones inviables no forman parte del frente aplicable.
4. Templates sin outputs conservan la evaluación previa y sus clientes ignoran los nuevos campos opcionales del SSE.

### Historia 3 — Configurar producción y valoración (P2)

Como editor del escenario, quiero asignar outputs y definir eficiencia, límite, retraso, demanda, valor, reservas y almacenamiento, para modelar la operación sin editar JSON a mano.

**Prueba independiente**: añadir un output desde el editor, configurar sus valores globales, guardar el template y verificar que el payload pasa la validación del motor.

**Aceptación**:

1. Cada output permite editar recurso, cantidad por operación, eficiencia `[0,1]`, máximo opcional y retraso entero no negativo.
2. Cada recurso valorado permite configurar valor unitario, demanda, criticidad, reserva y almacenamiento opcional; se configura el máximo de periodos.
3. El cliente comunica errores de esquema, ciclo, valoración ausente y reserva inválida sin iniciar SSE.

### Historia 4 — Elegir alternativas globales completas (P2)

Como operador, quiero que el recorrido automático compare cada combinación mediante una reevaluación del árbol completo, para que las tres propuestas globales reflejen interacciones entre nodos y no la suma de fitness locales.

**Prueba independiente**: combinar decisiones de dos nodos donde una rama habilita producción aguas abajo; confirmar que el orden de ramas cambia según el fitness y viabilidad global recalculados.

**Aceptación**:

1. Cada rama del beam combina las preferencias de sus decisiones locales y se evalúa contra el template global y el horizonte temporal completo.
2. El UI muestra utilidad, demandas pendientes, reservas y consumo/producción por periodo.
3. No se puede revisar ni aplicar una combinación que incumpla restricciones duras o demandas críticas.
4. El flujo manual por nodo y la vista previa antes de aplicar siguen disponibles.

## Casos límite

- Una reserva por encima del inventario inicial o de su capacidad declarada se rechaza como `invalid_reserve`.
- Una salida referida a un recurso inexistente o sin `benefit_values` se rechaza antes de SSE.
- `available_after_periods: 0` mantiene disponibilidad al periodo siguiente como mínimo; nunca permite consumo dentro del mismo paso.
- Un valor de preferencia fuera de `[0,1]`, un recurso desconocido o una plantilla inválida de evaluación se rechaza con HTTP 422.
- Si hay menos de tres soluciones factibles diferenciadas, se muestran las disponibles y posiciones no disponibles, sin duplicarlas.
- Los templates anteriores sin outputs conservan los campos y resultado existentes.

## Requisitos

- **FR-001**: El motor DEBE aceptar outputs por recurso con cantidad por operación, eficiencia, máximo opcional y retraso.
- **FR-002**: El motor DEBE validar referencias de recursos, valoraciones, reservas y dependencias antes de activar el template.
- **FR-003**: El motor DEBE detectar ciclos directos/indirectos y devolver su ruta.
- **FR-004**: El simulador DEBE operar por periodos con inventario al inicio, consumo protegido por reservas y outputs disponibles en periodos futuros.
- **FR-005**: La utilidad DEBE cubrir solo demanda restante; excedentes sin almacenamiento/demanda explícita no suman utilidad.
- **FR-006**: Demandas críticas pendientes y reservas incumplidas DEBEN marcar la solución como no factible.
- **FR-007**: El motor DEBE conservar dimensiones separadas de beneficio y eficiencia en Pareto.
- **FR-008**: El SSE DEBE conservar sus campos actuales y añadir métricas opcionales de periodo, inventario, consumo, producción, utilidad, déficit y dependencias.
- **FR-009**: El editor DEBE configurar outputs por nodo y valores globales por recurso.
- **FR-010**: La UI DEBE explicar resultados locales/globales y bloquear soluciones no factibles.
- **FR-011**: El recorrido global DEBE reevaluar las preferencias combinadas sobre el árbol completo.
- **FR-012**: Templates existentes sin outputs DEBEN conservar el comportamiento actual.
- **FR-013**: El cálculo DEBE ser determinista y no puede delegarse al LLM; toda selección/aplicación permanece bajo control humano.

## Criterios de éxito

- **SC-001**: La plantilla acíclica planta→energía→cultivo→comida completa el flujo sin consumir producción antes de su periodo de disponibilidad.
- **SC-002**: Todos los ciclos enviados al endpoint de activación reciben HTTP 422 y una ruta legible.
- **SC-003**: Ninguna solución con déficit crítico o reserva violada se presenta como aplicable.
- **SC-004**: El excedente por encima de demanda/capacidad no aumenta la utilidad.
- **SC-005**: Templates legacy continúan funcionando y los payloads SSE conservan campos previos.
- **SC-006**: El recorrido automático ordena ramas por fitness global recalculado y muestra sus desglose temporal.
- **SC-007**: El editor permite cambiar outputs y valoración y persiste dichos cambios en el template activo.

## Supuestos

- La preferencia genética es una proporción `[0,1]` para cada par nodo/recurso y se aplica al inventario disponible de cada periodo; la prioridad jerárquica existente conserva la distribución entre nodos.
- `available_after_periods` cuenta desde el periodo de operación; incluso cero se habilita al iniciar el periodo siguiente para impedir consumo simultáneo.
- `target_demand` es la demanda total acumulada durante `max_periods`.
- El almacenamiento limita inventario de salida que sobrevive entre periodos; sin capacidad declarada solo se conserva el mínimo protegido y el lote que llega para el periodo de consumo.
- Los valores unitarios son pesos configurados por escenario, no unidades monetarias.
