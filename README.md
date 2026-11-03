<div align="center">

# ADAPT OS

### Your workspace. Your workflow. Your way.

**A local-first global workspace for productivity, learning, research, files and personal finance.**

<p>
  <a href="https://junior-pobee.github.io/adapt-os/"><strong>Launch ADAPT OS</strong></a>
  ·
  <a href="https://github.com/junior-pobee/adapt-os">Source Code</a>
  ·
  <a href="https://github.com/junior-pobee/adapt-os/issues">Report an Issue</a>
</p>

![Status](https://img.shields.io/badge/status-active-635bff?style=for-the-badge)
![Platform](https://img.shields.io/badge/platform-React%20%7C%20Next.js-0ea5e9?style=for-the-badge)
![Language](https://img.shields.io/badge/language-TypeScript-3178c6?style=for-the-badge)

**Built by [Emmanuel Pobee Okpoti](https://github.com/junior-pobee)**

</div>

---

## What is ADAPT OS?

ADAPT OS is a modular personal operating environment. It brings planning, learning, research, files, notes, finance and personal workspace settings into one responsive application.

The primary workspace is built with **React, Next.js and TypeScript**. It is local-first: supported information stays in the browser unless the user deliberately connects an optional cloud account.

## Global workspace modules

| Module | Capabilities |
| --- | --- |
| Dashboard | Workspace overview, activity counts and quick navigation |
| Finance | Multi-currency transaction ledger, accounts, budgets and CSV export |
| Learning Studio | Subject-based study plans, dates, durations and completion tracking |
| File Vault | Local file storage, search, download and removal |
| Tasks & Projects | Priorities, due dates, completion tracking and task details |
| Research Desk | Saved links, summaries and research references |
| Notes | Searchable personal notes |
| AI Centre | Prompt preparation and provider integration entry point |
| My Profile | Local profile and workspace identity |
| Settings | Language, currency, local data export and optional cloud account |

The React workspace includes English, French, Spanish and Arabic language catalogues, with right-to-left layout support for Arabic. Language coverage is being expanded across the individual module interfaces.

## Companion experiences

The repository also retains the existing standalone experiences, including Lumen, Student Edition, Studio, Google Mode, Chess, Snake, Commerce and Translator.

The previous HTML workspace is preserved at the [legacy workspace page](https://junior-pobee.github.io/adapt-os/legacy.html). The React workspace is the primary application at the site root.

## Technology

| Technology | Purpose |
| --- | --- |
| Next.js App Router | Application structure and static production export |
| React | Interactive workspace interface |
| TypeScript | Typed application and finance logic |
| CSS | Responsive layout, themes and accessibility |
| IndexedDB | Local workspace records and file blobs |
| Supabase | Optional email authentication and cloud snapshots |
| Vitest | Unit and validation tests |
| Python FastAPI foundation | Future server-side AI services |
| Rust/WASM foundation | Future compute services |

## Run locally

Requirements: Node.js 22 or later and npm.

```bash
git clone https://github.com/junior-pobee/adapt-os.git
cd adapt-os
npm install
npm run dev
```

Open the local address printed by Next.js.

Run validation and a production build:

```bash
npm run typecheck
npm test
npm run build
```

For a local GitHub Pages-path build:

```bash
NEXT_PUBLIC_BASE_PATH=/adapt-os npm run build
```

## Deployment

GitHub Actions builds the Next.js static export and publishes the generated `out/` directory to GitHub Pages. The deployment workflow also preserves the standalone companion pages and their static assets.

The production base path is `/adapt-os`. The service worker and installable web app manifest use that project path so that app assets and offline navigation remain within the correct GitHub Pages scope.

## Optional cloud setup

Cloud sync is optional. To enable it, configure these public browser environment variables in the deployment environment:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Apply the SQL migrations in `supabase/migrations` to the Supabase project before enabling cloud features. Never place a Supabase service-role key or other private server secret in a `NEXT_PUBLIC_` variable or browser code.

Cloud snapshots currently cover profile, tasks, notes, research references and study plans. File Vault binary contents remain local to the device. The AI Centre is an integration entry point and does not claim to provide live AI responses until a secure provider adapter is configured.

## Data and privacy

- Local workspace records are stored in IndexedDB.
- File Vault contents remain in the browser on the device where they were added.
- Browser site-data removal can erase local records and files.
- Export important workspace data and keep separate backups.
- Cloud sync requires explicit account connection and is not enabled by default.
- Finance entries are user-entered records; the app does not connect to banks or Mobile Money providers.

## Project structure

```text
adapt-os/
├── app/
│   ├── api/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── src/
│   ├── components/
│   ├── finance/
│   ├── i18n/
│   └── platform/
├── public/
│   ├── manifest.json
│   ├── offline.html
│   └── sw.js
├── services/
│   ├── ai_python/
│   └── compute/
├── supabase/
│   └── migrations/
├── index.html
├── main.js
├── style.css
├── next.config.ts
└── package.json
```

## Developer

**Emmanuel Pobee Okpoti**

- GitHub: [@junior-pobee](https://github.com/junior-pobee)
- Portfolio: [junior-pobee.github.io/my-profile](https://junior-pobee.github.io/my-profile)

---

<div align="center">

**Stay Stoic. Stay Becoming.**

*One workspace. Different possibilities.*

[Launch ADAPT OS](https://junior-pobee.github.io/adapt-os/) · [Explore the source](https://github.com/junior-pobee/adapt-os)

</div>
