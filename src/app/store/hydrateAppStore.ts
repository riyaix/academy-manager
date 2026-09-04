import { loadPersistedAppState } from "../../core/storage/appStatePersistence";
import { seedDatabaseIfEmpty } from "../../core/storage/seedDatabase";
import { useAppStore } from "./appStore";

export async function hydrateAppStore(): Promise<void> {
  await seedDatabaseIfEmpty();
  const state = await loadPersistedAppState();
  useAppStore.setState(state);
}
