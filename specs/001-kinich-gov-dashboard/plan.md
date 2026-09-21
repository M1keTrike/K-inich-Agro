# Implementation Plan: kinich-gov-dashboard-mvp

**Branch**: `001-kinich-gov-dashboard` | **Date**: 2026-09-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-kinich-gov-dashboard/spec.md`

## Summary

Desarrollo del MVP para K'inich-Agro, un tablero interactivo (dashboard) enfocado en la gobernanza comunitaria y la toma de decisiones críticas frente a crisis de recursos (agua, energía, biomasa). El sistema pausará el estado en tiempo real durante una crisis, consultará un motor matemático determinista (mock local) para obtener el Top 3 de escenarios de supervivencia, y utilizará un LLM vía OpenRouter para explicar estos escenarios a la asamblea en lenguaje natural. Se optimiza para despliegue continuo en Vercel.

## Technical Context

**Language/Version**: TypeScript / Node.js (Next.js App Router recomendado por compatibilidad Vercel y unificación de APIs y Frontend)

**Primary Dependencies**: Next.js, TailwindCSS, OpenRouter API (Fetch)

**Storage**: In-memory (Mock) para el MVP

**Testing**: Postman Collection (para APIs), tests manuales de UI

**Target Platform**: Vercel (Web Dashboard)

**Project Type**: Web Application (Monorepo con Backend API Routes y Frontend React)

**Performance Goals**: < 10 segundos de tiempo de respuesta total para la generación del LLM

**Constraints**: El cálculo de escenarios MUST ser determinista (código, no IA), la IA solo explica.

**Scale/Scope**: MVP para demostración de asamblea (única pantalla proyectada, sin auth de usuarios individuales)

## Constitution Check

*GATE: Passed*

- **Soberanía de la Asamblea**: El sistema no toma la decisión; el usuario (moderador) debe pulsar "Aplicar Escenario".
- **Cálculo Determinista Obligatorio**: Motor matemático definido como endpoint/lógica separada; LLM confinado a tareas de traducción a lenguaje natural.
- **Transparencia y Anti-Acaparamiento**: Frontend claro con visualización comparativa (Top 3) y estados base.
- **Infraestructura Ágil y Despliegue Continuo**: GitHub configurado y despliegue en Vercel.
- **Arquitectura Orientada a APIs y Flujos**: APIs JSON definidas (`/api/crisis`, `/api/scenarios`), probadas con Postman.

## Project Structure

### Documentation (this feature)

```text
specs/001-kinich-gov-dashboard/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (to be generated)
```

### Source Code (repository root)

```text
# Monorepo con Next.js (Backend y Frontend unificados para despliegue ágil en Vercel)
src/
├── app/
│   ├── api/
│   │   ├── crisis/
│   │   │   └── route.ts       # Endpoint para inyectar crisis
│   │   └── scenarios/
│   │       └── route.ts       # Endpoint para procesar escenarios y llamar a OpenRouter
│   ├── page.tsx               # Dashboard Principal
│   └── layout.tsx
├── components/
│   ├── Dashboard/             # Indicadores de soporte vital (agua, energía, biomasa)
│   ├── CrisisPanel/           # Panel de inyección de crisis
│   └── ScenarioComparator/    # Tarjetas Top 3 con explicaciones LLM y botón de votar
├── lib/
│   ├── mathEngine.ts          # Motor matemático determinista (Mock para MVP)
│   └── openRouter.ts          # Cliente de OpenRouter
└── types/
    └── index.ts               # Esquemas e interfaces (Crisis, Scenario, Vote)

postman/
└── kinich_agro_collection.json # Colección exportable
```

**Structure Decision**: Se elige un monorepo basado en Next.js (App Router). Esto permite separar claramente el entorno de backend (en `src/app/api` y `src/lib/mathEngine.ts`) del frontend (en `src/app/page.tsx` y `src/components`), manteniendo una estructura unificada y optimizada para despliegue sin fricciones en Vercel.

## Fases de Desarrollo (Hoja de Ruta MVP)

**Fase 1: Configuración Base y Control de Versiones**
- Inicialización del monorepositorio en GitHub (Next.js con TypeScript).
- Creación de la estructura de carpetas `src/app/api` (Backend) y `src/components` (Frontend).

**Fase 2: Motor Backend y Lógica Determinista**
- Desarrollo de esquemas/tipos en `src/types/index.ts`.
- Creación de endpoints `/api/crisis` y `/api/scenarios`.
- Implementación de `src/lib/mathEngine.ts` (Mock determinista).
- Integración de `src/lib/openRouter.ts` para lenguaje natural.
- Generación de la colección de Postman en `/postman`.

**Fase 3: Frontend (Dashboard K'inich-Gov)**
- Construcción de `Dashboard` (indicadores base).
- Construcción de `CrisisPanel`.
- Construcción de `ScenarioComparator` y módulo de votación (botón "Aplicar Escenario").

**Fase 4: Pruebas y Aseguramiento de Calidad (QA)**
- Pruebas del Motor Determinista: Verificación de los límites matemáticos del algoritmo.
  - Criterio de Aceptación: Al inyectar una crisis del 40%, el motor debe devolver siempre exactamente 3 escenarios viables en el JSON, sin valores negativos y respetando el mínimo de supervivencia.
- Pruebas de Aislamiento de IA (Anti-Alucinaciones): Validación del flujo de datos con OpenRouter.
  - Criterio de Aceptación: El LLM debe generar la explicación en texto basándose únicamente en los números del JSON provisto por el backend. Si el LLM altera un solo dato matemático en su respuesta, la prueba falla.
- Pruebas de Integración (Postman): Ejecución automatizada de los flujos de comunicación.
  - Criterio de Aceptación: La colección de Postman debe ejecutarse de principio a fin validando que los endpoints de crisis y escenarios respondan correctamente (HTTP 200) y devuelvan la estructura de datos exigida.
- Pruebas de Interfaz (Tablero K'inich-Gov): Simulacro visual de la asamblea.
  - Criterio de Aceptación: El panel debe reflejar el impacto de la crisis en los indicadores gráficos y actualizar el estado general del sistema únicamente después de que el módulo de votación registre una mayoría para un escenario.

**Fase 5: Despliegue e Integración Continua**
- Configuración de `vercel.json` y variables de entorno (`OPENROUTER_API_KEY`).
- Preparación de webhooks (estructura base en API para futuras automatizaciones).

## Complexity Tracking

*No violations.*
