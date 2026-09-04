/** SQLite file name in the Tauri app config directory. */
export const DATABASE_FILE = "facturador.db";

/** Connection string passed to `@tauri-apps/plugin-sql`. */
export const DATABASE_CONNECTION = `sqlite:${DATABASE_FILE}`;

/** Application schema version — keep in sync with Rust migrations. */
export const CURRENT_SCHEMA_VERSION = 3;

/** `settings_sections.section_key` values for `AppSettings` slices. */
export const SETTINGS_SECTION_KEYS = [
  "branding",
  "organization",
  "tax",
  "appearance",
  "fixed_costs",
  "privacy",
  "locale",
  "backup",
] as const;

export type SettingsSectionKey = (typeof SETTINGS_SECTION_KEYS)[number];

/** Table names for repositories and backup tooling. */
export const TABLE_NAMES = {
  schemaVersion: "schema_version",
  students: "students",
  courses: "courses",
  classGroups: "class_groups",
  enrollments: "enrollments",
  paymentRecords: "payment_records",
  paymentRecordLineItems: "payment_record_line_items",
  paymentRecordCounters: "payment_record_counters",
  settingsSections: "settings_sections",
  paymentMethods: "payment_methods",
} as const;
