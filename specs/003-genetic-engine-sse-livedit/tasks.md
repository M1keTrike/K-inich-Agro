# Tasks: Motor Genético Real con Transparencia SSE y Edición en Vivo

**Feature**: 003-genetic-engine-sse-livedit
**Input**: Design documents from `specs/003-genetic-engine-sse-livedit/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure for the Python microservice.

- [x] T001 Create `motor_genetico/` directory and initial dependencies in `motor_genetico/requirements.txt`
- [x] T002 [P] Create FastAPI app skeleton and CORS middleware in `motor_genetico/main.py`
- [x] T003 [P] Create deployment configs in `motor_genetico/Procfile` and `motor_genetico/.env.example`
- [x] T004 Add `NEXT_PUBLIC_GENETIC_ENGINE_URL` configuration to the Next.js frontend

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core genetic algorithm logic and schemas that MUST be complete before the SSE stream can function.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T005 [P] Create Pydantic schemas (EvolutionParams, Individual, SSEPayload, etc.) in `motor_genetico/core/schemas.py`
- [x] T006 [P] Implement fitness evaluation and strict penalty logic in `motor_genetico/core/fitness.py`
- [x] T007 [P] Implement Pareto front calculation and archetype extraction in `motor_genetico/core/pareto.py`
- [x] T008 Implement genetic operators (selection, crossover, mutation, evolution loop) in `motor_genetico/core/genetic_algorithm.py`
- [x] T009 [P] Add unit tests for fitness logic in `motor_genetico/tests/test_fitness.py`
- [x] T010 [P] Add unit tests for Pareto logic in `motor_genetico/tests/test_pareto.py`

**Checkpoint**: Core genetic algorithm is ready. SSE streaming (User Story 1) can now be built on top of this.

---

## Phase 3: User Story 1 - Visualización del Proceso de Optimización (Priority: P1) 🎯 MVP

**Goal**: Mostrar en tiempo real cómo el sistema evoluciona hacia la mejor distribución de recursos mediante SSE.

**Independent Test**: Hit the `/api/evolution-stream` endpoint with defaults, and verify the ConvergenceChart animates in the UI without needing sliders.

### Tests for User Story 1

- [x] T011 [P] [US1] Create integration tests for SSE stream in `motor_genetico/tests/test_sse_stream.py`

### Implementation for User Story 1

- [x] T012 [P] [US1] Implement SSE endpoint logic in `motor_genetico/api/evolution_stream.py`
- [x] T013 [P] [US1] Define TypeScript interfaces (EvolutionEvent, ParetoScenario) in `src/types/index.ts`
- [x] T014 [US1] Create custom React hook `useEvolutionStream` in `src/lib/geneticEngineClient.ts`
- [x] T015 [P] [US1] Implement `ConvergenceChart` Recharts component in `src/components/GeneticEngine/ConvergenceChart.tsx`
- [x] T016 [P] [US1] Implement `EvolutionStatus` indicator component in `src/components/GeneticEngine/EvolutionStatus.tsx`
- [x] T016b [US1] Implementar manejo de errores de red, reintentos (max 3) y alerta de timeout (>30s sin respuesta) en `src/components/GeneticEngine/EvolutionStatus.tsx`
- [x] T017 [US1] Integrate SSE hook and chart components into the dashboard view in `src/app/page.tsx`

**Checkpoint**: At this point, the streaming visualization works with default weights.

---

## Phase 4: User Story 2 - Ajuste de Prioridades en Vivo (Priority: P2)

**Goal**: Permitir a la asamblea modificar los pesos de optimización en vivo sin recargar la sesión.

**Independent Test**: Move a slider and verify the SSE connection restarts instantly and the chart resets visually.

### Implementation for User Story 2

- [x] T018 [P] [US2] Implement `WeightSliders` UI component in `src/components/GeneticEngine/WeightSliders.tsx`
- [x] T019 [US2] Add debounce logic to trigger reconnections in `src/lib/geneticEngineClient.ts`
- [x] T020 [US2] Integrate `WeightSliders` and pass parameters to the stream hook in `src/app/page.tsx`

**Checkpoint**: Live interactive editing of optimization weights is fully functional.

---

## Phase 5: User Story 3 - Presentación del Top-3 de Escenarios (Priority: P3)

**Goal**: Presentar los arquetipos finales del Frente de Pareto para que la asamblea vote.

**Independent Test**: The dashboard renders the Top-3 scenarios when the evolution stream finishes or yields valid results.

### Implementation for User Story 3

- [x] T021 [P] [US3] Adapt the existing `ScenarioCard` to receive a `ParetoScenario` in `src/components/ScenarioComparator/ScenarioCard.tsx`
- [x] T022 [US3] Add rendering logic for the 3 scenarios and wire up the selection to `/api/vote` in `src/app/page.tsx`
- [x] T022b [US3] Agregar UI de fallback en `src/app/page.tsx` para mostrar la advertencia "Las restricciones actuales limitan las alternativas disponibles" cuando lleguen escenarios marcados como "unavailable".

**Checkpoint**: All user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and system stability.

- [x] T023 [P] Create the REST and SSE Postman collection in `postman/kinich-agro-genetic-engine.json`
- [x] T024 [P] Implement load testing script for 10+ concurrent SSE connections in `motor_genetico/tests/test_load_sse.py`
- [x] T024b [P] Implementar script de benchmark automatizado en `motor_genetico/tests/test_benchmark.py` para validar que SC-004 (200 generaciones x 100 ind < 10s) se cumple.
- [x] T025 Run validation scenarios defined in `specs/003-genetic-engine-sse-livedit/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User Story 1 (P1) is the MVP and must be completed first for end-to-end functionality.
  - User Story 2 and 3 depend on User Story 1's SSE infrastructure in the frontend.

### Parallel Opportunities

- Pydantic schemas, fitness functions, and Pareto calculations in Phase 2 can be developed and unit-tested in parallel.
- The Python SSE endpoint (T012) and the TypeScript models/hooks (T013, T014, T015) can be developed concurrently in Phase 3.
- React components (`WeightSliders`, `ScenarioCard`) can be built in parallel.
