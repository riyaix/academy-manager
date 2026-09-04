import { debounceByKey } from "../../core/storage/debounce";
import { persistAppStoreField } from "../../core/storage/appStatePersistence";
import type { PersistedAppState } from "../../core/storage/persistedState";
import { pickPersistedState } from "../../core/storage/persistedState";
import { isTauriRuntime } from "../../core/storage/runtime";
import type { AppStoreState } from "./appStore";
import { useAppStore } from "./appStore";

const PERSIST_DEBOUNCE_MS = 300;

export function createPersistedSetter<K extends keyof AppStoreState>(
  field: K,
  set: (partial: Partial<AppStoreState>) => void,
): (value: AppStoreState[K]) => void {
  return (value: AppStoreState[K]) => {
    set({ [field]: value } as Partial<AppStoreState>);

    if (!isTauriRuntime()) return;

    debounceByKey(String(field), PERSIST_DEBOUNCE_MS, () => {
      const current = pickPersistedState(useAppStore.getState());
      void persistAppStoreField(
        field as keyof PersistedAppState,
        current[field as keyof PersistedAppState],
        current,
      );
    });
  };
}
