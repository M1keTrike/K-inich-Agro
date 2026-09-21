# Tasks: dashboard-ui-upgrade

**Input**: Design documents from `/specs/002-dashboard-ui-upgrade/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create project structure for `src/components/dashboard/` and `src/components/ui/`
- [x] T002 Install `lucide-react` dependency in `package.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Create skeleton component files (`DashboardLayout.tsx`, `ScenarioCard.tsx`, `AlertBanner.tsx`, `StatePill.tsx`, `ResourceProgressBar.tsx`) in `src/components/dashboard/`
- [x] T004 Create skeleton component file `Button.tsx` in `src/components/ui/`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - View Corporate Light Theme (Priority: P1) 🎯 MVP

**Goal**: As a dashboard user, I want to view the platform in a clean, light corporate theme.

**Independent Test**: Can be independently tested by rendering the main dashboard and verifying the global background is light gray, and containers are pure white with subtle borders and shadows.

### Implementation for User Story 1

- [x] T005 [P] [US1] Implement `src/app/page.tsx` (DashboardLayout) with light gray background (`bg-slate-50`)
- [x] T006 [P] [US1] Implement `src/components/Dashboard/StateIndicators.tsx` and `CrisisPanel/CrisisForm.tsx` base containers with pure white background (`bg-white`), subtle borders (`border-gray-200`), and soft shadows (`shadow-sm`)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Clear State Indicators and Banners (Priority: P1)

**Goal**: As a dashboard user, I want to see professional alert banners and `StatePill`-style status indicators.

**Independent Test**: Can be tested by triggering a crisis state and verifying the banner appears, and checking that survival states display as pill labels.

### Implementation for User Story 2

- [x] T007 [P] [US2] Implement `src/components/ui/StatePill.tsx` with semantic background and text colors based on status
- [x] T008 [P] [US2] Implement `src/components/ui/AlertBanner.tsx` with pastel backgrounds and text truncation with ellipsis on hover for long descriptions
- [x] T009 [US2] Update `src/app/page.tsx` to render multiple `AlertBanner` components vertically stacked at the top
- [x] T010 [US2] Update `src/components/Dashboard/StateIndicators.tsx` to render the overall status using the `StatePill` component

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Progress Bars for Resource Levels (Priority: P2)

**Goal**: As a dashboard user, I want to see resource levels represented by clean progress bars instead of static text percentages.

**Independent Test**: Can be tested by viewing scenario cards and verifying that resource levels render as progress bars with semantic colors.

### Implementation for User Story 3

- [x] T011 [P] [US3] Implement `src/components/ui/ResourceProgressBar.tsx` using inline widths for progress and semantic Tailwind background colors (e.g. `bg-green-500`, `bg-red-500`)
- [x] T012 [US3] Update `src/components/ScenarioComparator/ScenarioCard.tsx` to use `ResourceProgressBar` components for Water and Energy levels

**Checkpoint**: All user stories up to US3 should now be independently functional

---

## Phase 6: User Story 4 - Minimalist Iconography and Typography (Priority: P2)

**Goal**: As a dashboard user, I want to see clean SVG icons and professional typography.

**Independent Test**: Can be tested by checking resource icons (Water, Energy, Biomass) and verifying text styling (headers and buttons).

### Implementation for User Story 4

- [x] T013 [P] [US4] Implement `src/components/ui/Button.tsx` with corporate blue background (`bg-blue-600`, hover `bg-blue-700`) and rounded corners (`rounded-md`)
- [x] T014 [P] [US4] Update `src/components/ui/ResourceProgressBar.tsx` to use `lucide-react` SVG icons instead of emojis
- [x] T015 [US4] Update typography styles in `src/components/ScenarioComparator/ScenarioCard.tsx`, `ScenarioList.tsx`, `CrisisForm.tsx`, and `page.tsx` to use clean sans-serif and Sentence Case for headings
- [x] T016 [US4] Update `src/components/ScenarioComparator/ScenarioCard.tsx` to use the new `Button` component for primary actions

**Checkpoint**: All user stories should now be independently functional

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T017 [P] Run quickstart.md validation manually to verify component rendering and light mode accessibility compliance
- [x] T018 [P] Audit and remove all legacy neon/sci-fi CSS animation classes (e.g., `animate-pulse`, custom keyframes) and dark-mode global styles from the codebase (check `src/styles/`, `globals.css`, and any component-level `className` strings)
- [x] T019 [P] Remove any now-unused emoji icon dependencies or packages from `package.json` after confirming all emoji references have been replaced with `lucide-react` SVG icons

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed sequentially in priority order (P1 → P2 → P3) or in parallel if isolated appropriately.
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### Parallel Opportunities

- T005 and T006 can run in parallel since they touch different files (`DashboardLayout.tsx` and `ScenarioCard.tsx`).
- T007 and T008 can run in parallel.
- T013 and T014 can run in parallel.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add User Story 4 → Test independently → Deploy/Demo
