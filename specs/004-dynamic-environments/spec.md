# Feature Specification: Módulo de Entornos Dinámicos y Gobernanza Agnóstica

**Feature Branch**: `004-dynamic-environments`

**Created**: 2026-09-21

**Status**: Draft

**Input**: User description: "Genera la Especificación 004 para K'inich-Agro: Módulo de Entornos Dinámicos y Gobernanza Agnóstica. El objetivo es refactorizar el sistema para que sea 100% flexible ante cualquier caso de uso (recintos humanos, desastres naturales) eliminando las variables estáticas (agua, energía) y transicionando a un modelo multivariable dinámico de N-dimensiones. Define estrictamente los siguientes componentes: 1. Modelo de Datos Agnóstico, 2. Motor Genético de N-Dimensiones, 3. Renderizado de Interfaz Dinámica, 4. Base de Conocimientos de Gobernanza."

## Clarifications

### Session 2026-09-21
- Q: How should the governance knowledge base be provided to the LLM? → A: As a static Markdown document injected directly into the system prompt.
- Q: How does the genetic algorithm differentiate between "consumable" and "environmental" resource types? → A: Consumables are treated as depletable inventory (minimize usage), while environmental factors are treated as boundary constraints (stay within min/max thresholds).
- Q: Where will the "Scenario Templates" be stored? → A: As flat JSON configuration files loaded by the backend/frontend.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Simulación de Escenarios Multivariables (Priority: P1)

Los usuarios (operadores o asamblea) pueden seleccionar o inyectar nuevas "Plantillas de Escenario" (ej. Tormenta de Polvo, Falla de Soporte Vital) que introducen instantáneamente múltiples variables nuevas de recursos y restricciones ambientales sin necesidad de modificar el código base.

**Why this priority**: Es el núcleo del refactor, permitiendo la adaptación del gemelo digital a N variables dinámicas.

**Independent Test**: Can be fully tested by inyectando un JSON con variables novedosas de recursos y comprobando que el sistema actualiza su estado y reconoce las nuevas restricciones.

**Acceptance Scenarios**:

1. **Given** un estado de sistema normal, **When** el usuario inyecta una plantilla con 5 variables nuevas de recursos (ej. oxígeno, radiación), **Then** el motor de estado actualiza la simulación y refleja las nuevas variables sin errores en la estructura de datos.

---

### User Story 2 - Cálculo de Supervivencia N-Dimensional (Priority: P1)

El motor genético lee dinámicamente la longitud del array de variables inyectadas y optimiza las matrices para extraer los 3 escenarios clave (Prioridad Vital, Sostenibilidad a Largo Plazo, Equilibrio), ajustando el cálculo basándose en los pesos de prioridad de las nuevas variables.

**Why this priority**: Sin esta capacidad, el cálculo genético no funcionará con los nuevos modelos multivariables, rompiendo la base del algoritmo de supervivencia.

**Independent Test**: Can be fully tested by simulando el motor con diferentes longitudes de arrays (2, 5, 20) y asegurando que sigue retornando escenarios Top-3 válidos y deterministas sin fallos.

**Acceptance Scenarios**:

1. **Given** un array inyectado con 20 variables de recursos dinámicos, **When** el motor genético se ejecuta, **Then** calcula correctamente los escenarios adaptados a las restricciones y pesos dinámicos en tiempo real sin romper el streaming SSE.

---

### User Story 3 - Panel Interactivo Multivariable (Priority: P2)

Los usuarios pueden visualizar el estado de todas las variables inyectadas en los componentes visuales interactivos (StateIndicators, ResourceProgressBar y ScenarioCard). Estos componentes renderizan barras o píldoras iterando sobre las llaves del JSON recibido, en lugar de estar anclados a variables predefinidas.

**Why this priority**: Permite que el sistema sea transparente con los usuarios sobre el estado de cualquier variable insertada dinámicamente, democratizando la información y mitigando el acaparamiento según la constitución.

**Independent Test**: Can be fully tested by inyectando JSONs con diferentes cantidades de llaves y comprobando que la interfaz renderiza visualmente exactamente los indicadores recibidos, con sus respectivas unidades.

**Acceptance Scenarios**:

