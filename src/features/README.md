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
| English identifiers in code                         | Legacy abbreviated identifiers              |

## Registration

1. Add `ViewId` in `app/navigation/types.ts` if needed.
2. Export the feature from `features/<name>/index.ts`.
3. Append to `registeredFeatures` in `app/navigation/registry.ts`.

## Registered features

| Feature | Folder | Route |
|---------|--------|-------|
| Dashboard | `dashboard/` | `dashboard` |
| Billing | `billing/` | `billing` |
| Payment history | `payment-history/` | `payment-history` |
| Reports | `reports/` | `reports` |
| Students | `students/` | `students` |
| Courses | `courses/` | `courses` |
| Groups | `groups/` | `groups` |
| Calendar | `calendar/` | `calendar` |
| Settings | `settings/` | `settings` |

See [`_template/README.md`](./_template/README.md) for the full checklist.
