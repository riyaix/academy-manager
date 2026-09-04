# Feature module template

Copy this folder to `src/features/<your-feature>/` and follow the checklist below.

```bash
cp -r src/features/_template src/features/my-feature
```

Rename files (`TemplatePage` → `MyFeaturePage`, `templateFeature` → `myFeatureFeature`, etc.) and delete this README section when done.

---

## New feature checklist

Use this for every new screen or domain area.

### 1. Domain

- [ ] Add or extend types in `src/domain/<entity>.ts` (pure TypeScript, no React).
- [ ] Add business rules / calculators as exported functions in `domain/`.
- [ ] Add Vitest tests for non-trivial domain logic.

### 2. Persistence (if needed)

- [ ] Define repository interface in `src/core/storage/`.
- [ ] Implement SQLite adapter when Phase 3 lands; until then document the contract.

### 3. Feature folder

- [ ] Copy `_template/` → `features/<name>/`.
- [ ] Implement `<Name>Page.tsx` using `core/components` primitives.
- [ ] Split large UI into `components/`; extract logic into `hooks/`.
- [ ] Export `FeatureModule` from `index.ts`:

```ts
export const myFeature: FeatureModule = {
  id: "my-feature",
  navItem: { icon: SomeIcon, labelKey: "nav.myFeature", section: "academy" },
  routes: [{ path: "myViewId", component: MyFeaturePage }],
};
```

### 4. i18n

- [ ] Add keys under `src/locales/es/translation.json`.
- [ ] Mirror the same keys in `src/locales/en/translation.json`.
- [ ] Use `t('myFeature.key')` — no hardcoded UI strings.

### 5. Navigation

- [ ] Add view id to `ViewId` in `app/navigation/types.ts`.
- [ ] Register in `registeredFeatures` inside `app/navigation/registry.ts`.
- [ ] Wire render path in `App.tsx` (temporary until registry-driven routing).

### 6. Cross-feature data

- [ ] Use repositories or `domain/` services — **never** import another feature folder.
- [ ] Dashboard quick actions: `navigateTo('myViewId', 'nuevo')` via `useNavigation()`.

### 7. Finish

- [ ] Run `npm run check`.
- [ ] Update `CHANGELOG.md` for user-visible changes.
- [ ] Remove template-only files (`formatGreeting.*`) if you copied them verbatim.

---

## `FeatureModule` fields

| Field     | Purpose                                                        |
| --------- | -------------------------------------------------------------- |
| `id`      | Stable slug; matches folder name                               |
| `navItem` | Sidebar icon, i18n label key, section                          |
| `routes`  | `path` (`ViewId`), page component, optional `remountOnActions` |
| `onInit`  | Optional async bootstrap at app start                          |

## Example files in this template

| File                           | Demonstrates                                    |
| ------------------------------ | ----------------------------------------------- |
| `index.ts`                     | `FeatureModule` export                          |
| `TemplatePage.tsx`             | Page using `Card`, `Button`, i18n               |
| `components/TemplateHint.tsx`  | Small composed UI                               |
| `hooks/useTemplateGreeting.ts` | Hook + derived state                            |
| `formatGreeting.ts`            | Pure helper (prefer `domain/` for shared rules) |
| `formatGreeting.test.ts`       | Vitest placeholder                              |

**Do not register `templateFeature` in production** — it exists only as documentation.
