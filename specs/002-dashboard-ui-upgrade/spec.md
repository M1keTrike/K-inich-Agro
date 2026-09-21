# Feature Specification: dashboard-ui-upgrade

**Feature Branch**: `[002-dashboard-ui-upgrade]`

**Created**: 2026-09-20

**Status**: Draft

**Input**: User description: "Crea una nueva especificación técnica para rediseñar la experiencia visual del Dashboard de K'inich-Gov (UI Enterprise Upgrade). El objetivo es adoptar una estética corporativa, limpia y accesible, inspirada estrictamente en el ecosistema de Atlassian (Jira/Confluence), alejándonos del típico estilo oscuro "Sci-Fi" o neón. Los requerimientos principales son: Migración a Light Theme Corporativo, Indicadores de Estado y Banners, Barras de Progreso Limpias, Iconografía Minimalista, Tipografía y Botones. No afectaremos el modelo de datos backend."

## Clarifications

### Session 2026-09-20

- Q: How should multiple simultaneous crises be displayed in the dashboard? → A: Stack multiple banners vertically at the top of the dashboard.
- Q: How should extremely long text in crisis alert banners be handled to prevent layout breaking? → A: Truncate the text with an ellipsis (...) and show the full text on hover.
- Q: Which minimalist SVG icon library should be used as the standard for replacing emojis? → A: Lucide-React.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Corporate Light Theme (Priority: P1)

As a dashboard user, I want to view the platform in a clean, light corporate theme so that the information is easily readable and accessible in a professional environment.

**Why this priority**: The foundational visual change that enables all other redesign elements to sit cohesively on the interface.

**Independent Test**: Can be independently tested by rendering the main dashboard and verifying the global background is light gray, and containers are pure white with subtle borders and shadows.

**Acceptance Scenarios**:

1. **Given** a user navigates to the dashboard, **When** the page loads, **Then** the global background is light gray.
2. **Given** a data card or panel is displayed, **When** rendered, **Then** it has a white background, subtle borders, and soft shadows.

---

### User Story 2 - Clear State Indicators and Banners (Priority: P1)

As a dashboard user, I want to see professional alert banners and `StatePill`-style status indicators so that I can quickly assess crisis levels and survival states without distracting animations.

**Why this priority**: Replaces the old neon-pulse animations with a more accessible and clear way to communicate critical information, which is vital for decision-making.

**Independent Test**: Can be tested by triggering a crisis state and verifying the banner appears, and checking that survival states display as pill labels.

**Acceptance Scenarios**:

1. **Given** the system enters a crisis state, **When** the dashboard updates, **Then** a professional alert banner appears with a pastel background, dark text, and side borders.
2. **Given** a scenario with a "Stable" survival state, **When** viewed on the dashboard, **Then** the state is displayed as a pill label (e.g., light green background with dark green text).
3. **Given** multiple active crisis states, **When** the dashboard updates, **Then** all active crisis banners stack vertically at the top of the dashboard.
4. **Given** an alert banner with extremely long text, **When** rendered, **Then** the text truncates with an ellipsis (...) and shows the full text only on hover.

---

### User Story 3 - Progress Bars for Resource Levels (Priority: P2)

As a dashboard user, I want to see resource levels represented by clean progress bars instead of static text percentages so that I can visually gauge survival levels at a glance.

**Why this priority**: Improves data visualization and cognitive load for the users.

**Independent Test**: Can be tested by viewing scenario cards and verifying that resource levels render as progress bars with semantic colors.

**Acceptance Scenarios**:

1. **Given** a scenario with resource levels, **When** the scenario card is rendered, **Then** the resources are represented by thin progress bars.
2. **Given** a progress bar for a resource, **When** the level changes from stable to critical, **Then** the fill color changes semantically (e.g., from green to red).

---

### User Story 4 - Minimalist Iconography and Typography (Priority: P2)

As a dashboard user, I want to see clean SVG icons and professional typography so that the interface feels modern and aligns with corporate standards.

**Why this priority**: Finalizes the professional polish of the UI, replacing informal emojis and aggressive text styling.

**Independent Test**: Can be tested by checking resource icons (Water, Energy, Biomass) and verifying text styling (headers and buttons).

**Acceptance Scenarios**:

1. **Given** resource labels (Water, Energy, Biomass), **When** they are rendered, **Then** they are accompanied by clean SVG icons in a slate gray tone instead of emojis.
2. **Given** dashboard headers and buttons, **When** rendered, **Then** headers use clean sans-serif typography with Title/Sentence Case, and buttons use a corporate blue color with rounded corners.

### Edge Cases

- What happens when a progress bar value is 0% or 100%? (Ensure border-radius and colors render correctly).
- When alert banners contain extremely long text, the text MUST be truncated with an ellipsis (...) and the full text revealed on hover.
- When multiple crises occur simultaneously, their banners MUST stack vertically at the top of the dashboard.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST render the global background using a light gray color palette (e.g., bg-slate-50).
- **FR-002**: System MUST render all cards, panels, and containers with a pure white background (bg-white), subtle borders (border-gray-200), and soft shadows (shadow-sm).
- **FR-003**: System MUST NOT display any neon pulse animations for state indicators.
- **FR-004**: System MUST display crisis alerts using professional banners with pastel backgrounds (e.g., orange/red pastel), dark text, and side borders.
- **FR-005**: System MUST display survival states using pill-style labels with semantic background and text colors.
- **FR-006**: System MUST represent scenario resource levels using thin progress bars instead of static text percentages.
- **FR-007**: System MUST color progress bars semantically based on the resource or survival level (e.g., green, yellow, red).
- **FR-008**: System MUST replace all emoji icons for Water, Energy, and Biomass with minimalist SVG icons from the Lucide-React library in a slate gray tone (text-slate-500).
- **FR-009**: System MUST use clean sans-serif typography with Title Case or Sentence Case for all headings.
- **FR-010**: System MUST render primary action buttons with a corporate blue background (bg-blue-600, hover bg-blue-700) and rounded corners (rounded-md).

### Key Entities

- **Scenario Card Component**: UI component representing a survival scenario, containing progress bars, state pills, and icons.
- **Alert Banner Component**: UI component representing a crisis alert.
- **StatePill Component**: UI component representing the status of a system or scenario.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of the specified dashboard components (cards, banners, progress bars) are updated to the new light corporate theme.
- **SC-002**: 0% of the previous neon pulse animations or emoji icons remain in the dashboard view.
- **SC-003**: The redesign introduces 0 breaking changes to the underlying data models (Crisis and Scenario structures).
- **SC-004**: Visual accessibility improves, ensuring all text and interactive elements meet standard contrast ratios for light themes.

## Assumptions

- No changes will be made to the backend data structures; the feature is strictly a frontend UI refactor using React and Tailwind CSS.
- The Lucide-React icon library will be integrated for the minimalist SVG icons.
- The transition from dark mode to light mode as the default is acceptable for all users based on the corporate directive.
