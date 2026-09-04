# Product Plan — Facturador

**Purpose:** Turn the current MVP into a **solid personal tool** for academy management and **private bookkeeping** (tracking who owes what, monthly fees, income overview).  
**Not in scope:** Legal invoicing, VeriFactu, AEAT submission, or issuing documents to third parties as official tax records.

**Related:** [ANALISIS.md](./ANALISIS.md) (audit of the current codebase). Desktop readiness: [../analysis/desktop-readiness-and-accessibility.md](../analysis/desktop-readiness-and-accessibility.md).

---

## 1. Product vision

### What this app is

A **local-first desktop app** (Tauri) that helps you:

- Run your academy day to day (students, courses, groups, enrollments, schedule).
- Generate **internal payment records** (not legal invoices) for monthly fees.
- Track **paid vs pending** amounts for your own cash-flow view.
- Export PDFs/CSVs for your files and backup data in one click.

### What this app is not

| Out of scope | Reason |
|--------------|--------|
| VeriFactu / AEAT | Personal bookkeeping only; you use another tool for official tax filing if needed |
| Legally valid invoices | PDFs are **receipts / payment summaries** for your records |
| Multi-user / cloud sync | Single user, local machine |
| Mandatory encryption / login | Optional hardening; default is open + easy backup |

### Design principles

1. **Code in English** — identifiers, files, types, comments, commits.
2. **UI in Spanish by default** — English available in Settings; all user-facing strings via i18n keys.
3. **Semantic names** — `Student`, `Enrollment`, `PaymentRecord`, not `COD_CLI` or `db_clientes`.
4. **Modular by feature** — each domain is a self-contained module; new features plug in without editing unrelated code.
5. **Stable core, volatile edges** — persistence, navigation, and i18n are core; PDF layout and charts are replaceable.
6. **Backup is a first-class action** — visible, one-click, restorable without technical knowledge.
7. **Fail safe** — duplicate monthly billing warned; IDs never collide; settings used consistently in exports.

---

## 2. Technical direction

### Stack (confirmed)

| Layer | Choice | Notes |
|-------|--------|-------|
| UI | React 19 + **TypeScript** + **Tailwind CSS 4** | Keep current styling approach; TS adds safety with ~3.7k LOC |
| Desktop | Tauri 2 | Use Rust for file I/O, backup dialogs, optional encryption |
| State | **Zustand** (or Jotai) per domain + thin app shell | Avoid prop drilling from `App.tsx` |
| Routing / views | Central **navigation registry** | Features register routes; dashboard quick actions use the same API |
| i18n | **i18next** + `react-i18next` | `es` default, `en` secondary; keys in JSON under `src/locales/` |
| Persistence | **SQLite** via Tauri (`tauri-plugin-sql` or custom commands) | Replace `localStorage`; JSON export for backup |
| PDF | Single **`pdf` service** in `src/core/pdf/` | jsPDF stays; one entry point for all documents |
| Tests | **Vitest** + Testing Library | Unit tests on domain logic first |

### Is TypeScript too much hassle?

**No — incremental migration is enough.** You do not rewrite everything at once.

1. Add `typescript`, `@types/react`, `vite` TS config.
2. Rename `main.jsx` → `main.tsx`, `App.jsx` → `App.tsx`.
3. Introduce `src/domain/types/*.ts` with shared models.
4. Migrate one feature module at a time (clients → courses → groups → billing).
5. Keep `allowJs: true` until migration is complete.

Estimated effort: **2–4 days** for scaffolding + first module; rest spreads across phases.

### Target folder structure

