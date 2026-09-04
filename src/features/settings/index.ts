import { Settings } from "lucide-react";
import type { FeatureModule } from "../../app/navigation/feature-module";
import { SettingsPage } from "./SettingsPage";

export const settingsFeature: FeatureModule = {
  id: "settings",
  navItem: { icon: Settings, labelKey: "nav.settings", section: "config" },
  routes: [{ path: "settings", component: SettingsPage }],
};
