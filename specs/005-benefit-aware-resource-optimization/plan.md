# Plan de implementación: Optimización basada en consumo y beneficios

**Feature**: `005-benefit-aware-resource-optimization`
**Branch**: `005-benefit-aware-resource-optimization`
**Fecha**: 2026-09-24
**Estado**: Plan de implementación integrado
**Dependencias**: Feature 004 (entornos dinámicos), motor genético SSE existente y prioridades jerárquicas

**Input**: Alcance definido inicialmente en este plan y formalizado en [spec.md](./spec.md). El script oficial de Spec Kit no resolvió la feature al inicio porque no existían `.specify/feature.json` ni `spec.md`; ambos artefactos ya se completaron manualmente a partir del diseño aprobado.

## Resumen

Extender la evaluación del motor genético para modelar producción útil, demanda, reservas críticas y disponibilidad de recursos a través de periodos. La implementación debe mantener compatibles las plantillas sin `outputs`, preservar el modo manual y el recorrido automático, y entregar razones auditables para inviabilidad, déficit y excedentes. La validación de dependencias ya existe parcialmente; el trabajo central es corregir y ampliar la semántica de simulación, conectarla a objetivos Pareto, contratos SSE y las interfaces.

## Contexto técnico

**Lenguajes/versiones**: Python (servicio FastAPI; versión de runtime por confirmar en infraestructura), TypeScript, React 18 y Next.js 14.2.35.

**Dependencias principales**: FastAPI, Pydantic, NumPy, `sse-starlette`; Next.js, React y Recharts. Dependencias Python declaradas en `motor_genetico/requirements.txt`.

**Persistencia**: Plantillas JSON en memoria/archivos del servicio y estado existente del frontend; esta feature no requiere una base de datos nueva. Confirmar almacenamiento duradero solo si se decide persistir configuración o historial como parte de `spec.md`.

**Pruebas**: pytest y httpx para el motor/API/SSE. El repositorio no declara actualmente un runner de pruebas frontend en `package.json`; las pruebas de interfaz deben acordarse antes de asignar una herramienta nueva.

**Plataforma**: Aplicación web Next.js y microservicio Python/FastAPI con SSE; frontend preparado para Vercel y servicio Python desplegado por separado.

**Metas de rendimiento**: Mantener el objetivo existente de cálculo interactivo y emisión SSE fluida; fijar límites medibles de periodos, nodos, población y tamaño del payload en la especificación. El plan actual no inventa un presupuesto de latencia para la nueva simulación.

**Restricciones**: El cálculo debe ser determinista y estructurado; el LLM no participa en la optimización. Nunca se consume producción antes de que esté disponible. Una solución insegura no puede ser aplicable. Las decisiones finales permanecen bajo aprobación de la asamblea.

**Alcance**: Esquema de template, grafo de dependencias, simulación temporal, fitness/Pareto, endpoint SSE, editor y resultados locales/globales, compatibilidad y regresión.

## Chequeo de constitución

**Puerta inicial: aprobada con condiciones de diseño.**

- **Soberanía de la Asamblea**: las soluciones se presentan para revisión; el sistema no aplica una decisión unilateralmente.
- **Cálculo determinista obligatorio**: validación, simulación, fitness y Pareto se implementan en Python/NumPy, sin delegar matemáticas al LLM.
- **Transparencia y anti-acaparamiento**: exponer por recurso y periodo inventario, consumo, producción útil, excedente, déficit y causa de inviabilidad.
- **Infraestructura ágil**: conservar frontend Next.js y microservicio FastAPI independiente; no introducir un servicio adicional.
- **Arquitectura orientada a APIs**: versionar/ documentar el contrato JSON y SSE y mantener ejemplos reproducibles en Postman cuando el endpoint cambie.

**Condiciones para cerrar la puerta**: acordar en `spec.md` qué significa “periodo” y cuántos se simulan; definir si una reserva mínima se aplica al inventario inicial o a cada periodo; y resolver cómo se decide la cantidad operada por nodo, pues el genotipo actual representa asignaciones proporcionales de requisitos y no una decisión explícita de activar/desactivar procesos.

## Estructura del proyecto

