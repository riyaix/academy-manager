# Feature modules

Self-contained screens live under `src/features/<name>/`. Each feature exports a `FeatureModule` from `index.ts` and registers in `app/navigation/registry.ts`.

**Start here:** copy [`_template/`](./_template/) when adding a new feature.

## Layout

```
features/<name>/
├── index.ts              # FeatureModule export (public API)
├── <Name>Page.tsx        # Route entry component
├── components/           # Feature-only UI pieces
├── hooks/                # Feature-only hooks
├── <helper>.ts           # Optional local pure helpers
└── <helper>.test.ts      # Domain / helper tests (Vitest)
```

## Rules

| Do                                                  | Don't                                       |
| --------------------------------------------------- | ------------------------------------------- |
| Import from `core/`, `domain/`, `app/navigation`    | Import sibling features (`../students/...`) |
| Read data via repositories (`core/storage/`)        | Reach into another feature's store          |
| User strings via `t('feature.key')` in both locales | Hardcode Spanish/English in JSX             |
| English identifiers in code                         | `COD_CLI`, `db_clientes`, etc.              |

## Registration (Phase 2+)

1. Add `ViewId` in `app/navigation/types.ts` if needed.
2. Export `yourFeature` from `features/<name>/index.ts`.
3. Append to `registeredFeatures` in `app/navigation/registry.ts`.

The app shell (`AppShell` + `FeatureViewport`) renders routes from the registry automatically.

## Registered features (Phase 2)

| Feature | Folder | Route (`ViewId`) |
|---------|--------|------------------|
| Dashboard | `dashboard/` | `dashboard` |
| Billing | `billing/` | `factura` |
| Payment history | `payment-history/` | `historial` |
| Students | `students/` | `clientes` |
| Courses | `courses/` | `productos` |
| Groups | `groups/` | `grupos` |
| Calendar | `calendar/` | `calendario` |
| Settings | `settings/` | `ajustes` |

Each feature exposes a `hooks/use*Store.ts` selector over the shared `appStore` (legacy `localStorage` keys preserved until Phase 3).

## Checklist

See [`_template/README.md`](./_template/README.md) for the step-by-step checklist.
