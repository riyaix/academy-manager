import { useTranslation } from "react-i18next";
import { useNavigation } from "./navigation/useNavigation";
import { findActiveRoute, shouldRemountRoute } from "./navigation/activeRoute";
import { FeatureErrorBoundary } from "../core/components/FeatureErrorBoundary";

export function FeatureViewport() {
  const { t } = useTranslation();
  const { activeView, pendingAction, navigationEpoch } = useNavigation();
  const match = findActiveRoute(activeView);
  if (!match) return null;

  const { route } = match;
  const Component = route.component;
  const remount = shouldRemountRoute(route.remountOnActions, pendingAction);
  const key = remount ? `${route.path}-${navigationEpoch}` : route.path;

  return (
    <FeatureErrorBoundary
      key={key}
      title={t("errors.featureTitle")}
      body={t("errors.featureBody")}
      reloadLabel={t("errors.reload")}
    >
      <Component />
    </FeatureErrorBoundary>
  );
}