```text
specs/005-benefit-aware-resource-optimization/
├── plan.md
├── spec.md                 # Pendiente: formalizar el alcance antes de tasks
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── template.schema.json
│   └── evolution-event.schema.json
└── tasks.md                # Fase posterior, generado desde spec y diseño

motor_genetico/
├── api/evolution_stream.py
├── core/
│   ├── schemas.py
│   ├── dependencies.py
│   ├── simulation.py
│   ├── fitness.py
│   ├── pareto.py
│   ├── genetic_algorithm.py
│   └── templates.py
└── tests/
    ├── test_dependencies.py
    ├── test_fitness.py
    ├── test_pareto.py
    ├── test_sse_stream.py
    └── ...

src/
├── types/index.ts
├── lib/geneticEngineClient.ts
├── components/GeneticEngine/
│   ├── DynamicControls.tsx
│   └── ResourceLock.tsx
└── app/page.tsx
```

**Decisión de estructura**: extender los módulos existentes del motor y frontend. No crear un segundo backend ni duplicar contratos; el detalle de simulación se agrega en `core/simulation.py` y se comparte mediante los esquemas Python/TypeScript y eventos SSE.

## Investigación y decisiones cerradas

- **Validación de ciclos**: conservar la validación topológica previa a la evolución que existe en `core/dependencies.py`; ampliar sus casos y garantizar una ruta de ciclo legible. Solo activar reglas de producción cuando el template declara outputs, preservando plantillas históricas.
- **Modelo temporal**: adoptar periodos discretos con inventario disponible y producción programada para periodos futuros. La disponibilidad efectiva será `periodo_actual + available_after_periods`; aclarar el significado de cero en `spec.md` (disponible en el mismo periodo tras consumo o al inicio del periodo siguiente).
- **Valoración**: limitar utilidad a demanda restante. El excedente solo se conserva dentro de capacidad de almacenamiento y recibe utilidad únicamente si cubre una demanda futura explícita; no atribuir valor por defecto al excedente.
- **Compatibilidad**: sin `benefit_values`/outputs, conservar la ruta de fitness vigente; añadir campos opcionales con defaults que permitan leer los templates existentes.
- **API/SSE**: mantener los campos actuales y agregar campos de desglose opcionales. Rechazar templates no válidos al activarlos antes de abrir el stream.
- **Datos de pruebas**: agregar un escenario de ejemplo válido y otro cíclico a fixtures/templates de desarrollo, sin convertir datos de demostración en defaults de producción.

## Estado verificado del código y brechas de diseño

Ya existen `OutputDef`, `BenefitValueDef`, `ConsumerDef.outputs`, `DynamicTemplate.benefit_values`, un validador de dependencias invocado al activar template y un cálculo parcial de producción útil. Estos componentes son una base, no una implementación completa del alcance.

La simulación actual suma producción sin inventario por periodo ni consumo de producción; ignora `available_after_periods` como calendario, y calcula reservas contra asignaciones iniciales agregadas. El fitness penaliza déficits/reservas, pero no hace inviables todos los déficits críticos ni devuelve un desglose por nodo/periodo. `get_objectives` agrega dimensiones de beneficios de forma parcial. Los eventos SSE no incluyen métricas temporales. El tipo TypeScript aún no declara `benefit_values`; el editor y los resultados no configuran ni explican producción. El recorrido automático en `src/app/page.tsx` acumula fitness local, por lo que debe recalcular las ramas completas con el modelo global.

La validación de grafo actual relaciona productor con cualquier consumidor del mismo recurso y detecta ciclos entre nodos; la especificación debe confirmar cómo distinguir inventario inicial de producción y qué hacer ante varios productores del mismo recurso. El criterio “recurso producido sin definición de valor” debe ser consistente con recursos intermedios que habilitan otros nodos pero no son un beneficio final.

---
# Plan de Implementación: Optimización Basada en Consumo y Beneficios

**Feature**: `005-benefit-aware-resource-optimization`  
**Fecha**: 2026-09-24  
**Estado**: Diseño previo a implementación  
**Dependencias**: `004-dynamic-environments`, motor genético SSE y prioridades jerárquicas

## 1. Objetivo

Ampliar el motor genético para que no optimice únicamente la distribución de recursos consumidos, sino también los beneficios que cada nodo produce. El sistema deberá evitar soluciones matemáticamente válidas pero estratégicamente absurdas, especialmente aquellas que dependen de ciclos de producción imposibles o de recursos que todavía no existen.

Ejemplo válido:

```text
Reservas iniciales -> Planta energética -> Energía -> Cultivo -> Comida
```

Ejemplo inválido:

```text
Planta energética -> Cultivo -> Planta energética
```

La funcionalidad debe conservar:

- El modo manual nodo por nodo.
- Las tres soluciones Pareto locales del nodo seleccionado.
- El recorrido automático y sus tres soluciones globales.
- Las prioridades estratégicas jerárquicas ya implementadas.

