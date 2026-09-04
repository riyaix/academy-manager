# Archived dashboard panels

These panels are **archived** and **not rendered** in the current dashboard UI:

- `FixedCostsPanel.jsx` — fixed costs UI
- `IncomeTaxReserveHint.jsx` — income / IRPF (income tax reserve) hint UI

Income charts, Analytics Performance, and IRPF/VAT settings copy were also removed from the live dashboard and billing header. Domain modules under `src/domain/` (income summary, fixed costs, income-tax reserve) and their tests are kept for a future restore.

## How to restore

1. Move the panel files back to `src/features/dashboard/components/`.
2. Wire them into `DashboardView` (imports and render placement).
3. Re-enable any settings / billing tax UI if you need VAT/IRPF configuration again.
4. Confirm i18n keys and store hooks the panels expect are still available.
