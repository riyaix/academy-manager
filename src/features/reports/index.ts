import { ChartColumn } from "lucide-react";
import type { FeatureModule } from "../../app/navigation/feature-module";
import { ReportsPage } from "./ReportsPage";

export const reportsFeature: FeatureModule = {
  id: "reports",
  navItem: { icon: ChartColumn, labelKey: "nav.reports", section: "billing" },
  routes: [{ path: "reports", component: ReportsPage }],
};
