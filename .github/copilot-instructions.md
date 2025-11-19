# Copilot Instructions for yly-search-mini

## Project Overview
- **YLY Search Viewer** is a Vue 3 + Vite SPA for enterprise RAG (Retrieval-Augmented Generation) search, preview, and AI-powered document analysis.
- Major features: full-text/semantic/image/AI search, file preview, AI tools (summary, tags, NER, custom extraction, QA, translation), data management (form designer, extraction, stats), file diff.
- All business logic and UI are in `src/` (see below for structure).

## Key Architecture & Patterns
- **Component Structure:**
  - `src/components/` — UI components, grouped by domain (search, preview, ai, forms, extractions, editor, common)
  - `src/views/` — Page-level views (e.g., `SearchView.vue`, `PreviewView.vue`)
  - `src/stores/` — Pinia stores for state management (e.g., `search.js`, `filePreview.js`, `aiTools.js`)
  - `src/services/` — API/service layer, each service as a singleton (e.g., `searchService.js`, `aiService.js`, `formsApiService.js`)
  - `src/constants/`, `src/utils/`, `src/styles/`, `src/assets/` — constants, helpers, global styles, static assets
- **API Layer:**
  - All backend API calls are encapsulated in `src/services/`. Each service exports a singleton (e.g., `export const apiService = new FormsApiService()`).
  - Use the service layer for all data access; do not call fetch/axios directly in components.
- **State Management:**
  - Use Pinia stores for cross-component state. Stores are organized by domain and should only manage business/UI state, not direct API calls.
- **Styling:**
  - Use CSS variables from `src/styles/variables.css`. No hardcoded colors, spacing, or font sizes.
  - Main color: `#3B82F6` (Tailwind Blue-500).
- **Component Naming:**
  - Components: PascalCase (`SearchView.vue`), services/stores/constants: camelCase.

## Developer Workflows
- **Install dependencies:** `npm install`
- **Local dev:** `npm run dev`
- **Build (test env):** `npm run build:test` (output in `dist/`)
- **Deploy:** Use `npm run deploy` (see `deploy.js` for SSH/SFTP automation). Manual: upload `dist/*` to `/opt/yliyun/work/nginx/plugins/fts/`.
- **Lint:** ESLint config in `eslint.config.js` (ECMAScript 2023, Vue 3 SFC, allows `^_` unused vars, disables `no-console`).
- **No automated tests yet** (add with Vitest/Vue Test Utils/Cypress as needed).

## OpenSpec-Driven Development
- All major changes (features, breaking, architecture) require a proposal/spec in `openspec/changes/` before implementation.
- See `openspec/AGENTS.md` for full spec-driven workflow, naming, and validation rules.
- Use `openspec/project.md` for project conventions, domain context, and architecture rationale.
- For bug fixes, typos, config, or non-breaking dependency updates, direct edits are allowed.

## Integration Points & External Dependencies
- **Backends:**
  - Search: Elasticsearch API (`/elasticsearch`)
  - App: File/AI/permissions (same-origin)
  - AI streaming: SSE endpoints (see `aiService.js`, `streamingService.js`)
- **3rd-party:**
  - Element Plus (UI), ECharts, PDF.js, Milkdown, diff2html, etc.
- **Deployment:**
  - Nginx static hosting, SSH/SFTP for deploy, Node.js 18+ required for dev.

## Project-Specific Conventions
- All new features/changes must follow OpenSpec proposal/approval unless explicitly exempted (see `openspec/AGENTS.md`).
- Use semantic, single-responsibility components and services.
- Always use the service layer for API access and Pinia for shared state.
- Reference `openspec/project.md` for business/domain concepts and terminology.

## Examples
- To add a new AI extraction feature:
  1. Propose in `openspec/changes/` (see `openspec/AGENTS.md` for format)
  2. Implement service in `src/services/aiService.js`, state in `src/stores/aiTools.js`, UI in `src/components/ai/`
  3. Use CSS variables for all styles
  4. Update relevant specs and docs

- To fix a bug in file preview:
  1. Directly edit `src/components/preview/` or `src/services/preview.js` as needed
  2. No proposal required if restoring intended behavior

## Further Reading
- `README.md` — Build, deploy, and troubleshooting
- `openspec/AGENTS.md` — AI agent workflow, spec-driven dev, proposal/approval process
- `openspec/project.md` — Architecture, conventions, domain context

---
_Last updated: 2025-11-19_
