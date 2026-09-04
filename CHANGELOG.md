# Changelog

All notable user-visible changes to Facturador are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/) and [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Fixed

- Database startup when schema v1 was stuck behind the app (edited initial migration checksum blocked sqlx upgrades; pending column migrations now repair on open)
- SQLite `cannot commit - no transaction is active` on save/hydrate — transactions now run on one Rust connection instead of pooled `BEGIN`/`COMMIT` calls
- Onboarding academy name field losing focus after each keystroke (Modal re-focused on unstable `onClose`)

### Added

- English domain model end-to-end in the Zustand store and feature UIs (Phase 8.1)
- Global search palette (`Ctrl+K`) across students, payments, courses, and groups
- Sidebar **Search** entry under General Settings (opens the same palette)
- Reports view with monthly income, status breakdown, top students, and overdue aging
- In-app PDF receipt preview from payment history
- Feature-level error boundary with reload
- Student CSV/Excel import with column mapping, duplicate detection, and import log
- Filtered payment-history PDF export (CSV + PDF on students, courses, and payment history)
- Calendar friendly long dates and today-column highlight

### Changed

- Settings JSON loader normalizes legacy Spanish organization / fixed-cost shapes on read
- Schema migrations: `group_ids_json` moved to migration v3 (initial schema left immutable)
- Settings: language and backup under Organization & appearance; System preferences tab removed (typography/theme/size archived)
- Native `<select>` styling aligned with the design system

## [0.2.0] - 2026-07-18

### Added

- **Onboarding wizard** on first launch: academy name, locale, optional auto-backup folder (skippable)
- **Keyboard shortcuts** for navigation and common actions (`Ctrl+N`, `Ctrl+?`, etc.) with in-app help
- **Master-detail students UI**: compact list + side panel (usable at 1280px) instead of a 16-column table
- **Domain unit tests** for legacy mappers, weekdays, batch billing edge cases, and ID parsing
- **README** with dev setup, architecture overview, and feature checklist

### Changed

- First desktop launch seeds an **empty database** instead of demo data (browser dev still uses mock data)
- Confirm dialogs and toasts are used consistently (no native `alert` / `confirm`)

## [0.1.0] - 2026-03-01

### Added

- Phase 0–5 foundation: TypeScript, modular features, i18n (es/en), SQLite persistence
- One-click backup/restore, auto-backup option, logo on filesystem
- Payment records with sequential IDs, duplicate billing warnings, voided records
- Dashboard income summary, fixed costs panel, income tax reserve hint
- Period report CSV export, payment method on records
- Shared PDF service for internal payment receipts

[0.2.0]: https://github.com/kholinarx/facturador/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/kholinarx/facturador/releases/tag/v0.1.0
