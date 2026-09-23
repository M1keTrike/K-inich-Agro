# Implementation Plan: Módulo de Entornos Dinámicos y Gobernanza Agnóstica

**Branch**: `004-dynamic-environments` | **Date**: 2026-09-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-dynamic-environments/spec.md`

## Summary

Refactor the static resource tracking system in K'inich-Agro into a 100% flexible, N-dimensional dynamic multivariable model using flat JSON configuration for scenario templates, a Python/FastAPI backend for differentiated mathematical genetic optimization, and a Next.js frontend for dynamic UI rendering. Additionally, it integrates a static Markdown governance knowledge base via OpenRouter for sociological justifications of the generated scenarios.

## Technical Context

**Language/Version**: Python 3.11+, TypeScript (Node 18+)

**Primary Dependencies**: FastAPI, Next.js, OpenRouter API SDK

**Storage**: Flat JSON files (Configuration only, no database required)

**Testing**: pytest (backend), jest/cypress (frontend QA)

**Target Platform**: Web application (Vercel for frontend, containerized FastAPI backend)

**Project Type**: Web Application

**Performance Goals**: < 5 seconds per tick for genetic algorithm, < 600ms SSE reconnection time

**Constraints**: Must support up to 20 variables, LLM cannot make unilateral decisions or perform math.

**Scale/Scope**: Simulation environments supporting complex multidimensional data.

## Constitution Check

*GATE: Passes successfully.*

- **Soberanía de la Asamblea**: Satisfied. The system generates scenarios (Top-3) based on math, LLM only justifies them based on context.
- **Cálculo Determinista Obligatorio**: Satisfied. Consumable and environmental variables are differentiated mathematically within the genetic engine, without LLM involvement.
- **Transparencia y Anti-Acaparamiento**: Satisfied. UI dynamically renders every key from the JSON payload ensuring nothing is hidden.
- **Infraestructura Ágil**: Satisfied. Frontend targets Next.js/Vercel deployment.
- **Arquitectura Orientada a APIs**: Satisfied. Uses flat JSON via APIs and SSE endpoints.

## Project Structure

### Documentation (this feature)

```text
specs/004-dynamic-environments/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── tasks.md (To be generated later)
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── api/
│   │   ├── sse.py (SSE streaming endpoints)
│   │   └── templates.py (Scenario injection endpoints)
│   ├── engine/
│   │   ├── genetic.py (N-dimensional algorithm)
│   │   └── fitness.py (Consumable vs Environmental math)
│   ├── config/
│   │   └── templates/ (Flat JSON scenario templates)
│   └── llm/
│       ├── context/
│       │   └── governance.md (Static knowledge base)
│       └── router.py (OpenRouter integration)
└── tests/
    └── test_genetic_engine.py

frontend/
├── src/
│   ├── components/
│   │   ├── StateIndicators.tsx
│   │   ├── ResourceProgressBar.tsx
│   │   ├── ScenarioCard.tsx
│   │   └── TemplateSelector.tsx
│   └── hooks/
│       └── useSimulationStream.ts (SSE hook)
└── tests/
    └── sse_reconnection.test.ts
```

**Structure Decision**: A separated Backend/Frontend architecture using Python FastAPI for heavy genetic computation and SSE streaming, and Next.js for a reactive dynamic UI. Configuration data (templates and context) is stored as flat files in the backend.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations detected.
