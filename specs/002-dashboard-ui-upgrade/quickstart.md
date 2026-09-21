# Quickstart & Validation Guide: dashboard-ui-upgrade

This guide explains how to validate the new corporate UI components in the frontend environment.

## Prerequisites

- Node.js (v18+)
- Local development environment set up for the K'inich-Gov frontend.
- `lucide-react` installed in `package.json`.

## Setup

If `lucide-react` is not yet installed:
```bash
npm install lucide-react
# or
yarn add lucide-react
```

## Validation Scenarios

### Scenario 1: Validate Global Theme
1. Start the frontend development server: `npm run dev`
2. Open the application in your browser (usually `http://localhost:3000`).
3. **Expected Outcome**: The global background (`body` or main app container) should be a light gray (`bg-slate-50`). 

### Scenario 2: Validate Scenario Cards & Icons
1. Navigate to the main dashboard view where Scenario Cards are displayed.
2. **Expected Outcome**: 
   - Cards have a pure white background (`bg-white`), subtle borders, and soft shadows.
   - Resource metrics (Water, Energy, Biomass) display clean Lucide SVG icons instead of emojis.
   - The metrics are represented by thin progress bars instead of raw text percentages.
   - The action buttons use the corporate blue theme (`bg-blue-600`) with rounded corners.

### Scenario 3: Validate Crisis Banners (Multiple Crises & Long Text)
1. Inject or mock multiple active crisis events, including one with a description exceeding 150 characters.
2. **Expected Outcome**:
   - The dashboard displays multiple professional alert banners stacked vertically at the top.
   - The banners have pastel backgrounds (no neon pulsing).
   - The banner with the long description truncates with an ellipsis (`...`).
   - Hovering over the truncated text displays the full description.

### Scenario 4: Validate State Pills
1. Observe the overall survival status on any scenario card.
2. **Expected Outcome**: The status is encapsulated in a small, pill-shaped indicator with semantic coloring (e.g., green for stable, red for critical).
