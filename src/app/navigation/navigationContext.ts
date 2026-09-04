import { createContext, useContext } from "react";
import type { NavigationAction, ViewId } from "./types";

export type NavigationState = {
  activeView: ViewId;
  pendingAction: NavigationAction | null;
  navigationEpoch: number;
};

export type NavigationContextValue = NavigationState & {
  navigateTo: (view: ViewId, action?: NavigationAction) => void;
};

export const NavigationContext = createContext<NavigationContextValue | null>(null);

export function useNavigationContext(): NavigationContextValue {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within NavigationProvider");
  }
  return context;
}
