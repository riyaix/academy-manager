# Desktop readiness & accessibility review

**Date:** 2 September 2026  
**App version reviewed:** `0.2.0` (`package.json` / `tauri.conf.json`; note `src-tauri/Cargo.toml` still says `0.1.0`)  
**Targets:** Windows 10/11 PC and Linux Mint (Ubuntu-based)  
**Scope:** Ship readiness for personal desktop use, plus accessibility / contrast / typography / related UX polish

---

## Executive summary


| Area                                        | Score        | Verdict                                                                                                          |
| ------------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------- |
| Functional readiness (personal bookkeeping) | **7.5 / 10** | Usable as a local academy tool on both platforms **once you build it yourself**                                  |
| Install / distribute readiness              | **4 / 10**   | No CI release pipeline, no signed Windows installer story, Linux deps documented only briefly                    |
| Cross-platform hardening                    | **6.5 / 10** | Paths via Tauri APIs look solid; window sizing and CSP need work                                                 |
| Accessibility (WCAG-oriented)               | **5.5 / 10** | Good modal/button primitives; uneven in feature screens; dark mode unfinished                                    |
| Color contrast (design tokens)              | **7 / 10**   | Core OKLCH tokens mostly AA; primary-on-white is borderline; many screens still use Tailwind `gray-`* / `blue-`* |
| Typography                                  | **6 / 10**   | Single font token exists; Inter is **not bundled**; Settings presets work                                        |


**Overall for a Windows or Linux Mint daily driver:** about **65–70% ready**.  
Core product (SQLite, backup, billing, i18n, shell) is far enough along for **dev / personal use**. It is **not** yet a one-click “download and install” product for a non-technical user on either OS.

---



## 1. Desktop readiness — Windows & Linux Mint



### 1.1 Stack fit

Facturador is a **Tauri 2** desktop app with a React 19 + TypeScript frontend and SQLite via `tauri-plugin-sql`. That stack is appropriate for both Windows and Linux Mint:


| Layer               | Status             | Notes                                                   |
| ------------------- | ------------------ | ------------------------------------------------------- |
| Windowing / WebView | Ready in principle | Windows → WebView2; Linux Mint → WebKitGTK 4.1          |
| Persistence         | Ready              | SQLite under app data via Tauri `BaseDirectory`         |
| Backup / logo I/O   | Ready              | Rust `PathBuf` + Tauri path API (OS-agnostic)           |
| Dialogs             | Ready              | `tauri-plugin-dialog` for folder/file picks             |
| PDF / CSV           | Ready in UI        | Browser/`jspdf` style downloads; fine in WebView        |
| Bundle config       | Partial            | `bundle.targets: "all"`, icons include `.ico` / `.icns` |




### 1.2 What works for both platforms

- **Local-first data** — no cloud dependency; good for a single academy PC.
- **Backup zip** — export/import is the right recovery story for moving between machines (e.g. Windows desk → Mint laptop).
- **Icons** — `icon.ico` present for Windows; PNG set present for Linux.
- `windows_subsystem = "windows"` in `main.rs` — hides console on release Windows builds.
- **Keyboard shortcuts** treat `Ctrl` and `Meta` equivalently — usable on Windows; on Linux Mint Ctrl works as expected.
- **i18n** — Spanish default + English; fine for Spanish academy owners on either OS.



### 1.3 Windows-specific gaps


| Gap                                          | Impact                                    | Recommendation                                                                |
| -------------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------- |
| No release CI / signed `.msi` or NSIS `.exe` | End users cannot install without building | Add GitHub Actions (or similar) with `tauri-action` for `windows-latest`      |
| WebView2 not configured in `bundle.windows`  | Older Win10 may fail to open UI           | Set `webviewInstallMode` (e.g. `embedBootstrapper` or `downloadBootstrapper`) |
| Code signing absent                          | SmartScreen warnings                      | Optional for personal use; required for “give to a friend” installs           |
| Build tools required for *developers*        | VS Build Tools + C++ workload             | Document clearly in README                                                    |


**Runtime expectation:** Windows 11 and updated Windows 10 usually already have WebView2. That is the main runtime dependency beyond the app binary.

### 1.4 Linux Mint-specific gaps

Linux Mint (based on Ubuntu) is a **good** Tauri 2 host if WebKitGTK **4.1** packages are installed.

Typical packages (Mint / Ubuntu family):

```bash
sudo apt update
sudo apt install libwebkit2gtk-4.1-dev \
  build-essential curl wget file \
  libxdo-dev libssl-dev \
  libayatana-appindicator3-dev librsvg2-dev pkg-config
```


