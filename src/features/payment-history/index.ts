import { Archive } from "lucide-react";
import type { FeatureModule } from "../../app/navigation/feature-module";
import { PaymentHistoryPage } from "./PaymentHistoryPage";

export const paymentHistoryFeature: FeatureModule = {
  id: "payment-history",
  navItem: { icon: Archive, labelKey: "nav.paymentHistory", section: "billing" },
  routes: [
    {
      path: "payment-history",
      component: PaymentHistoryPage,
      remountOnActions: ["morosos"],
    },
  ],
};