```
src/
├── app/                    # Shell only: layout, nav, providers
│   ├── App.tsx
│   ├── navigation/
│   │   ├── registry.ts     # Feature modules register here
│   │   └── useNavigation.ts
│   └── providers/
│       ├── I18nProvider.tsx
│       └── StoreProvider.tsx
├── core/                   # Shared, feature-agnostic building blocks
│   ├── components/         # Button, Modal, DataTable, EmptyState, ...
│   ├── hooks/
│   ├── pdf/
│   ├── storage/            # Repository interfaces + SQLite impl
│   ├── backup/
│   ├── ids/                # Sequential ID generation
│   └── utils/
├── domain/                 # Pure types + business rules (no React)
│   ├── student.ts
│   ├── course.ts
│   ├── group.ts
│   ├── enrollment.ts
│   ├── payment-record.ts
│   └── settings.ts
├── features/               # One folder per feature — the modular unit
│   ├── dashboard/
│   │   ├── index.ts        # Public API: routes, nav item, optional store slice
│   │   ├── DashboardPage.tsx
│   │   ├── components/
│   │   ├── hooks/
│   │   └── dashboard.test.ts
│   ├── students/
│   ├── courses/
│   ├── groups/
│   ├── billing/            # Batch + manual payment records
│   ├── payment-history/
│   ├── calendar/
│   └── settings/
├── locales/
│   ├── es/
│   │   └── translation.json
│   └── en/
│       └── translation.json
└── main.tsx
```

### Feature module contract

Every feature exports a single `FeatureModule` object:

```ts
// features/students/index.ts
export const studentsFeature: FeatureModule = {
  id: 'students',
  navItem: { icon: Users, labelKey: 'nav.students' },
  routes: [{ path: 'students', component: StudentsPage }],
  // optional: onInit(store), migrations
};
```

**Rules:**

- Features **must not import** from sibling features directly — only from `core/` and `domain/`.
- Cross-feature needs go through **domain services** or **shared store actions** (e.g. billing reads students via `studentRepository`).
- Adding a feature = add folder + register in `app/navigation/registry.ts` — no edits to other feature pages.

### Naming convention (code vs UI)

| Layer | Language | Example |
|-------|----------|---------|
| Files, types, functions, DB columns | English | `Student`, `createPaymentRecord()` |
| User-visible strings | i18n (`es` / `en`) | `t('students.addButton')` → "Añadir cliente" |
| Internal PDF for you | Follow UI locale | Spanish labels default |

### Domain rename map (migration reference)

Use this when refactoring; one-time import script can map old `localStorage` keys.

| Current (Spanish/legacy) | New (English) |
|--------------------------|---------------|
| `clientes` / `COD_CLI` | `students` / `studentId` |
| `ALUMNO`, `NOMBRE`, `APELLIDOS` | `studentName`, `guardianFirstName`, `guardianLastName` |
| `productos` / `COD_PROD` | `courses` / `courseId` |
| `CURSO`, `CUOTA` | `courseName`, `monthlyFee` |
| `grupos` | `classGroups` |
| `matriculas` | `enrollments` |
| `facturas` | `paymentRecords` |
| `datosAcademia` | `organizationSettings` |
| `tipoImpuestos`, `ivaDefecto`, `irpfDefecto` | `taxMode`, `defaultVatRate`, `defaultIncomeTaxReserveRate` |
| `estado` Pagada/Pendiente/Anulada | `status` `paid` / `pending` / `voided` |

Rename **payment record** instead of **invoice** in code and UI (Spanish UI: *registro de cobro* / *recibo interno*) to reflect personal bookkeeping, not legal billing.

---

## 3. Persistence & backup model

### Default (simple)

- Single SQLite file in app data dir: `facturador.db`
- Auto-save on every mutation (debounced 300ms)
- **Backup:** menu → *Export backup* → `.facturador-backup.zip` containing:
  - `database.json` (or raw `.db`)
  - `metadata.json` (app version, export date, schema version)
  - `logo.png` (optional, separate from DB to avoid bloat)
- **Restore:** *Import backup* → validates schema version → replaces DB (with confirmation)

### Optional security (Settings → Privacy)

Off by default. When enabled:

| Option | Behavior |
|--------|----------|
| App PIN | Required on launch; stored as hash locally |
| Encrypt backup file | ZIP + password (AES); you choose password per export or save device key |
| Encrypt database at rest | SQLite encryption extension or encrypt JSON blob — only if you enable it |

**Important:** Plain backup remains available even when encryption is on (user choice at export time).

---

## 4. Phased roadmap

Effort estimates assume solo development, part-time. Adjust as needed.

