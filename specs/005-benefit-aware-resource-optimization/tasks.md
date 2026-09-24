# Tareas: Optimización basada en consumo y beneficios

**Input**: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`  
**Prerrequisitos**: documentos de diseño completos.

## Fase 1: Preparación

- [X] T001 Formalizar escenarios, requisitos y criterios en `specs/005-benefit-aware-resource-optimization/spec.md`.
- [X] T002 Documentar decisiones, entidades, contratos y validación rápida bajo `specs/005-benefit-aware-resource-optimization/`.

## Fase 2: Base del motor

- [X] T003 Extender outputs, valoraciones, periodos, escenario Pareto y payload SSE en `motor_genetico/core/schemas.py`.
- [X] T004 Validar recursos, valoraciones, reservas y ciclos con errores clasificados en `motor_genetico/core/dependencies.py`.
- [X] T005 Distribuir preferencias sobre inventario de cada periodo en `motor_genetico/core/genetic_algorithm.py`.

## Fase 3: Historia 1 — cadenas temporales válidas (P1)

**Prueba independiente**: una planta produce energía para un cultivo en el periodo siguiente; el ciclo se rechaza en activación.

- [X] T006 [US1] Simular inventario, outputs diferidos, reservas y capacidad en `motor_genetico/core/simulation.py`.
- [X] T007 [US1] Validar grafo y reservas en `motor_genetico/tests/test_dependencies.py`.
- [X] T008 [US1] Verificar eficiencia, periodo de llegada y déficit por horizonte en `motor_genetico/tests/test_simulation.py`.
- [X] T009 [US1] Rechazar ciclo en activación antes del stream en `motor_genetico/tests/test_benefit_api.py`.

## Fase 4: Historia 2 — beneficios, déficit y Pareto (P1)

**Prueba independiente**: solo candidatos factibles aparecen en el frente aplicable; excedente no cubre utilidad adicional.

- [X] T010 [US2] Añadir penalización de demanda/consumo y restricciones duras a `motor_genetico/core/fitness.py`.
- [X] T011 [US2] Extraer alternativas factibles y métricas de cada escenario en `motor_genetico/core/pareto.py`.
- [X] T012 [US2] Emitir métricas temporales compatibles en `motor_genetico/api/evolution_stream.py`.
- [X] T013 [US2] Verificar valoración global de preferencias en `motor_genetico/tests/test_simulation.py`.

## Fase 5: Historia 3 — edición y explicación en UI (P2)

**Prueba independiente**: editar output y valoración; el payload se conserva y las soluciones explican producción, demanda y reserva.

- [X] T014 [US3] Sincronizar tipos y campos opcionales con el backend en `src/types/index.ts`.
- [X] T015 [US3] Editar outputs, eficiencia, límite y retraso en `src/components/GeneticEngine/DynamicControls.tsx`.
- [X] T016 [US3] Configurar valor, demanda, reserva, almacenamiento y horizonte en `src/components/GeneticEngine/BenefitSettings.tsx`.
- [X] T017 [US3] Mostrar métricas locales, temporales y globales e impedir aplicar soluciones inválidas en `src/app/page.tsx`.
- [X] T018 [US3] Verificar compilación TypeScript en `tsconfig.json` y el árbol en `src/components/ui/PreziViewer.tsx`.

## Fase 6: Historia 4 — recorrido global (P2)

**Prueba independiente**: combinar preferencias locales y comparar la rama con puntuación recalculada sobre el árbol entero.

- [X] T019 [US4] Reevaluar preferencias globales y devolver detalle por periodo en `motor_genetico/core/fitness.py`.
- [X] T020 [US4] Exponer `POST /scenarios/evaluate` con validación y errores 422 en `motor_genetico/api/evolution_stream.py`.
- [X] T021 [US4] Recalcular beam, filtrar soluciones no aplicables y presentar métricas en `src/app/page.tsx`.
- [X] T022 [US4] Cubrir contratos de evaluación y rechazo de ciclos/preferencias en `motor_genetico/tests/test_benefit_api.py`.

## Fase 7: Pulido transversal

- [X] T023 [P] Documentar esquema de template, SSE y endpoint de evaluación en `specs/005-benefit-aware-resource-optimization/contracts/`.
- [X] T024 [P] Documentar datos y ejecución end-to-end en `specs/005-benefit-aware-resource-optimization/data-model.md` y `quickstart.md`.
- [X] T025 Mostrar alternativas globales disponibles sin duplicar escenarios en `src/app/page.tsx`.
- [X] T026 Verificar pruebas focalizadas y tipos TypeScript antes de cerrar la feature.

## Dependencias y ejecución

- T001–T005 son cimientos compartidos.
- US1 valida el simulador y grafo; US2 depende de esa semántica temporal.
- US3 depende de los contratos de US1/US2.
- US4 usa el endpoint global y las preferencias de escenarios de US2; interfaz US3 muestra el desglose.
- Oportunidades paralelas: T007/T008 (archivos de prueba separados), T014/T015/T016 (tipos/UI separados tras acordar contrato), T023/T024 (documentación).
- Estrategia MVP: US1 y US2 primero; US3 y US4 completan la experiencia y la comparación global.

## Estado final

Todas las tareas están marcadas completas. Las pruebas focalizadas y TypeScript se ejecutaron; `quickstart.md` describe la validación manual de SSE y UI.
