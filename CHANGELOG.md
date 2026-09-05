# Changelog

All notable user-visible changes to Academy Manager are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/) and [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.3.0] - 2026-09-05

### Changed

- **Rebrand** from Facturador to **Academy Manager** (app title, backups, database file, bundle identifier)
- Backup archives use `.academy-manager-backup.zip` and `academy-manager.db` (no import of legacy Facturador backups)
- GitHub Actions for CI, releases (Linux + Windows), and Pages download site
- README rewritten with full feature list

### Added

- Global search palette (`Ctrl+K`) across students, payments, courses, and groups
- Reports view with monthly income, status breakdown, top students, and overdue aging
- In-app PDF receipt preview from payment history
- Student CSV/Excel import with column mapping, duplicate detection, and import log
- Filtered payment-history PDF export (CSV + PDF on students, courses, and payment history)
- Calendar friendly long dates and today-column highlight

### Fixed

- Reports charts: removed the gray column highlight on bar hover (tooltip only)
- Database startup when schema v1 was stuck behind the app
- SQLite transaction errors on save/hydrate
- Onboarding academy name field losing focus after each keystroke

## [0.2.0] - 2026-07-18

### Added

- Onboarding wizard on first launch
- Keyboard shortcuts with in-app help
- Master-detail students UI
- Domain unit tests for billing and ID logic

### Changed

- First desktop launch seeds an empty database
- Confirm dialogs and toasts replace native `alert` / `confirm`

## [0.1.0] - 2026-03-01

### Added

- Modular features, i18n (es/en), SQLite persistence
- One-click backup/restore and optional auto-backup
- Payment records with sequential IDs, duplicate billing warnings, voided records
- Dashboard income summary, fixed costs, tax reserve hint
- Shared PDF service for internal payment receipts

[0.3.0]: https://github.com/riyaix/academy-manager/releases/tag/v0.3.0
[0.2.0]: https://github.com/riyaix/academy-manager/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/riyaix/academy-manager/releases/tag/v0.1.0