Phases 0–4 and most of Phase 6 are **completed** (see [CHANGELOG.md](../../CHANGELOG.md)).
The roadmap below preserves the completed phases as reference and adds Phases 7–10 based on a professional UI/UX, engineering, and product audit conducted at v0.2.0.

---

### Phase 0 — Foundation & guardrails ✅

**Goal:** Architecture and tooling so later work does not fight the codebase.  
**Status:** Complete (v0.1.0)

| ID | Task | Details | Done when |
|----|------|---------|-----------|
| 0.1 | TypeScript setup | `tsconfig`, strict mode gradually, `main.tsx` | ✅ |
| 0.2 | ESLint + Prettier | Consistent style; English-only identifiers rule | ✅ |
| 0.3 | Folder scaffold | `app/`, `core/`, `domain/`, `features/`, `locales/` | ✅ |
| 0.4 | i18n bootstrap | i18next; `es` default; migrate 5–10 strings from sidebar as proof | ✅ |
| 0.5 | Navigation registry | `navigateTo(view, action?)` replaces broken `navegarConAccion` | ✅ |
| 0.6 | Design system primitives | `Button`, `Card`, `Modal`, `ConfirmDialog`, `Toast` in `core/components` | ✅ |
| 0.7 | Domain types | TypeScript interfaces in `domain/` for all entities | ✅ |
| 0.8 | Feature module template | Document + example `features/_template/` | ✅ |
| 0.9 | Tauri window defaults | Min size 1280×800; title from settings | ✅ |
| 0.10 | Remove dead Rust | Delete `greet` command; keep plugin-opener | ✅ |

---

### Phase 1 — Stabilize current behavior ✅

**Goal:** Fix everything [ANALISIS.md](./ANALISIS.md) flagged that affects daily trust.  
**Status:** Complete (v0.1.0)

| ID | Task | Details | Done when |
|----|------|---------|-----------|
| 1.1 | Fix dashboard navigation | Wire all quick actions through `navigateTo` | ✅ |
| 1.2 | Unified payment record PDF service | Single `generatePaymentRecordPdf()` | ✅ |
| 1.3 | Settings actually flow to billing | `taxMode`, rates, logo, payment methods via store | ✅ |
| 1.4 | Sequential record numbers | Persistent counter; batch assigns atomically | ✅ |
| 1.5 | Duplicate billing warning | Check same `billingPeriod` + group ids | ✅ |
| 1.6 | Logo storage single path | File path via Tauri | ✅ |
| 1.7 | Merge branding settings | One *Appearance* section | ✅ |
| 1.8 | Real student course history | Derive from enrollments + class groups | ✅ |
| 1.9 | Robust ID generation | `max(id)+1` from DB | ✅ |
| 1.10 | Rename user-facing copy | *cobro* / *recibo* over *factura legal* | ✅ |

---

### Phase 2 — Modular feature extraction ✅

**Goal:** Split the monolith into feature modules with English names and i18n strings.  
**Status:** Complete (v0.1.0)

| ID | Task | Details | Done when |
|----|------|---------|-----------|
| 2.1–2.10 | All feature modules extracted | 8 registered features, full i18n, Zustand per feature | ✅ |

---

### Phase 3 — Real persistence & easy backup ✅

**Goal:** SQLite + one-click backup/restore.  
**Status:** Complete (v0.1.0)

| ID | Task | Details | Done when |
|----|------|---------|-----------|
| 3.1–3.8 | SQLite, repos, migrations, backup, auto-backup, logo on FS | All persistence tasks | ✅ |

---

### Phase 4 — Personal finance clarity ✅

**Goal:** Cash flow and reserves for personal bookkeeping.  
**Status:** Complete (v0.1.0)

| ID | Task | Details | Done when |
|----|------|---------|-----------|
| 4.1–4.6 | Income summary, fixed costs, tax reserve, payment methods, CSV, voided records | All finance tasks | ✅ |

---

### Phase 5 — Optional hardening

**Goal:** Security only if you want it; never blocking daily use.  
**Status:** Not started (by design — all opt-in)

