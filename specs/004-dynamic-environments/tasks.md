---
description: "Task list template for feature implementation"
---

# Tasks: Módulo de Entornos Dinámicos y Gobernanza Agnóstica

**Input**: Design documents from `/specs/004-dynamic-environments/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Crear estructura de directorios base según el plan en `backend/app/config/templates/` y `backend/app/llm/context/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

- [x] T002 Implementar modelos de datos base `DynamicResource` y `ScenarioTemplate` en `backend/app/models/resources.py`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Simulación de Escenarios Multivariables (Priority: P1) 🎯 MVP

**Goal**: Permitir inyección de plantillas de escenarios dinámicos mediante JSON plano.

**Independent Test**: Lanzar una plantilla plana y confirmar respuesta `200 OK` en el API de inyección sin persistencia.

### Implementation for User Story 1

- [x] T003 [P] [US1] Creación del directorio de plantillas JSON y archivos base (ej. `dust_storm_01.json`) en `backend/app/config/templates/`.
  - **Fase Correspondiente**: Fase 1 (Estructura de Datos)
  - **Archivos a Modificar/Crear**: `backend/app/config/templates/dust_storm_01.json`, `backend/app/config/templates/default_scenario.json`
  - **Dependencias**: T001
  - **Criterios de Aceptación Técnicos**: Los archivos JSON existen, validan contra el esquema `ScenarioTemplate` y contienen un array de recursos válidos.
- [x] T004 [US1] Lógica de carga (Flat JSON) y endpoint `POST /api/scenarios/inject` en `backend/app/api/templates.py` y `backend/app/services/template_service.py`
  - **Fase Correspondiente**: Fase 1 (Estructura de Datos)
  - **Archivos a Modificar/Crear**: `backend/app/api/templates.py`, `backend/app/services/template_service.py`
  - **Dependencias**: T002, T003
  - **Criterios de Aceptación Técnicos**: El endpoint lee el archivo flat JSON y reemplaza el estado en memoria de la simulación devolviendo un 200 OK.

**Checkpoint**: User Story 1 fully functional.

---

## Phase 4: User Story 2 - Cálculo de Supervivencia N-Dimensional (Priority: P1)

**Goal**: Motor genético lee N dimensiones y optimiza según `type`.

**Independent Test**: Enviar array de N longitudes al motor y asegurar devolución matemática de Top-3.

### Implementation for User Story 2

- [x] T005 [P] [US2] Refactorización del motor genético en FastAPI para calcular el fitness diferenciando entre recursos `consumable` (minimizar) y `environmental` (restricciones de contorno).
  - **Fase Correspondiente**: Fase 2 (Motor Genético N-Dimensional)
  - **Archivos a Modificar/Crear**: `backend/app/engine/genetic.py`, `backend/app/engine/fitness.py`
  - **Dependencias**: T002
  - **Criterios de Aceptación Técnicos**: La función de aptitud itera un array dinámico de longitud variable. Si es `consumable`, la métrica se minimiza. Si es `environmental`, individuos fuera de los rangos min/max se descartan.
- [x] T006 [US2] Adaptación del endpoint de streaming SSE para emitir el payload dinámico en `backend/app/api/sse.py`.
  - **Fase Correspondiente**: Fase 2 (Motor Genético N-Dimensional)
  - **Archivos a Modificar/Crear**: `backend/app/api/sse.py`
  - **Dependencias**: T005
  - **Criterios de Aceptación Técnicos**: El endpoint emite correctamente la estructura JSON especificada en el API Contract sin interrupciones durante las transiciones de estado.

**Checkpoint**: User Stories 1 AND 2 working independently.

---

## Phase 5: User Story 3 - Panel Interactivo Multivariable (Priority: P2)

**Goal**: Renderizado 100% dinámico en el Frontend.

**Independent Test**: Verificar barras de progreso en Next.js para un payload mockeado de 5 recursos.

### Implementation for User Story 3

- [x] T007 [P] [US3] Modificación de los componentes de Next.js (StateIndicators, ResourceProgressBar, ScenarioCard) para iterar y mapear visualmente un array dinámico sin hardcodear llaves.
  - **Fase Correspondiente**: Fase 3 (Frontend Dinámico y UI)
  - **Archivos a Modificar/Crear**: `frontend/src/components/StateIndicators.tsx`, `frontend/src/components/ResourceProgressBar.tsx`, `frontend/src/components/ScenarioCard.tsx`
  - **Dependencias**: T006
  - **Criterios de Aceptación Técnicos**: Los componentes usan un `.map()` iterando sobre las llaves del payload SSE. No debe haber variables "water" o "energy" hardcodeadas.