| Gap                                      | Impact                             | Recommendation                                      |
| ---------------------------------------- | ---------------------------------- | --------------------------------------------------- |
| README only mentions deps briefly        | Mint users may hit blank window    | Expand README with Mint/Ubuntu copy-paste block     |
| No packaged `.deb` / AppImage in CI      | Same as Windows — DIY build        | Add Linux job to release pipeline (`ubuntu-22.04`+) |
| WebKit rendering differences vs WebView2 | Occasional CSS/PDF quirks          | Smoke-test on Mint before calling a release “done”  |
| Tray / appindicator                      | Only matters if tray is used later | Keep `libayatana-appindicator3` if tray is added    |




### 1.5 Shared blockers before calling it “PC ready”

1. **Forced desktop size** — `tauri.conf.json` sets `minWidth` / `minHeight` to **1280×800**. That excludes many 13–14″ laptops at 100% scaling and contradicts the project’s own responsive rules. Lower mins (e.g. 1024×640) or drop mins and rely on CSS.
2. **Version drift** — `Cargo.toml` is `0.1.0` while npm/Tauri conf are `0.2.0`. Sync all three before any release.
3. `csp: null` — fine for early MVP; tighten before distributing binaries.
4. **No automated desktop builds** — readiness for “a PC in the academy” requires a reproducible artifact, not only `npm run tauri dev` on a developer machine.
5. **Feature UI still largely** `.jsx` (~10 large managers) — works, but increases risk of regressions when polishing a11y/responsive for release.



### 1.6 Readiness scorecard (ship checklist)


| Checklist item                          | Windows         | Linux Mint      |
| --------------------------------------- | --------------- | --------------- |
| Runs under `tauri dev` with Rust + Node | Yes*            | Yes*            |
| SQLite + backup on real app data dir    | Yes             | Yes             |
| Installer artifact in repo/CI           | No              | No              |
| WebView runtime documented / bundled    | Partial         | Partial         |
| Usable below 1280px width               | No (window min) | No (window min) |
| Signed / SmartScreen-friendly           | No              | N/A             |
| Smoke-tested on target OS               | Unknown         | Unknown         |


Assuming developer prerequisites are installed.

---



## 2. Accessibility

> **Update (3 Sep 2026):** Core a11y + Atkinson Hyperlegible + theme wiring landed. Remaining polish: leftover accent palettes in calendar/courses (purple/indigo/yellow for domain colors), and deeper form-label audits inside large `.jsx` managers.



### 2.1 Strengths (post-fix)

- Bundled **Atkinson Hyperlegible** for all UI text
- Dark/light/system theme with `.dark` tokens applied
- Skip link, `aria-current` on nav, `lang` sync, modal focus restore, reduced-motion CSS
- Shell + most feature surfaces use OKLCH CSS tokens
- Stronger primary contrast; brand color auto-darkened for AA against white

See earlier sections for the original gap analysis (kept for history).

---



## 3. Color & contrast



### 3.1 Design system intent vs reality

**Intent (rules):** OKLCH tokens in `src/index.css`, both themes, no raw hex/hsl in components.

**Reality:** Tokens are defined for light **and** dark, but:

- Feature screens and `AppShell` still use hundreds of Tailwind utilities (`text-gray-*`, `bg-blue-*`, `text-green-*`, …).
- Brand color from Settings is stored; global `--color-primary` is **not** clearly driven by that brand color across the shell.
- Dark theme class is unused → dark token contrast is theoretical until enabled.



### 3.2 Measured contrast (OKLCH tokens)

Approximate WCAG contrast ratios for the semantic tokens in `index.css`:


| Pair                        | Ratio | AA (4.5:1)   | AAA (7:1) |
| --------------------------- | ----- | ------------ | --------- |
| Light text on surface       | ~15.1 | Pass         | Pass      |
| Light muted on surface      | ~5.7  | Pass         | Fail      |
| Light primary + white label | ~4.7  | Pass (tight) | Fail      |
| Light danger + white label  | ~5.4  | Pass         | Fail      |
| Dark text on surface        | ~15.3 | Pass         | Pass      |
| Dark muted on surface       | ~5.8  | Pass         | Fail      |
| Dark muted on muted surface | ~5.0  | Pass         | Fail      |


**Takeaways:**

- Body text tokens are strong.
- **Primary button** (~4.7:1 with white) is only barely AA — avoid lightening primary further; prefer slightly darker `L` (e.g. ~0.48–0.50) for comfortable AA+.
- Muted text is fine for secondary copy under AA, not AAA.
- Sidebar inactive `text-gray-300` on `bg-gray-900` is usually fine, but it bypasses the token system and will fight a future dark/light toggle.



### 3.3 Recommendations