| ID | Task | Details | Done when |
|----|------|---------|-----------|
| 5.1 | PIN on launch | Off by default; Settings → Privacy | Enables/disables cleanly |
| 5.2 | Encrypted backup option | Password prompt on export | Restores with same password |
| 5.3 | Encrypt local DB | Off by default; warning about password recovery | Document trade-offs in app |
| 5.4 | Auto-lock after idle | Optional timeout → PIN | For shared PC scenario |

**Exit criteria:** Default install unchanged; all security opt-in.

---

### Phase 6 — Polish & maintainability ✅ (mostly)

**Goal:** Pleasant long-term personal tool.  
**Status:** Mostly complete (v0.2.0). Remaining items promoted to Phase 7–10.

| ID | Task | Details | Done when |
|----|------|---------|-----------|
| 6.1 | Unit tests for domain | Mappers, weekdays, batch billing, ID parsing | ✅ |
| 6.2 | Master-detail students UI | List + side panel | ✅ |
| 6.3 | Custom confirm/toast everywhere | No native `alert()` / `confirm()` | ✅ |
| 6.4 | Keyboard shortcuts | `Ctrl+N`, `Ctrl+?`, etc. with in-app help | ✅ |
| 6.5 | Onboarding wizard | First run: org name, locale, backup folder | ✅ |
| 6.6 | README (English) | Dev setup, architecture, feature checklist | ✅ |
| 6.7 | CHANGELOG | Per-phase user-visible changes | ✅ |

---

### Phase 7 — Design system hardening

**Goal:** Close every gap identified in the UI/UX audit: color-space consistency, typography depth, component robustness, transitions, and accessibility.  
**Duration:** ~2 weeks

**Status:** Complete (v0.2.0)

| ID | Task | Details | Done when |
|----|------|---------|-----------|
| 7.1 | Replace `cn()` with `clsx` + `tailwind-merge` | Current `cn()` is a simple filter — conflicting Tailwind classes don't resolve. Install `tailwind-merge` and wrap with `clsx` so consumers can safely override classes (e.g. `className="bg-red-500"` on a `primary` Button actually wins) | All `cn()` call sites produce correct specificity; no orphaned duplicate classes |
| 7.2 | Brand color OKLCH pipeline | `brandColor.ts` currently works in sRGB gamma space while the design system is OKLCH. Convert user hex → OKLCH, adjust lightness in perceptual space, output OKLCH token. Use `culori` or a lightweight OKLCH conversion | Brand color set via Settings renders perceptually correct in both themes |
| 7.3 | Fix mono font token | `--font-family-mono` currently maps to Atkinson Hyperlegible. Set it to a proper monospace stack (`"JetBrains Mono", ui-monospace, monospace`). Optionally bundle `@fontsource/jetbrains-mono` or use system monospace | `<code>`, `<pre>`, `<kbd>` render in a monospace face |
| 7.4 | Widen font-size range for accessibility | Current small/normal/large maps to 14/16/18px — too narrow. Add `"x-large"` preference (20px via `text-xl`) and widen large to `text-lg` (18px). Ensure line-height scales: add `leading-relaxed` on body for large/x-large | 4 size options; x-large readable for low-vision users |
| 7.5 | Add explicit line-height tokens | Data-dense tables and forms need tighter leading than body text. Add `--leading-tight` and `--leading-normal` tokens used by table/form components | Tables don't waste vertical space; body text is comfortably spaced |
| 7.6 | Colorblind-safe group palette | Groups 1 (hue 185) and 2 (hue 155) are too close for deuteranopia. Shift group-2 hue to ~120 (green-yellow) or add a secondary differentiator (pattern, icon, or border style) to each chip | Pass simulated deuteranopia/protanopia check (use oklch-contrast or Sim Daltonism) |
| 7.7 | Modal & toast transitions | Modals and toasts appear/disappear instantly. Add CSS `@starting-style` transitions or a tiny `framer-motion` wrapper: backdrop fade (150ms), panel slide-up (200ms), toast slide-in/out (200ms). Respect `prefers-reduced-motion` | Modal open/close feels smooth; toast enters from edge; no animation when `prefers-reduced-motion: reduce` |
| 7.8 | Create `Input`, `Select`, `DataTable` primitives | Feature `.jsx` files inline their own form controls with inconsistent styling. Extract `Input`, `Select` (with label, error, hint slot), and `DataTable` (sortable headers, responsive horizontal scroll, `scope="col"`) into `core/components/` | All feature forms use shared primitives; no inline `<input className="...">`  |
| 7.9 | Remove `!important` font override | The `#root *, #root *::before, #root *::after { font-family: ... !important }` is nuclear and will fight any future third-party components. Replace with targeted `@layer base` rules on `html`, `body`, form elements, and Tailwind's `font-sans` mapping | Same visual result; no `!important` in font rules |
| 7.10 | Lower Tauri `minWidth` | Current `1280` blocks 13" laptops at native resolution. Lower to `1024` (or `960`) and verify sidebar collapse + responsive grid works at that width | App launches and is usable on a 1024px-wide window |
| 7.11 | Normalize route paths to English | Route paths are still Spanish (`/factura`, `/historial`, `/clientes`). Rename to `/billing`, `/payment-history`, `/students`, etc. while keeping Spanish URL display names in nav via i18n | All route `path` values are English; no user-visible change in nav labels |

