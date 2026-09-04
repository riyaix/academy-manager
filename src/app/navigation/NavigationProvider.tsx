import { useCallback, useMemo, useState, type ReactNode } from "react";
import type { NavigationAction, ViewId } from "./types";
import { NavigationContext, type NavigationState } from "./navigationContext";

type NavigationProviderProps = {
  children: ReactNode;
};

export function NavigationProvider({ children }: NavigationProviderProps) {
  const [state, setState] = useState<NavigationState>({
    activeView: "dashboard",
    pendingAction: null,
    navigationEpoch: 0,
  });

  const navigateTo = useCallback((view: ViewId, action?: NavigationAction) => {
    setState((current) => ({
      activeView: view,
      pendingAction: action ?? null,
      navigationEpoch: action ? current.navigationEpoch + 1 : current.navigationEpoch,
    }));
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      navigateTo,
    }),
    [state, navigateTo],
  );

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}