1. **Given** una inyección de datos con 5 recursos, **When** la UI procesa el JSON, **Then** renderiza dinámicamente 5 barras de progreso precisas con las unidades y métricas correspondientes.

---

### User Story 4 - Análisis Contextual de Gobernanza (Priority: P2)

Los usuarios reciben justificaciones detalladas para los 3 escenarios propuestos por el LLM, analizando las implicaciones sociales del array dinámico de recursos afectados, basándose en la integración de una base de conocimientos documentales de modelos teóricos de gobernanza y gestión de recursos (ej. marcos de bienes comunes).

**Why this priority**: Permite que las decisiones sugeridas sean socialmente comprensibles, fomentando la cohesión y ayudando en las decisiones de asamblea.

**Independent Test**: Can be fully tested by pidiendo explicaciones para un Top 3 de escenarios y revisando que las justificaciones citen activamente los marcos teóricos configurados.

**Acceptance Scenarios**:

1. **Given** un nuevo conjunto de variables inyectado y resuelto por el motor genético, **When** el LLM genera las explicaciones de los escenarios, **Then** justifica el impacto social utilizando la base de gobernanza y explica las consecuencias de la escasez/abundancia de las variables afectadas.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST process an input JSON containing a dynamic array or object of resources, where each resource defines its `id`, `current_value`, `max_value`, `unit` (e.g., liters, $m^2$, %), `type` (consumable vs. environmental), and `priority_weight`.
- **FR-002**: System MUST allow injecting arrays of variable sizes (e.g., 2, 5, or 20 distinct resources) without requiring any core code modifications.
- **FR-003**: System MUST execute the N-dimensional genetic algorithm across dynamically sized resource arrays to calculate hard constraints and fitness functions, differentiating math by `type` (consumables are minimized for usage, while environmental factors are boundary constraints).
- **FR-004**: System MUST calculate the Pareto Front and extract the Top-3 scenarios (Vital Priority, Long-Term Sustainability, Equilibrium) based dynamically on the weights of the injected resources.
- **FR-005**: System MUST dynamically render frontend UI components (`StateIndicators`, `ResourceProgressBar`, `ScenarioCard`) by iterating over the JSON keys.
- **FR-006**: System MUST provide a 'Scenario Templates' selection panel on the frontend to bulk inject new variable sets and constraints loaded from flat JSON configuration files.
- **FR-007**: System MUST provide the LLM (OpenRouter) with a context knowledge base covering theoretical models of resource management and governance by injecting a static Markdown document directly into the system prompt.
- **FR-008**: System MUST utilize the LLM to justify the social implications of the Top-3 scenarios, referencing the dynamic resources and the governance knowledge base.
- **FR-009**: System MUST ensure that dynamically adding a new variable from the frontend does not break or interrupt the active SSE (Server-Sent Events) streaming connection or the genetic evolution process.

### Key Entities *(include if feature involves data)*

- **DynamicResource**: Represents any dynamically trackable variable. Contains `id` (string), `current_value` (float), `max_value` (float), `unit` (string), `type` (consumable/environmental), and `priority_weight` (float).
- **ScenarioTemplate**: A pre-defined collection of `DynamicResource` objects and parameters that simulate specific situations (e.g., "Tormenta de Polvo").

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: System successfully processes arrays of 2, 5, and 20 distinct resources and resolves the genetic algorithm in under 5 seconds per tick.
- **SC-002**: Frontend UI seamlessly renders dynamically passed resource elements (from 1 to 20 keys) without layout breakage, maintaining responsive design principles.
- **SC-003**: Injection of a new Scenario Template from the frontend maintains the active SSE connection without dropping it in 100% of tested cases.
- **SC-004**: LLM-generated explanations for the scenarios explicitly reference principles from the governance knowledge base for at least 95% of generated outputs.

## Assumptions

- The genetic algorithm engine (Python/FastAPI) has sufficient computational capacity to handle matrices of up to 20 dimensions within the desired response time.
- The existing Next.js frontend and SSE pipeline can be extended to support variable-sized arrays without requiring complete architectural rewrites of the network layer.
- OpenRouter LLM context window is large enough to contain the governance knowledge base alongside the dynamically sized resource payload.
