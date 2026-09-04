import type { FeatureModule, NavSection } from "./feature-module";
import type { ViewId } from "./types";
import type { LucideIcon } from "lucide-react";
import { billingFeature } from "../../features/billing";
import { calendarFeature } from "../../features/calendar";
import { coursesFeature } from "../../features/courses";
import { dashboardFeature } from "../../features/dashboard";
import { groupsFeature } from "../../features/groups";
import { paymentHistoryFeature } from "../../features/payment-history";
import { reportsFeature } from "../../features/reports";
import { settingsFeature } from "../../features/settings";
import { studentsFeature } from "../../features/students";

export type { FeatureModule, FeatureNavItem, FeatureRoute, NavSection } from "./feature-module";

export type NavItem = {
  id: ViewId;
  icon: LucideIcon;
  labelKey: string;
  section?: NavSection;
};

export function navItemsFromFeatures(features: FeatureModule[]): NavItem[] {
  return features.flatMap((feature) =>
    feature.routes.map((route) => ({
      id: route.path,
      icon: feature.navItem.icon,
      labelKey: feature.navItem.labelKey,
      section: feature.navItem.section,
    })),
  );
}

export const registeredFeatures: FeatureModule[] = [
  dashboardFeature,
  billingFeature,
  paymentHistoryFeature,
  reportsFeature,
  studentsFeature,
  coursesFeature,
  groupsFeature,
  calendarFeature,
  settingsFeature,
];

export function getNavItem(viewId: ViewId): NavItem | undefined {
  return navItemsFromFeatures(registeredFeatures).find((item) => item.id === viewId);
}