**Exit criteria:** Design system is self-consistent (one color space, one font pipeline, robust primitives); components handle class overrides correctly; app is usable on 1024px screens; transitions feel polished.

---

### Phase 8 — Domain & engineering quality

**Goal:** Eliminate tech debt flagged in the engineering audit: legacy types, floating-point money, missing tests, JSX→TSX migration, and database resilience.  
**Duration:** ~2–3 weeks

**Status (2026-09-03):** Phase 8 complete. Domain store + feature UIs use English types; `Legacy*` remains only in `domain/legacy.ts`, mappers, and settings JSON migration.

| ID | Task | Details | Done when |
|----|------|---------|-----------|
| 8.1 | Retire legacy Spanish types | ✅ Store, persistence, PDF, and feature UIs use English domain types. `Legacy*` kept for mappers + legacy settings JSON normalize | Zero `Legacy*` record imports in `features/` (weekday labels excepted) |
| 8.2 | Integer-cents money model | ✅ `domain/money.ts` branded cents; repositories convert at the SQLite edge | No raw float arithmetic on monetary values; all billing tests pass with cent precision |
| 8.3 | Replace magic strings with enums/unions | ✅ Domain `TaxMode` / `PaymentRecordStatus`; `normalizeTaxMode()` for legacy strings | Domain unions in place (UI still uses Spanish legacy statuses) |
| 8.4 | Migrate all `.jsx` to `.tsx` | ✅ Feature managers converted; `allowJs: false` | Zero `.jsx` files in `src/`; `allowJs: false` in tsconfig |
| 8.5 | Database connection resilience | ✅ Retry + toast on persistent SQLite open failure | Connection failure → retry → toast with "database unavailable" message; no stuck app |
| 8.6 | Transaction wrappers for batch operations | ✅ `withTransaction` / `runInTransaction`; repository replaceAll is transactional | Batch writes are atomic — partial failures roll back; test confirms rollback behavior |
| 8.7 | Repository integration tests | ✅ In-memory SQLite via `node:sqlite` for students, payment records, settings | Each repository has ≥3 integration tests (create, read, update/delete); CI runs them |
| 8.8 | Component tests for critical flows | ✅ Duplicate warning, student form validation, modal focus trap | ≥5 component tests covering the highest-risk UI paths |
| 8.9 | Sync `Cargo.toml` version | ✅ All three at `0.2.0`; `npm run version-check` (also in `npm run check`) | All three version sources identical; `version-check` script prevents drift |
| 8.10 | Enable CSP | ✅ Restrictive CSP in `tauri.conf.json` | CSP active; app functions normally; no external resource loads |

**Exit criteria:** Domain is fully English-typed with safe money arithmetic; all feature components are TypeScript; database operations are resilient and transactional; test coverage spans domain + storage + key UI flows.

