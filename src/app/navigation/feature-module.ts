import type { ComponentType } from "react";
import type { LucideIcon } from "lucide-react";
import type { NavigationAction, ViewId } from "./types";

/** Sidebar grouping used by the app shell. */
export type NavSection = "main" | "billing" | "academy" | "config";

/** Navigation metadata contributed by a feature module. */
export type FeatureNavItem = {
  icon: LucideIcon;
  labelKey: string;
  section?: NavSection;
};

/**
 * A routable view owned by a feature.
 * `path` maps to `ViewId` until client-side routing is introduced in Phase 2.
 */
export type FeatureRoute = {
  path: ViewId;
  component: ComponentType;
  /** Remount when navigating with one of these actions (e.g. dashboard quick actions). */
  remountOnActions?: NavigationAction[];
};

/**
 * Public contract for every feature under `src/features/<name>/`.
 * Export a single object from `index.ts` and register it in `registry.ts`.
 */
export type FeatureModule = {
  /** Stable slug — folder name, e.g. `students`. */
  id: string;
  navItem: FeatureNavItem;
  routes: FeatureRoute[];
  /** Optional bootstrap (store hydration, migrations). Runs once at app start. */
  onInit?: () => void | Promise<void>;
};
