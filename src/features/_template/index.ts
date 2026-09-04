import { FlaskConical } from "lucide-react";
import type { FeatureModule } from "../../app/navigation/feature-module";
import { TemplatePage } from "./TemplatePage";

/**
 * Reference implementation of `FeatureModule`.
 * Do **not** register in `registry.ts` — copy this folder when creating a real feature.
 */
export const templateFeature: FeatureModule = {
  id: "template",
  navItem: {
    icon: FlaskConical,
    labelKey: "template.nav",
    section: "main",
  },
  routes: [{ path: "dashboard", component: TemplatePage }],
};
