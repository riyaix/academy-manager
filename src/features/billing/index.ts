import { FileText } from "lucide-react";
import type { FeatureModule } from "../../app/navigation/feature-module";
import { BillingPage } from "./BillingPage";

export const billingFeature: FeatureModule = {
  id: "billing",
  navItem: { icon: FileText, labelKey: "nav.newPaymentRecord", section: "billing" },
  routes: [
    {
      path: "billing",
      component: BillingPage,
      remountOnActions: ["lote", "manual"],
    },
  ],
};
