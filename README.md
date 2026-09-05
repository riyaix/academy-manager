# Academy Manager

[![CI](https://github.com/riyaix/academy-manager/actions/workflows/ci.yml/badge.svg)](https://github.com/riyaix/academy-manager/actions/workflows/ci.yml)

Local-first desktop app for **academy management** and **private bookkeeping**. Track students, courses, enrollments, and internal payment records — not legal invoicing.

Built with **Tauri 2**, **React 19**, **TypeScript**, **Tailwind CSS 4**, and **SQLite**.

## Features

### Students

- Master-detail list with side panel
- CSV and Excel import with column mapping, duplicate detection, and import log
- CSV and PDF export of the current list

### Courses and class groups

- Course catalog with monthly fees
- Class groups with capacity, schedule, weekdays, and color labels
- Enrollment management per group

### Calendar

- Daily, weekly, and monthly views
- Today column highlight and locale-aware long dates
- Group sessions with capacity at a glance

### Billing

- Batch monthly payment records by billing period and groups
- Manual one-off payment records
- Duplicate billing warnings for the same period
- Sequential record numbers and tax settings from organization preferences

### Payment history

- Filterable list of paid, pending, and voided records
- In-app PDF receipt preview
- CSV and PDF export of filtered results

### Reports

- Monthly income bar chart (collected vs pending)
- Payment status breakdown
- Top students by revenue
- Overdue aging buckets
- Optional date range filter

### Dashboard

- Active students, groups, occupancy, and alerts
- Today’s classes and pending payments
- Quick link to batch billing

### Search and navigation

- Global search palette (`Ctrl+K`) across students, payments, courses, and groups
- Keyboard shortcuts for common actions (`Ctrl+N`, `Ctrl+?`, and more)

### Settings and data

- Organization name, logo, locale (Spanish default, English available)
- Tax mode and rates for internal records
- Theme (system / light / dark) and font size
- One-click backup and restore (`.academy-manager-backup.zip`)
- Optional weekly auto-backup to a folder you choose
- First-run onboarding wizard

## What this app is not

- Legal invoicing or AEAT / VeriFactu compliance
- Multi-user cloud sync
- Mandatory encryption or login (optional hardening only)

## Download

Installers for **Linux Mint / Ubuntu** (`.deb`, AppImage) and **Windows** (`.msi`) are published on [GitHub Releases](https://github.com/riyaix/academy-manager/releases).

Push a version tag and GitHub Actions builds and attaches the bundles automatically:

```bash
# Bump version in package.json, src-tauri/tauri.conf.json, src-tauri/Cargo.toml, CHANGELOG.md
git tag v0.3.0
git push origin main
git push origin v0.3.0
```

**One-time GitHub setup:** Settings → Actions → General → **Read and write permissions**. Settings → Pages → Source: **GitHub Actions**.

## Requirements (development)

- [Node.js](https://nodejs.org/) **22+** (required for in-memory SQLite tests; CI uses Node 22)
- [Rust](https://www.rust-lang.org/tools/install) (Tauri desktop builds)
- **Linux:** WebKitGTK 4.1 and build tools ([Tauri prerequisites](https://v2.tauri.app/start/prerequisites/))
- **Windows:** WebView2 + [C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)

## Development

```bash
npm install
npm run dev          # web-only (mock data)
npm run tauri dev    # desktop app with SQLite
npm run check        # typecheck + lint + format
npm test             # Vitest
npm run build        # production frontend
```

## Project layout

```
src/
├── app/           # Shell, navigation registry, global store
├── core/          # Shared UI, storage, backup, PDF
├── domain/        # Pure types and business rules
├── features/      # Self-contained feature modules
└── locales/       # i18n (es default, en secondary)
```

Each feature registers in `app/navigation/registry.ts` and must not import sibling features directly.

## Keyboard shortcuts

| Shortcut       | Action                    |
| -------------- | ------------------------- |
| `Ctrl+K`       | Global search             |
| `Ctrl+N`       | New student               |
| `Ctrl+Shift+N` | New manual payment record |
| `Ctrl+1`       | Dashboard                 |
| `Ctrl+2`       | Students                  |
| `Ctrl+3`       | Billing                   |
| `Ctrl+,`       | Settings                  |
| `Ctrl+?`       | Shortcuts help            |

## License

Copyright (c) 2026 riyaix

Academy Manager is free software: you can redistribute it and/or modify it under the terms of the [GNU General Public License v3.0 or later](LICENSE).

This program is distributed **as is**, without warranty of any kind. If you distribute a modified version, you must release the corresponding source under the same license.
