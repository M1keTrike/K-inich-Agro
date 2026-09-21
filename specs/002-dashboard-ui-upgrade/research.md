# Research & Decisions: dashboard-ui-upgrade

## UI Component Library & Styling
- **Decision**: Use Tailwind CSS utility classes directly instead of a heavy component library (like MUI or Ant Design).
- **Rationale**: The project already uses Tailwind CSS. Adding a new component library would introduce unnecessary bloat and violate the principle of maintaining agile infrastructure. Tailwind provides sufficient utilities (e.g., `bg-slate-50`, `shadow-sm`, `rounded-md`) to perfectly replicate the clean corporate Atlassian-style aesthetic.
- **Alternatives considered**: Adopting an Atlassian Design System UI kit (rejected due to dependency weight and required migration effort).

## Iconography
- **Decision**: Adopt `lucide-react` for all iconography.
- **Rationale**: As clarified in the specification, Lucide-React is modern, lightweight, cleanly designed, and easily integrates into React applications. It perfectly replaces the current informal emojis with professional SVG lines.
- **Alternatives considered**: Heroicons (good, but Lucide has a slightly more corporate/neutral feel), Radix Icons (too minimal for some dashboard elements).

## Progress Bar Implementation
- **Decision**: Build a custom `ResourceProgressBar` component using semantic Tailwind colors.
- **Rationale**: Progress bars are simple HTML elements (`<div role="progressbar">`). Using standard div elements with dynamic inline widths (e.g., `style={{ width: `${value}%` }}`) and semantic Tailwind background classes (`bg-green-500`, `bg-yellow-500`, `bg-red-500`) keeps the DOM light and animations smooth.
- **Alternatives considered**: HTML5 `<progress>` element (harder to style consistently across browsers).

## Alert Banner Layout & Overflow
- **Decision**: Alert Banners will stack vertically at the top of the dashboard. Long text will be truncated using `truncate` (CSS text-overflow: ellipsis) with full text available on hover (using a standard `title` attribute or a lightweight Tooltip if one exists).
- **Rationale**: Solves the edge case of multiple crises and long texts cleanly, maintaining a predictable layout height and preventing the UI from breaking.
- **Alternatives considered**: Horizontal scrolling banners (rejected as unprofessional/distracting), wrapping text to multiple lines (rejected as it causes layout shifts).