## 2. Decisiones de diseño

### 2.1 Producción temporal por periodos

La producción no estará disponible en el mismo instante en que se consume. Cada solución se evaluará en periodos discretos:

1. Se parte del inventario inicial.
2. Se verifican los recursos disponibles.
3. Se ejecutan los nodos habilitados.
4. Se descuentan consumos.
5. Se agregan beneficios producidos.
6. Los beneficios estarán disponibles para el siguiente periodo.

Esto evita que una solución se autojustifique usando producción futura como entrada presente.

### 2.2 Grafo acíclico de dependencias

Los beneficios y consumos formarán un grafo dirigido de recursos y nodos. Antes de ejecutar el algoritmo se deberá:

- Construir las dependencias de entrada y salida.
- Ejecutar una validación topológica.
- Rechazar ciclos directos o indirectos.
- Mostrar el ciclo detectado con su ruta completa.

El árbol actual de consumidores seguirá siendo válido, pero las relaciones de producción se validarán como un grafo adicional.

### 2.3 Beneficio útil, no producción bruta

La utilidad no se calculará sobre toda la producción nominal. Se aplicará:

```text
beneficio_util = min(produccion_real, demanda_restante)
```

La producción excedente podrá:

- Tener valor cero si no existe almacenamiento.
- Tener un valor reducido si existe almacenamiento limitado.
- Mantener valor completo únicamente si satisface una demanda futura explícita.

### 2.4 Reservas críticas

Antes de asignar recursos a producción se protegerán las reservas mínimas definidas para la operación:

- Agua vital.
- Energía de soporte.
- Comida mínima.
- Oxígeno u otros recursos críticos.

Una solución que viole una reserva crítica será inviable aunque produzca beneficios elevados.

### 2.5 Prioridad estratégica como factor secundario

La prioridad local y la prioridad efectiva heredada seguirán existiendo, pero no sustituirán al valor de los beneficios. El orden de decisión será:

1. Cumplir restricciones de seguridad y reservas críticas.
2. Evitar ciclos y dependencias imposibles.
3. Cubrir demandas críticas.
4. Maximizar beneficios útiles.
5. Usar la prioridad estratégica para desempatar o ponderar objetivos equivalentes.

## 3. Modelo de datos propuesto

### 3.1 Producción de un nodo

Añadir a `ConsumerDef` una colección de salidas:

```text
outputs: Record<string, OutputDef>
```

Cada `OutputDef` deberá contener inicialmente:

- `resource_name`: recurso producido.
- `amount_per_unit`: cantidad producida por unidad de operación.
- `efficiency`: eficiencia entre `0` y `1`.
- `max_output`: límite máximo opcional por periodo.
- `available_after_periods`: retraso de disponibilidad, por defecto `1`.

La representación puede mantenerse como mapa por nombre de recurso si se conserva un contrato JSON sencillo.

### 3.2 Demanda y valoración

El template deberá incorporar una sección global de valoración:

```text
benefit_values: Record<string, BenefitValueDef>
```

Cada beneficio deberá definir:

- `unit_value`: valor normalizado del recurso.
- `target_demand`: demanda objetivo.
- `critical`: si su déficit afecta la viabilidad.
- `minimum_reserve`: reserva mínima que no puede consumirse.
- `storage_capacity`: capacidad de almacenamiento opcional.

### 3.3 Estado de simulación

Crear una estructura interna de simulación con:

- Inventario inicial.
- Inventario disponible por periodo.
- Consumo por nodo y recurso.
- Producción por nodo y recurso.
- Déficit acumulado.
- Excedente almacenado.
- Violaciones de reserva.
- Dependencias pendientes.
- Periodo actual.

Este estado no debe exponerse directamente como genes del algoritmo; será una capa de evaluación determinista.

## 4. Cambios en el motor genético

### Fase 1: Contratos y validación

1. Extender los esquemas Pydantic con `outputs`, valoración y reservas.
2. Validar rangos numéricos:
   - Eficiencias entre `0` y `1`.
   - Valores y demandas mayores o iguales a `0`.
   - Retrasos enteros mayores o iguales a `0`.
3. Implementar el constructor del grafo de dependencias.
4. Implementar detección de ciclos mediante ordenamiento topológico.
5. Crear errores de validación legibles para la UI.
6. Rechazar templates inválidos antes de iniciar SSE.

### Fase 2: Simulador determinista

