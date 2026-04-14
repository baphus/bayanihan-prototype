# Bayanihan Prototype - UI Guidelines & Instructions

## Unified Table Component
When generating or modifying tables in this project:
- **Always** use the `UnifiedTable` component located at `src/components/ui/UnifiedTable.tsx` as the single source of truth for all tables across the system.
- **Do not** create raw HTML `<table>` elements or ad-hoc page-level table structures.
- Use it as a design-system-level primitive. It must enforce consistency in styling, spacing, typography, and color tokens while allowing controlled extensibility.
- Pass configurations via props for columns, filters, pagination, and actions (`columns`, `activeFilters`, `currentPage`, `onAdvancedFilters`, etc.).
- Custom row actions should be rendered via the `render` function inside the column definition rather than injecting logic inside the table body manually.

## General Styling & Components
- Strictly use the predefined Tailwind CSS utility classes and custom color tokens (e.g., `bg-surface`, `text-on-surface`, `bg-primary`).
- Preserve spacing, layout configurations, and typography sizes corresponding to the `Inter` and `Public Sans` definitions in the application shell.
