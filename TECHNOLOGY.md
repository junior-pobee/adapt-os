# ADAPT OS Global Platform Architecture

## Product direction

ADAPT OS is evolving from a browser-local productivity workspace into a modular, accessible and globally adaptable platform. The existing static application remains available while the new application is developed in parallel. Existing workflows and local data must be migrated module by module rather than discarded.

## Application stack

- React 19 and TypeScript provide the component-driven interface and typed domain logic.
- Next.js 16 provides application routing, server rendering and server-side route handlers.
- Tailwind CSS 4 is available for utility styling; the initial interface uses a focused responsive CSS design system.
- PostgreSQL is the relational data layer, with an optional Supabase integration for authentication, database and storage.
- Python with FastAPI provides an isolated service boundary for future AI and data-processing adapters.
- Rust and WebAssembly are an optional compute layer for performance-sensitive browser workloads.
- IndexedDB provides structured local-first browser storage. The React finance module imports legacy local finance records on first use into a separate store, leaving the legacy dataset unchanged.
- A web manifest and service worker establish the installable and offline application foundation.
- Vitest provides unit testing; Playwright is included for future browser-level testing.

## Internationalisation

The initial locale catalogue includes English, French, Spanish and Arabic. Arabic uses right-to-left layout direction. Currency formatting uses the browser Intl API. Ledger summaries retain separate totals for each currency rather than combining unlike currencies.

## Data and security

Cloud access remains disabled until public Supabase project configuration is supplied. Never place service-role keys or AI provider secrets in browser code. Provider credentials belong in server-side secret storage. Row-level security is enabled in the initial database migration. Financial provider connections require approved provider access, informed account-holder consent, verified callbacks and a dedicated server-side integration.

## Migration approach

The existing static application remains available during the migration. The React platform shell is developed in parallel so that legacy features can be ported incrementally. Each module must retain its expected behaviour and support data import/export compatibility before the legacy implementation is retired.

## Current implementation status

Implemented foundations:
- React and Next.js application shell with responsive navigation and module entry points.
- TypeScript strict compiler configuration and existing typed finance domain layer.
- English, French, Spanish and Arabic message catalogues, including RTL direction support.
- International currency selection and locale-aware currency formatting.
- IndexedDB local workspace storage helper.
- Optional Supabase client initialisation from public environment variables.
- PostgreSQL workspace and ledger schema with row-level security policies.
- Python FastAPI service boundary with honest not-configured and adapter-required responses.
- Rust/WebAssembly finance calculation crate.
- PWA manifest, service worker and offline fallback page.
- Unit test foundation and CI workflow for TypeScript, tests, Next.js build and Python syntax.

Not yet implemented:
- Complete migration of the legacy dashboard and every existing feature.
- Production cloud synchronisation, account recovery and multi-device conflict resolution.
- A selected AI provider adapter or live AI functionality.
- Live banking or mobile-money connections.
- Production deployment configuration for the Next.js application.
- Full accessibility audit, end-to-end browser tests and performance benchmarks.


## Workspace module migration

The React shell now includes functional local-first Dashboard, Profile, File Vault, Tasks & Projects, Learning Studio, Research Desk, Notes, AI Centre and Settings modules. File Vault enforces a 20 MB per-file and 100 MB total local limit. Research links are restricted to HTTP and HTTPS. Profile, tasks, notes, research and study data are stored in IndexedDB. The File Vault stores file blobs locally.

Optional Supabase email-link authentication and workspace snapshot synchronisation are implemented behind environment configuration and owner-scoped row-level security. Cloud snapshot sync currently includes profile, tasks, notes, research and study plans; binary File Vault contents are deliberately excluded.

The AI Centre is an integration shell only. It does not generate responses until a provider adapter is selected, configured and secured server-side.
