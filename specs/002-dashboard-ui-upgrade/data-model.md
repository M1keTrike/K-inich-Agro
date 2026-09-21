# Data Model & Component Contracts: dashboard-ui-upgrade

*Note: The backend data models for `Crisis` and `Scenario` remain completely unchanged. This document defines the **frontend component interfaces (props)** required to render the new UI.*

## Component Interfaces

### AlertBanner
Represents a professional alert for a crisis state.

**Props**:
- `crisisId` (string): Unique identifier.
- `title` (string): The title of the crisis.
- `description` (string): The detailed description of the crisis (will be truncated if too long).
- `severity` ("critical" | "warning"): Determines the pastel background color (red or orange).
- `onDismiss` (function, optional): Callback if the banner is dismissable.

### StatePill (Lozenge)
Represents the current survival state or status in a pill-shaped indicator.

**Props**:
- `label` (string): The text to display (e.g., "Stable", "Critical").
- `status` ("stable" | "warning" | "critical" | "neutral"): Determines semantic coloring (background and text color).

### ResourceProgressBar
Represents a resource level (Water, Energy, Biomass) as a clean progress bar.

**Props**:
- `resourceType` ("water" | "energy" | "biomass"): Used to select the correct Lucide icon.
- `value` (number): The percentage value (0-100).
- `colorStatus` ("safe" | "caution" | "danger"): Semantic color for the fill (`bg-green-500`, `bg-yellow-500`, `bg-red-500`).

### ScenarioCard
Represents a complete survival scenario calculation.

**Props**:
- `scenarioId` (string): Unique identifier.
- `title` (string): Title of the scenario.
- `overallStatus` (string): Passed to `StatePill`.
- `resources`: Array of objects containing `{ type, value, status }` passed to `ResourceProgressBar`.
- `onSelect` (function): Callback when a user clicks the primary action button to vote/select this scenario.
