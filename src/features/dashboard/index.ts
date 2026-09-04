import { LayoutDashboard } from "lucide-react";
import type { FeatureModule } from "../../app/navigation/feature-module";
import { DashboardPage } from "./DashboardPage";

export const dashboardFeature: FeatureModule = {
  id: "dashboard",
  navItem: { icon: LayoutDashboard, labelKey: "nav.dashboard", section: "main" },
  routes: [{ path: "dashboard", component: DashboardPage }],
};
