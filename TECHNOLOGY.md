# ADAPT OS Technology Architecture

## Product direction

ADAPT OS is evolving from a browser-local productivity workspace into a modular, accessible and globally adaptable platform. The current application remains compatible with its existing static deployment while the typed architecture is introduced incrementally.

## Languages and formats

| Technology | Responsibility |
| --- | --- |
| HTML5 | Semantic application structure and accessible forms |
| CSS3 | Responsive design, themes, motion and layout |
| JavaScript (ES2022) | Current browser runtime and compatibility layer |
| TypeScript | Strictly typed domain logic, finance calculations and future application modules |
| JSON | Settings, structured records and integration configuration |
| SQL | Planned server-side relational persistence when a backend is introduced |

## Current runtime

The current production interface still runs through index.html, style.css, modern.css, main.js and finance-advanced.js. Existing pages and saved browser data are retained. TypeScript files are the foundation for the next migration stage; they are not loaded directly by browsers.

## TypeScript workspace

- src/finance/finance.types.ts defines finance domain contracts.
- src/finance/finance-core.ts contains pure, testable ledger calculations and CSV utilities.
- tsconfig.json enables strict type checking.
- package.json provides the TypeScript validation command.

## Global product standards

- Use ISO 4217 currency codes and locale-aware formatting.
- Use ISO country codes and explicit time-zone-aware dates for future regional features.
- Keep personal records private and avoid placing secrets in browser code.
- Design for keyboard navigation, screen readers, reduced motion and narrow screens.
- Load optional features independently so a failure in one area does not block the workspace.
- Keep financial totals separated by currency unless a trusted exchange-rate source is configured.

## Finance integration boundary

The finance workspace currently records information entered by the user and stores it in the browser. It does not connect to bank or Mobile Money accounts, read balances from providers, or initiate payments.

A future connection must be implemented through an authorised financial provider and a secure server-side integration. Provider credentials must never be placed in HTML, CSS, JavaScript delivered to browsers, or local storage. Account holders must complete the provider's own consent and authentication flow. Sandbox testing and verified transaction webhooks are required before any production financial operation.

Useful standards and provider documentation:

- GSMA Mobile Money API: https://www.gsma.com/solutions-and-impact/connectivity-for-good/mobile-for-development/mobile-money/mobile-money-api-2/
- MTN MoMo API: https://momo.mtn.com/api/
- Bank of Ghana: https://www.bog.gov.gh/

## Migration plan

1. Introduce strict TypeScript domain models without replacing the stable legacy runtime.
2. Move finance calculations into typed, unit-testable modules.
3. Add a server API and authenticated user accounts before introducing cloud synchronisation.
4. Integrate only approved providers using server-side secrets, consent and webhook verification.
5. Migrate remaining application modules one at a time, retaining compatibility and regression tests.