---

### Phase 9 — Product completeness

**Goal:** Fill the feature gaps identified in the product audit that block real daily use by anyone beyond the developer.  
**Duration:** ~2–3 weeks

**Status (2026-09-03):** Nearly done — **9.1–9.4, 9.6, 9.7** implemented. Remaining: **9.5** onboarding validation with real users (manual).

| ID | Task | Details | Done when |
|----|------|---------|-----------|
| 9.1 | Global search (Ctrl+K) | ✅ Palette searches students / payments / courses / groups | `Ctrl+K` opens search; Enter navigates |
| 9.2 | Reporting & analytics view | ✅ `features/reports/` with monthly bars, status pie, top students, overdue aging + date range | Nav under billing; 4 chart types |
| 9.3 | Receipt / PDF preview flow | ✅ Preview modal from payment history row + download | One-click preview / save |
| 9.4 | CSV/Excel import for students | ✅ Students page import modal: CSV/XLSX → column mapping → duplicate preview → apply (skip/update) + import log | Import flow under 1 minute; duplicates flagged; log shown |
| 9.5 | Onboarding validation with real users | Test the onboarding wizard with 2–3 non-technical people. Measure: (a) time to first payment record, (b) confusion points, (c) drop-off. Adjust copy and flow based on findings | Documented test sessions; ≤3 minutes to first payment record for a new user |
| 9.6 | Error recovery & crash reporting | ✅ Feature viewport error boundary with reload | Crash in one feature doesn't take down the shell |
| 9.7 | Data export (full CSV/PDF) | ✅ CSV + PDF export on students, courses, and filtered payment history | Export on 3+ list views; CSV/PDF of current filters |

**Exit criteria:** A new academy owner can install the app, import their student list, generate their first batch of payment records, search for any student, see a revenue chart, and preview/print a receipt — all within the first session.

---

### Phase 10 — Distribution & release pipeline

**Goal:** Make the app installable by someone who isn't a developer.  
**Duration:** ~1–2 weeks

| ID | Task | Details | Done when |
|----|------|---------|-----------|
| 10.1 | CI pipeline (GitHub Actions) | Build + test on push. Run `vitest`, lint, type-check. Fail on any error | Green CI badge on README |
| 10.2 | Release builds | GitHub Actions workflow: on tag push, build Tauri bundles for Linux (.deb, .AppImage), macOS (.dmg), Windows (.msi). Upload as release artifacts | `git tag v0.3.0 && git push --tags` → release with downloadable installers |
| 10.3 | Code signing (macOS + Windows) | macOS: Developer ID certificate + notarization. Windows: self-signed or certificate. Linux: AppImage doesn't need signing | macOS build opens without Gatekeeper warning; Windows doesn't show "unknown publisher" (or documents how to bypass) |
| 10.4 | Auto-update | Tauri updater plugin with a simple JSON endpoint (GitHub Releases or static file). Check on launch, prompt to install | User sees "Update available" notification; one-click update |
| 10.5 | Installer UX | Customize Tauri bundle: app icon, description, license, uninstaller entry. Test install/uninstall cycle on all 3 platforms | Clean install and uninstall; app appears in system menus with correct icon |
| 10.6 | Landing page / download page | Single-page site (can be GitHub Pages) with screenshots, feature list, download links per platform, and a "Getting started" section | URL exists; links to latest release; screenshots are current |

**Exit criteria:** A non-developer can download, install, and run the app on their OS without terminal commands.

---

## 5. How to add a feature (checklist)

Use this after Phase 0 to keep the product modular:

1. [ ] Add types to `domain/new-thing.ts` (pure functions + types, **no** `Legacy*` types).
2. [ ] Use `Money` (integer cents) for all monetary fields — see `domain/money.ts`.
3. [ ] Add repository methods to `core/storage/` if persisted; wrap multi-row writes in `withTransaction()`.
4. [ ] Create `features/new-thing/` with page (`.tsx`), components (`.tsx`), hooks.
5. [ ] Add i18n keys to **both** `locales/es` and `locales/en`.
6. [ ] Register in `app/navigation/registry.ts` — route path must be English.
7. [ ] Use shared primitives (`Button`, `Input`, `Select`, `DataTable`, `Modal`) from `core/components/`.
8. [ ] Add tests: domain unit tests (Vitest) + ≥1 repository integration test if persisted.
9. [ ] Do **not** import other features — use repositories / shared domain only.
10. [ ] Update CHANGELOG.

