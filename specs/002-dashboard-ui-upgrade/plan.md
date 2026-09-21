# Implementation Plan: dashboard-ui-upgrade

**Branch**: `[002-dashboard-ui-upgrade]` | **Date**: 2026-09-20 | **Spec**: [spec.md](../spec.md)

**Input**: Feature specification from `/specs/002-dashboard-ui-upgrade/spec.md`

## Summary

Migrate the K'inich-Gov Dashboard from a dark "Sci-Fi" neon aesthetic to a clean, accessible corporate light theme inspired by Atlassian tools. This involves refactoring React components (cards, banners, progress bars) with Tailwind CSS and Lucide-React icons, without modifying the underlying backend data model.

## Technical Context

**Language/Version**: TypeScript / JavaScript (React)

**Primary Dependencies**: React, Tailwind CSS, Lucide-React

**Storage**: N/A (Frontend only, backend data model unchanged)

**Testing**: React Testing Library / Jest (or equivalent standard frontend testing framework in the project)

**Target Platform**: Web Browser

**Project Type**: Frontend Web Application

**Performance Goals**: Smooth rendering of dynamic progress bars; no layout shifts when long text banners appear.

**Constraints**: Must strictly adhere to accessible color contrast ratios for light mode themes.

**Scale/Scope**: Refactoring the core dashboard view and its child components (Scenario Cards, Alert Banners, Status Pills, Progress Bars).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Soberanía de la Asamblea (La IA no decide)**: PASS - The redesign improves the clarity of survival scenarios via progress bars and state pills, facilitating better human decision-making without automating it.
- **Cálculo Determinista Obligatorio**: PASS - No changes to the backend deterministic calculations.
- **Transparencia y Anti-Acaparamiento**: PASS - Transitioning to a corporate light theme with explicit alert banners and clear iconography democratizes access to information by making the UI more legible and less distracting (removing neon animations).
- **Infraestructura Ágil y Despliegue Continuo**: PASS - Changes are strictly standard React/Tailwind frontend code, ensuring seamless Vercel deployments.
- **Arquitectura Orientada a APIs y Flujos**: PASS - The new UI components (ScenarioCard, AlertBanner, StatePill) will be strictly presentational (modular) and receive their state via props from the existing data flow.

## Project Structure

### Documentation (this feature)

```text
specs/002-dashboard-ui-upgrade/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (future)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── dashboard/
│   │   ├── DashboardLayout.tsx
│   │   ├── ScenarioCard.tsx
│   │   ├── AlertBanner.tsx
│   │   ├── StatePill.tsx
│   │   └── ResourceProgressBar.tsx
│   └── ui/
│       └── Button.tsx
└── pages/
    └── index.tsx (or Dashboard page entry)
```

**Structure Decision**: A standard React component folder structure for the frontend, isolating the new presentational components in a `dashboard` feature folder to keep the architecture modular and maintainable.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

*No violations detected. Redesign simplifies UI and removes complex animations.*
