import type { NavigationAction, ViewId } from "./types";
import { registeredFeatures } from "./registry";

export function findActiveRoute(activeView: ViewId) {
  for (const feature of registeredFeatures) {
    const route = feature.routes.find((item) => item.path === activeView);
    if (route) return { feature, route };
  }
  return null;
}

export function shouldRemountRoute(
  remountOnActions: NavigationAction[] | undefined,
  pendingAction: NavigationAction | null,
): boolean {
  if (!pendingAction || !remountOnActions?.length) return false;
  return remountOnActions.includes(pendingAction);
}

export type ActiveRouteMatch = NonNullable<ReturnType<typeof findActiveRoute>>;