1. Crear un simulador de periodos independiente del algoritmo genético.
2. Consumir recursos únicamente desde el inventario disponible.
3. Programar outputs para el periodo correspondiente.
4. Aplicar eficiencia y límites de producción.
5. Aplicar almacenamiento y capacidad máxima.
6. Calcular demanda restante después de cada producción.
7. Separar beneficio útil, excedente y déficit.
8. Registrar un desglose explicable por nodo y periodo.

### Fase 3: Nueva función de fitness

La función de evaluación deberá producir como mínimo:

```text
fitness_total =
    utilidad_de_beneficios
    - penalizacion_por_deficit
    - penalizacion_por_consumo_excesivo
    - penalizacion_por_reservas
    - penalizacion_por_excedentes_no_utiles
```

Reglas:

- Una violación crítica debe marcar el individuo como inviable.
- Los beneficios deben valorarse con la demanda restante.
- Los recursos producidos en un periodo no pueden consumirse antes de estar disponibles.
- La prioridad efectiva puede ponderar la utilidad de un nodo, pero no anular las restricciones de seguridad.
- Mantener la función actual como modo de compatibilidad cuando un template no declare outputs.

### Fase 4: Objetivos Pareto

Los objetivos deben representar dimensiones estratégicas separadas, por ejemplo:

- Cobertura de comida.
- Cobertura de energía.
- Cobertura de agua potable.
- Cobertura de oxígeno.
- Déficit total.
- Consumo total o eficiencia.
- Cumplimiento de reservas críticas.

No se debe reducir todo a una única suma demasiado pronto. La frontera Pareto debe conservar alternativas con diferentes intercambios estratégicos.

### Fase 5: Recorrido automático global

El recorrido automático actual deberá utilizar la evaluación de beneficios al comparar ramas globales:

1. Generar alternativas locales para el nodo.
2. Simular su impacto en el inventario y periodos.
3. Propagar únicamente estados válidos.
4. Mantener el beam de soluciones parciales.
5. Puntuar cada rama con utilidad global y restricciones.
6. Presentar las tres soluciones globales completas.
7. Mantener el flujo manual sin cambios.

La rama no debe copiar únicamente los `fitness_score` locales. Debe recalcularse con la utilidad acumulada del árbol completo.

## 5. Cambios en la interfaz

### Editor de nodos

Añadir una sección de producción junto a los requerimientos:

- Recursos consumidos.
- Beneficios producidos.
- Eficiencia.
- Capacidad por periodo.
- Retraso de disponibilidad.
- Prioridad local.
- Prioridad efectiva heredada.

### Configuración global

Añadir un modal para configurar:

- Valor de cada beneficio.
- Demanda objetivo.
- Reservas mínimas.
- Capacidad de almacenamiento.
- Número máximo de periodos.

### Resultados locales

Mantener las tres tarjetas actuales, agregando:

- Beneficios generados.
- Déficits restantes.
- Consumo total.
- Periodos utilizados.
- Alertas de reservas o excedentes.

### Resultados globales

Mantener la vista previa antes de aplicar y añadir:

- Beneficio total útil.
- Cobertura por recurso.
- Déficit crítico.
- Consumo y producción por periodo.
- Nodos que habilitaron otros nodos.
- Alertas de dependencias o capacidad.

Una solución con ciclo o reserva crítica incumplida no deberá aparecer como aplicable.

## 6. API y SSE

### Validación del template

El endpoint de activación deberá validar el grafo antes de aceptar el template. La respuesta deberá distinguir:

- Error de esquema.
- Ciclo de dependencias.
- Reserva inválida.
- Recurso producido sin definición de valor.

### Evaluación de ramas globales

El endpoint `POST /scenarios/evaluate` recibirá el template completo y las preferencias combinadas por `nodo.recurso`. Devolverá score global, factibilidad, beneficio útil, déficits y desglose por periodo. El recorrido automático debe llamar este endpoint después de cada expansión del beam; el score acumulado de ramas locales no es comparable y no debe usarse como fitness global.

### Eventos SSE

Extender los eventos de evolución con información opcional:

- `period`.
- `available_resources`.
- `produced_resources`.
- `useful_benefits`.
- `critical_deficits`.
- `dependency_status`.
- `consumed_resources` y `demand_deficits`.

Los clientes antiguos deberán poder ignorar esos campos.

## 7. Compatibilidad y migración

