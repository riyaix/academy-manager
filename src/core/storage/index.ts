export {
  CURRENT_SCHEMA_VERSION,
  DATABASE_CONNECTION,
  DATABASE_FILE,
  SETTINGS_SECTION_KEYS,
  TABLE_NAMES,
  type SettingsSectionKey,
} from "./constants";
export { clearLegacyDomainStorage, LEGACY_DOMAIN_STORAGE_KEYS } from "./clearLegacyDomainStorage";
export {
  createDefaultPersistedState,
  createMockAppState,
  defaultFixedCosts,
  defaultOrganization,
} from "./defaultAppState";
export { closeDatabase, getDatabase, initializeDatabase, type SchemaVersionRow } from "./database";
export {
  ensureSchemaCurrent,
  getMigration,
  getSchemaVersion,
  migrate,
  SCHEMA_MIGRATIONS,
  SCHEMA_MIGRATION_VERSIONS,
  type DataMigrationFn,
  type SchemaMigration,
  type SchemaVersionInfo,
} from "./migrations";
export { loadPersistedAppState, persistAppStoreField } from "./appStatePersistence";
export type { PersistedAppState } from "./persistedState";
export { isDatabaseEmpty, persistFullAppState, seedDatabaseIfEmpty } from "./seedDatabase";
export {
  classGroupRepository,
  courseRepository,
  enrollmentRepository,
  paymentMethodRepository,
  paymentRecordCounterRepository,
  paymentRecordRepository,
  settingsRepository,
  studentRepository,
} from "./repositories";