- [x] T008 [US3] Construcción del selector visual de 'Plantillas de Escenario' en `frontend/src/components/TemplateSelector.tsx`.
  - **Fase Correspondiente**: Fase 3 (Frontend Dinámico y UI)
  - **Archivos a Modificar/Crear**: `frontend/src/components/TemplateSelector.tsx`, `frontend/src/hooks/useSimulationStream.ts`
  - **Dependencias**: T004, T007
  - **Criterios de Aceptación Técnicos**: La UI lista las plantillas disponibles, efectúa un POST hacia `/api/scenarios/inject`, e informa al usuario sobre la reinicialización exitosa.

---

## Phase 6: User Story 4 - Análisis Contextual de Gobernanza (Priority: P2)

**Goal**: Explicaciones sociológicas a través del LLM utilizando la base de conocimiento estática.

**Independent Test**: Validar que la respuesta del LLM mencione explícitamente contenido de la base de conocimientos.

### Implementation for User Story 4

- [x] T009 [P] [US4] Creación del documento estático de Gobernanza (Markdown) y su inyección en el system prompt del cliente de OpenRouter.
  - **Fase Correspondiente**: Fase 4 (Inyección de Gobernanza Estática)
  - **Archivos a Modificar/Crear**: `backend/app/llm/context/governance.md`, `backend/app/llm/router.py`
  - **Dependencias**: T001
  - **Criterios de Aceptación Técnicos**: El archivo Markdown existe (ej. principios de Ostrom). El cliente lee el archivo y lo adjunta de forma íntegra al mensaje `system` antes de cada petición de análisis hacia OpenRouter.

**Checkpoint**: All user stories should now be independently functional.

---

## Phase 7: Polish & QA (Aseguramiento de Calidad y Límites)

**Purpose**: Pruebas de estrés y de red, cruces entre historias.

- [x] T010 [P] Pruebas de estrés matemático para confirmar que el motor soporta hasta 20 dimensiones sin romper el flujo de evolución.
  - **Fase Correspondiente**: Fase 5 (QA)
  - **Archivos a Modificar/Crear**: `backend/tests/test_genetic_engine.py`
  - **Dependencias**: T005
  - **Criterios de Aceptación Técnicos**: Un script de test en pytest genera 20 recursos aleatorios y el motor genético termina el ciclo de optimización en menos de 5.0 segundos.
- [x] T011 [P] Pruebas de latencia y reconexión del flujo SSE (< 600 ms) al cambiar de plantilla desde la UI.
  - **Fase Correspondiente**: Fase 5 (QA)
  - **Archivos a Modificar/Crear**: `frontend/tests/sse_reconnection.test.ts` (cypress o jest)
  - **Dependencias**: T006, T008
  - **Criterios de Aceptación Técnicos**: Durante la inyección de una plantilla en la UI, el hook de SSE mantiene la conexión y las actualizaciones se reanudan en un intervalo no superior a 600 ms tras el POST inicial.
- [x] T012 [P] Evaluación heurística o unitaria del output del LLM para el SC-004.
  - **Fase Correspondiente**: Fase 5 (QA)
  - **Archivos a Modificar/Crear**: `backend/tests/test_llm_output.py`
  - **Dependencias**: T009
  - **Criterios de Aceptación Técnicos**: Implementar un script de QA en pytest que evalúe 10 respuestas generadas por el LLM y compruebe (mediante regex o una llamada a otro LLM evaluador) que los principios de la base de conocimiento sean citados explícitamente en al menos el 95% de los casos.
- [x] T013 [P] Pruebas visuales de UI (Layout Stress) para el SC-002 con 20 dimensiones.
  - **Fase Correspondiente**: Fase 5 (QA)
  - **Archivos a Modificar/Crear**: `frontend/tests/ui_layout_stress.test.ts`
  - **Dependencias**: T007
  - **Criterios de Aceptación Técnicos**: Un test de Cypress/Jest simula la recepción de un SSE payload con 20 variables y valida que el DOM renderice 20 barras de progreso sin errores de desbordamiento (overflow) o superposición de componentes.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational
- **User Story 2 (P1)**: Can start after Foundational
- **User Story 3 (P2)**: Depends heavily on US2 (SSE structure)
- **User Story 4 (P2)**: Independent functionality, integrates at the end.

### Parallel Opportunities

- T003 (JSON config) and T005 (Genetic Engine) can run in parallel.
- T009 (Markdown generation) can run immediately.
- Frontend work (T007) requires the backend payload schema (T006), making them sequential.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 and 2
2. Complete Phase 3 (Template Injection endpoint)
3. **STOP and VALIDATE**: Test backend response manually via cURL

### Incremental Delivery

1. Implement MVP (JSON Injection)
2. Implement N-Dimensional Engine and hook it to SSE.
3. Update UI to map dimensions from SSE dynamically.
4. Add OpenRouter prompt generation.
5. Polish with stress tests.
