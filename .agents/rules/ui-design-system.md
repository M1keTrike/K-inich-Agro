---
description: "Atlassian-inspired UI Design System for K'inich-Gov"
globs: ["**/*.tsx", "**/*.jsx", "**/*.css"]
---

# UI Design System: Atlassian-Inspired Enterprise Aesthetic

When generating or modifying UI components (React/Next.js/Tailwind), strictly adhere to the following design system. Avoid dark "sci-fi", "neon", or typical "AI-generated" aesthetics. The goal is a highly professional, clean, accessible, and enterprise-grade interface inspired by Atlassian products (Jira, Confluence).

## 1. Color Palette & Backgrounds
*   **Theme:** Light mode is the primary focus.
*   **Page Background:** Very light gray (`bg-gray-50` or `bg-slate-50`) to provide contrast for white cards.
*   **Surfaces/Cards:** Pure white (`bg-white`) with subtle borders (`border border-gray-200`) and soft shadows (`shadow-sm` or `shadow`).
*   **Typography:** 
    *   Primary text (Headers, main body): Dark slate/charcoal (`text-slate-800` or `text-gray-900`).
    *   Secondary text (Subtitles, metadata): Medium gray (`text-slate-500` or `text-gray-500`).
*   **Brand/Action:** Professional blue (`bg-blue-600` for primary buttons, `hover:bg-blue-700`).

## 2. Status & Alerts (Lozenges & Banners)
Do not use neon glows. Use solid, accessible enterprise colors:
*   **Success/Stable:** Green (`text-green-700`, `bg-green-100` for badges/lozenges).
*   **Warning/Crisis:** Orange/Amber (`text-orange-700`, `bg-orange-100` for badges/lozenges).
*   **Critical/Danger:** Red (`text-red-700`, `bg-red-100`).
*   **Information:** Blue (`text-blue-700`, `bg-blue-100`).
*   **Banners (Crisis mode):** Use solid alert banners with subtle backgrounds (e.g., `bg-orange-50 border-l-4 border-orange-500 p-4`) rather than aggressive pulsing neons.

## 3. Shapes & Typography
*   **Border Radius:** Moderately rounded corners (`rounded-md` for cards and buttons). Avoid sharp edges (`rounded-none`) or pill-shapes (`rounded-full`) unless it's a badge/lozenge.
*   **Typography:** Clean sans-serif (system defaults like Inter or standard sans). Use standard sentence case or title case. DO NOT use all-caps for large blocks of text or card titles unless it's a tiny sub-header.
*   **Spacing:** Generous and consistent padding. Use `p-4` or `p-6` for cards. Use clear gap spacing (`gap-4`, `gap-6`) in flex/grid layouts.

## 4. Components & Interactions
*   **Buttons:** 
    *   Primary: `bg-blue-600 text-white font-medium rounded-md px-4 py-2 hover:bg-blue-700 transition-colors`.
    *   Secondary: `bg-white text-slate-700 border border-slate-300 font-medium rounded-md px-4 py-2 hover:bg-slate-50 transition-colors`.
*   **Hover States:** Subtle background shifts (e.g., changing from `bg-white` to `bg-gray-50`) or slightly lifting the shadow on cards (`hover:shadow-md`).
*   **Focus States:** Always use clear focus rings (`focus:ring-2 focus:ring-blue-500 focus:outline-none`) for accessibility.
*   **Progress Bars:** Thin, clean lines. `bg-gray-200` for the track, and `bg-blue-600`, `bg-green-600`, or `bg-red-600` for the fill depending on status.

## 5. Icons
*   Use clean, line-art SVG icons (e.g., standard Lucide-React or Heroicons).
*   Size them appropriately (usually `w-5 h-5` or `w-6 h-6`).
*   Colors should match the text or status context (e.g., `text-slate-500` for decorative icons).