- Darken `--color-primary` slightly for WCAG headroom.  
- Replace shell/feature `gray-*` / `blue-*` with token classes over time.  
- When brand color is user-picked, validate contrast against white/black and fall back or warn.  
- Do not ship dark mode until surfaces using Tailwind greys are migrated or dual-themed.

---



## 4. Fonts & typography



### 4.1 Current setup


| Item                            | Value                                                      |
| ------------------------------- | ---------------------------------------------------------- |
| Global token                    | `--font-family-sans` in `src/index.css`                    |
| Default stack                   | `Inter, ui-sans-serif, system-ui, sans-serif`              |
| Presets (`core/theme/fonts.ts`) | modern (Inter), classic (Georgia…), technical (mono stack) |
| Applied via                     | `useAppearanceEffects` → `applyFontPreset`                 |
| Mono                            | `--font-family-mono` for codes/IDs (good separation)       |




### 4.2 Issues

1. **Inter is not loaded** — no `@font-face`, no npm font package, no link in `index.html`. Unless Inter is installed on the OS, users get **system UI fonts** (Segoe UI on Windows, Ubuntu/Cantarell-ish stacks on Mint). That is acceptable functionally, but the “Inter” preset name overpromises.
2. `App.css` **leftover** — still hardcodes `font-family: Inter, Avenir, …` and hex colors (Vite template residue). `main.tsx` imports `index.css` only; confirm `App.css` is unused and remove it to avoid confusion.
3. **Font size prefs** still use legacy Spanish keys (`pequeña` / `grande`) in `useAppearanceEffects` while domain types prefer English (`small` / `large`) — migration smell; works but fragile.
4. **No dynamic type / OS font scaling audit** — `text-sm` / `text-lg` root classes help; Windows “Make text bigger” + WebView2 should be smoke-tested.
5. **Classic preset uses serif globally** — fine as an option; ensure dense tables remain readable (consider keeping UI chrome sans even when body is serif — optional future refinement).



### 4.3 Recommendations

- Bundle a licensed/open font (e.g. Inter via `@fontsource-variable/inter`) **or** rename preset to “System / Modern” and lead with `system-ui`.  
- Delete or gut `App.css`.  
- Align font-size preference keys with domain English identifiers.  
- Keep changing font only through `--font-family-sans` (already the project rule).

---



## 5. Related UX / polish (desktop-facing)


| Topic                                    | Status                                                                                        |
| ---------------------------------------- | --------------------------------------------------------------------------------------------- |
| Touch targets                            | Core `Button` md ≥ 44px; many legacy icon buttons may be smaller                              |
| Responsive layout                        | CSS has mobile-first patterns; **window min 1280** undoes the benefit on desktop              |
| i18n coverage                            | Dual locales present; keep keys in sync on every UI change                                    |
| Confirmations                            | Custom dialogs for money-adjacent actions — good                                              |
| Empty states / onboarding                | Present — good for first PC install                                                           |
| Security posture for a shared academy PC | No PIN/encryption by default (by design); document that anyone with OS login can open the app |


---



## 6. Suggested path to “ready for a Windows / Mint PC”



### P0 — before handing the app to yourself on another machine

1. Sync versions (`Cargo.toml` → `0.2.0`).
2. Lower or remove `minWidth` / `minHeight`.
3. Produce one Windows installer and one Linux package locally; restore a backup on the target PC.
4. Document Mint/Ubuntu packages and Windows WebView2 + Build Tools in README.



### P1 — before sharing with a non-developer

1. CI matrix: `windows-latest` + Ubuntu (Mint-compatible).
2. Configure WebView2 bootstrapper for Windows bundles.
3. Fix `lang` + wire real theme (or remove unused `.dark` until ready).
4. Darken primary for contrast headroom; start tokenizing `AppShell`.



### P2 — accessibility hardening

1. Landmark/`aria-current` pass.
2. Modal focus restore + form label audit on students/billing.
3. `prefers-reduced-motion`.
4. Bundle fonts or switch default to system stacks explicitly.

---



## 7. Score snapshot (one glance)

```
Desktop daily use (dev build):     ████████░░  ~70%
End-user installer experience:     ████░░░░░░  ~40%
A11y baseline:                     █████░░░░░  ~55%
Contrast (tokens only):            ███████░░░  ~70%
Contrast (actual UI classes):      █████░░░░░  ~55%
Typography system:                 ██████░░░░  ~60%
```

**Bottom line:** On a Windows PC or Linux Mint box, Facturador is **architecturally ready** to run as a local Tauri + SQLite app, but **distribution, window sizing, unfinished theming, and uneven accessibility** keep it below “install and forget” readiness. For personal use after a local `tauri build` and a quick smoke test on the target OS, it is already useful; treat installer + a11y/theme work as the next release gates.