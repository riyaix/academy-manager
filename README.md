# Facturador

Local-first desktop app for **academy management** and **private bookkeeping** (payment records, not legal invoices). Built with Tauri 2, React 19, TypeScript, Tailwind CSS 4, and SQLite.

## What it does

- Manage students, courses, class groups, and enrollments
- Create internal payment records (batch or manual) with PDF export
- Track paid vs pending amounts for your own cash-flow view
- One-click backup/restore (`.facturador-backup.zip`)

**Out of scope:** VeriFactu, AEAT, legal invoicing, multi-user cloud sync.

## Requirements

- [Node.js](https://nodejs.org/) 20+
- [Rust](https://www.rust-lang.org/tools/install) (for Tauri desktop builds)
- **Windows:** [WebView2](https://developer.microsoft.com/microsoft-edge/webview2/) (usually preinstalled on Windows 11) + [C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) for development builds
- **Linux Mint / Ubuntu:** WebKitGTK 4.1 and related packages (see [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/)):

```bash
sudo apt update
sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file \
  libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev pkg-config
```

## Development

```bash
# Install dependencies
npm install

# Web-only dev (mock data, no SQLite)
npm run dev

# Desktop app with SQLite
npm run tauri dev

# Quality checks
npm run check    # typecheck + lint + format
npm test         # Vitest (domain + core)
npm run build    # production frontend build
```

## Project layout

```
src/
├── app/           # Shell, navigation registry, providers, global store
├── core/          # Shared UI, storage, backup, PDF, hooks
├── domain/        # Pure types + business rules (no React)
├── features/      # Self-contained feature modules
└── locales/       # i18n (es default, en secondary)
```

Each feature exports a `FeatureModule` from `index.ts` and registers in `app/navigation/registry.ts`. Features must **not** import sibling features — use `domain/` and `core/storage/` repositories instead.

See [`docs/product/PLAN.md`](docs/product/PLAN.md) for the full roadmap, [`docs/analysis/desktop-readiness-and-accessibility.md`](docs/analysis/desktop-readiness-and-accessibility.md) for Windows / Linux Mint readiness and accessibility notes, and `src/features/_template/` for the module checklist.

## Adding a feature

1. Add types and pure logic in `src/domain/`
2. Add repository methods in `src/core/storage/` if persisted
3. Create `src/features/<name>/` (page, components, hooks, `index.ts`)
4. Add i18n keys to `src/locales/es` and `src/locales/en`
5. Register in `app/navigation/registry.ts`
6. Add domain tests for business rules
7. Update `CHANGELOG.md`

## Keyboard shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+N` | New student |
| `Ctrl+Shift+N` | New manual payment record |
| `Ctrl+1` | Dashboard |
| `Ctrl+2` | Students |
| `Ctrl+3` | Billing |
| `Ctrl+,` | Settings |
| `Ctrl+?` | Show shortcuts help |

## Testing

Domain logic is covered by Vitest in `src/domain/**/*.test.ts`. Run:

```bash
npm test
```

## Backup

Settings → Backup: export or import a `.facturador-backup.zip` containing the SQLite database, metadata, and logo. Optional weekly auto-backup to a folder you choose (configured in onboarding or Settings).

## License

Private / personal tool — see repository owner for terms.