1. Los templates actuales sin `outputs` deben continuar funcionando.
2. Los nodos sin beneficios conservarán el comportamiento actual de consumo y prioridad.
3. Los valores existentes de `priority_weight` se mantendrán.
4. La interfaz deberá mostrar una configuración de producción vacía, no inventar outputs.
5. La validación de ciclos solo será obligatoria cuando existan relaciones de producción.
6. Se deberá añadir una plantilla de ejemplo con:
   - Planta energética.
   - Cultivo de papas.
   - Inventario inicial limitado.
   - Dependencia válida por periodos.
   - Caso de ciclo inválido.

## 8. Pruebas

### Unitarias

- Validar rangos de outputs y beneficios.
- Detectar ciclo directo.
- Detectar ciclo indirecto.
- Aceptar un grafo acíclico válido.
- Impedir consumo antes de producción.
- Aplicar correctamente la eficiencia.
- Limitar producción por capacidad.
- Limitar beneficios por demanda restante.
- Proteger reservas críticas.
- Penalizar excedentes sin almacenamiento.
- Calcular prioridad efectiva sin duplicarla en la distribución entre hermanos.

### Motor genético

- Comparar una solución que produce comida útil contra otra que produce excedente inútil.
- Verificar que una planta energética no sea favorecida si no tiene agua inicial suficiente.
- Verificar que el cultivo pueda usar energía producida en un periodo anterior.
- Confirmar que las soluciones con ciclos sean inviables.
- Confirmar que Pareto preserve alternativas con distintos intercambios.

### API y SSE

- Rechazar templates con ciclos antes de iniciar SSE.
- Emitir eventos de periodo y producción.
- Mantener compatibilidad con templates antiguos.
- Conservar desconexión y cancelación del stream.

### Interfaz

- Mostrar outputs editables.
- Mostrar reservas y déficits.
- Conservar el modo manual.
- Generar tres soluciones globales con el recorrido automático.
- Permitir revisar una solución global antes de aplicarla.
- Impedir aplicar una solución inválida.

## 9. Orden de implementación recomendado

1. Definir el contrato de outputs, beneficios, demandas y reservas.
2. Implementar validación del grafo y detección de ciclos.
3. Crear el simulador determinista por periodos.
4. Añadir pruebas unitarias del simulador.
5. Integrar el simulador con fitness y objetivos Pareto.
6. Actualizar el endpoint de templates y SSE.
7. Añadir una plantilla válida y una inválida para pruebas.
8. Actualizar el editor de nodos y configuración global.
9. Actualizar las tarjetas de resultados locales.
10. Integrar utilidad global con el recorrido automático.
11. Actualizar la vista previa de soluciones globales.
12. Ejecutar validación end-to-end y pruebas de regresión.

## 10. Criterios de aceptación

- El sistema rechaza cualquier ciclo de producción antes de ejecutar el algoritmo.
- Ningún nodo puede consumir producción futura en el mismo periodo.
- Una producción solo recibe valor cuando cubre una demanda real o una capacidad de almacenamiento válida.
- Las reservas críticas se respetan en todas las soluciones aplicables.
- El modo manual sigue generando tres soluciones para el nodo seleccionado.
- El modo automático sigue generando tres soluciones globales completas.
- Las soluciones globales se pueden revisar antes de aplicarse.
- Los templates actuales continúan funcionando sin declarar beneficios.
- La interfaz explica por qué una solución recibe penalización o es rechazada.
- Los resultados muestran consumo, producción, déficit, excedente y utilidad de forma auditable.

## 11. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Crecimiento combinatorio de alternativas | Beam search con ancho configurable y poda por inviabilidad |
| Ciclos de producción | Validación topológica antes de iniciar el motor |
| Beneficios artificiales por producción excedente | Valorar solo demanda restante y almacenamiento válido |
| Doble conteo de recursos producidos | Inventario por periodo y trazabilidad de cada entrada/salida |
| Cambios bruscos en resultados existentes | Compatibilidad para templates sin outputs y pruebas de regresión |
| Modelo difícil de configurar | Valores por defecto, validación en UI y plantilla de ejemplo |
| Prioridades que contradicen seguridad | Reservas y restricciones duras antes de ponderaciones estratégicas |
| SSE demasiado pesado | Emitir resúmenes por periodo y mantener detalles bajo demanda |

## 12. Resultado esperado

El motor dejará de buscar únicamente una distribución de consumo y pasará a evaluar planes de producción y consumo temporalmente válidos. Las soluciones favorecidas serán aquellas que:

- Sean físicamente y temporalmente posibles.
- No dependan de ciclos circulares.
- Protejan las reservas críticas.
- Cubran necesidades reales.
- Produzcan beneficios útiles.
- Usen la prioridad estratégica como contexto, no como sustituto del valor real.