---

## 6. Testing strategy

| Layer | What to test | Tool | Phase |
|-------|--------------|------|-------|
| `domain/` | Fee totals, batch grouping, ID assignment, duplicate detection, money arithmetic | Vitest | ✅ Done (expand in 8.1–8.3) |
| `core/storage/` | Migrations, round-trip save/load, transaction rollback | Vitest + in-memory SQLite | ✅ 8.7 |
| Components | Focus trap, form validation, duplicate warning UI | Testing Library | ✅ 8.8 |
| E2E | Full billing cycle, import/export, onboarding | Playwright | Phase 10 (optional) |

**Rules:**
- Every bug gets a regression test in `domain/` or `core/`.
- Every new repository method ships with an integration test.
- Money tests must verify cent-precision (no floating-point drift).

---

## 7. Success metrics (personal)

You will know the plan succeeded when:

- [x] Monthly billing takes minutes, not an afternoon.
- [x] You trust the pending-payment list.
- [x] Backup before an update takes < 30 seconds.
- [x] Adding a new screen does not require editing 5 unrelated files.
- [x] You can use the app in Spanish daily and switch to English when needed.
- [x] You are not worried about VeriFactu — this tool never pretends to be that.
- [ ] You can find any student or payment record in < 3 seconds (global search).
- [ ] You can answer "how much revenue this quarter?" from a chart (reporting view).
- [ ] A non-developer can download, install, and use the app without your help.
- [ ] All monetary calculations produce exact-cent results (no float drift).
- [ ] The app launches and is usable on a 13" laptop (1024px width).
- [ ] Dark mode is fully polished — no raw gray/blue Tailwind leaks.

---

## 8. Suggested execution order (summary)

```
Phase 0  Foundation (TS, i18n, nav, module scaffold)       ✅
    ↓
Phase 1  Fix trust bugs (PDF, IDs, duplicates, logo, nav)  ✅
    ↓
Phase 2  Modular refactor + full i18n + English codebase    ✅
    ↓
Phase 3  SQLite + one-click backup/restore                  ✅
    ↓
Phase 4  Personal finance views (income, costs, reserves)   ✅
    ↓
Phase 6  Polish, tests, docs                                ✅ (mostly)
    ↓
Phase 7  Design system hardening (color, typography,
         components, transitions, responsive)               ✅
    ↓
Phase 8  Domain & engineering quality (legacy types,
         money model, JSX→TSX, tests, DB resilience)        ✅
    ↓
Phase 9  Product completeness (search, reports, import,
         PDF preview, error recovery)                       ← 9.5 user validation remaining
    ↓
Phase 5  Optional PIN / encryption (skip if not needed)
    ↓
Phase 10 Distribution & release pipeline (CI, signing,
         auto-update, landing page)
```

**Recommended start:** Phase 9.5 (manual onboarding validation) or Phase 10 (distribution).

**Note:** Phase 5 (optional hardening) is intentionally placed late — security features are opt-in and should not delay the product completeness or distribution work.

---

## 9. Explicit non-goals (do not build)

- VeriFactu, QR tributario, SII, AEAT APIs
- Legal invoice numbering compliance for third parties
- Multi-tenant / cloud accounts
- Email automation (unless you later add as optional module)
- GDPR consent flows (personal single-user tool; keep export/delete for practicality only)
- Replacing your gestoría or official accounting software

---

*This plan supersedes the compliance-focused Phase 3–4 items in [ANALISIS.md](./ANALISIS.md) and reframes the product for personal academy bookkeeping.*

*Last updated: 2026-09-03 — v0.2.0 audit incorporating UI/UX, engineering, and product management review.*

*Doc location: `docs/product/` (see [`docs/README.md`](../README.md)).*
