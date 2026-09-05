import type { FixedCosts, OrganizationSettings } from "../../../domain/settings";
import { SETTINGS_SECTION_KEYS, TABLE_NAMES } from "../constants";
import { getDatabase } from "../database";
import { migrateAppearanceLogoToFilesystem } from "../migrateAppearanceLogo";
import { runInTransaction } from "../sql";
import { normalizeTaxMode } from "../../../domain/settings";
import {
  fixedCostsToLegacyFixedCosts,
  legacyFixedCostsToFixedCosts,
} from "../../../domain/legacy-mappers";
import type { LegacyFixedCosts, LegacyOrganizationSettings } from "../../../domain/legacy";

export type BrandingSettings = {
  appName: string;
  appSubtitle: string;
  onboardingCompleted: boolean;
};

export type TaxSettingsSlice = {
  taxMode: string;
  defaultVatRate: number;
  defaultIncomeTaxReserveRate: number;
  currencySymbol: string;
};

export type AppearanceSettingsSlice = {
  brandColor: string;
  logoPath: string | null;
  fontSize: string;
  fontPreset: string;
  /** Absent in older backups — treat as `"system"`. */
  colorScheme?: string;
  taxIdSeparator: string;
};

export type BackupSettingsSlice = {
  autoBackupEnabled: boolean;
  autoBackupFolderPath: string | null;
  lastAutoBackupAt: string | null;
};

export type AppSettingsSnapshot = {
  branding: BrandingSettings;
  organization: OrganizationSettings;
  tax: TaxSettingsSlice;
  appearance: AppearanceSettingsSlice;
  fixedCosts: FixedCosts;
  backup: BackupSettingsSlice;
};

type SettingsSectionRow = {
  section_key: string;
  data_json: string;
};

const DEFAULT_BACKUP_SETTINGS: BackupSettingsSlice = {
  autoBackupEnabled: false,
  autoBackupFolderPath: null,
  lastAutoBackupAt: null,
};

function parseSection<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function isLegacyOrganization(value: unknown): value is LegacyOrganizationSettings {
  return Boolean(value && typeof value === "object" && "nombre" in value);
}

function isLegacyFixedCosts(value: unknown): value is LegacyFixedCosts {
  return Boolean(value && typeof value === "object" && "autonomo" in value);
}

function normalizeOrganization(
  value: unknown,
  fallback: OrganizationSettings,
): OrganizationSettings {
  if (!value || typeof value !== "object") return fallback;
  if (isLegacyOrganization(value)) {
    return {
      legalName: value.nombre,
      taxId: value.cif,
      phone: value.telefono,
      email: value.email,
      streetType: value.tipoVia,
      streetName: value.direccion,
      streetNumber: value.numero,
      unit: value.puerta,
      postalCode: value.cp,
      city: value.ciudad,
      province: value.provincia,
    };
  }
  return parseSection(JSON.stringify(value), fallback);
}

function normalizeFixedCosts(value: unknown, fallback: FixedCosts): FixedCosts {
  if (!value || typeof value !== "object") return fallback;
  if (isLegacyFixedCosts(value)) {
    return legacyFixedCostsToFixedCosts(value);
  }
  return parseSection(JSON.stringify(value), fallback);
}

export async function loadAppSettings(defaults: AppSettingsSnapshot): Promise<AppSettingsSnapshot> {
  const db = await getDatabase();
  const rows = await db.select<SettingsSectionRow[]>(
    `SELECT section_key, data_json FROM ${TABLE_NAMES.settingsSections}`,
  );

  const byKey = new Map(rows.map((row) => [row.section_key, row.data_json]));
  const appearance = parseSection(byKey.get("appearance") ?? "", defaults.appearance);
  const migratedAppearance = await migrateAppearanceLogoToFilesystem(appearance);
  const shouldPersistAppearance =
    migratedAppearance.logoPath !== appearance.logoPath ||
    (appearance as AppearanceSettingsSlice & { logoDataUrl?: string | null }).logoDataUrl != null;

  const rawOrganization = parseSection(byKey.get("organization") ?? "", defaults.organization);
  const rawFixedCosts = parseSection(byKey.get("fixed_costs") ?? "", defaults.fixedCosts);
  const rawTax = parseSection(byKey.get("tax") ?? "", defaults.tax);

  const snapshot: AppSettingsSnapshot = {
    branding: parseSection(byKey.get("branding") ?? "", defaults.branding),
    organization: normalizeOrganization(rawOrganization, defaults.organization),
    tax: {
      ...rawTax,
      taxMode: normalizeTaxMode(rawTax.taxMode),
    },
    appearance: migratedAppearance,
    fixedCosts: normalizeFixedCosts(rawFixedCosts, defaults.fixedCosts),
    backup: parseSection(byKey.get("backup") ?? "", defaults.backup),
  };

  if (shouldPersistAppearance) {
    await saveAppSettings(snapshot);
  }

  return snapshot;
}

export async function saveAppSettings(snapshot: AppSettingsSnapshot): Promise<void> {
  const db = await getDatabase();
  const sections: Array<[string, unknown]> = [
    ["branding", snapshot.branding],
    ["organization", snapshot.organization],
    ["tax", { ...snapshot.tax, taxMode: normalizeTaxMode(snapshot.tax.taxMode) }],
    ["appearance", snapshot.appearance],
    ["fixed_costs", snapshot.fixedCosts],
    ["backup", snapshot.backup],
  ];

  await runInTransaction(db, async (tx) => {
    for (const [key, data] of sections) {
      if (!SETTINGS_SECTION_KEYS.includes(key as (typeof SETTINGS_SECTION_KEYS)[number])) {
        continue;
      }
      await tx.execute(
        `INSERT INTO ${TABLE_NAMES.settingsSections} (section_key, data_json, updated_at)
         VALUES ($1, $2, datetime('now'))
         ON CONFLICT(section_key) DO UPDATE SET
           data_json = excluded.data_json,
           updated_at = datetime('now')`,
        [key, JSON.stringify(data)],
      );
    }
  });
}

/** Keep legacy JSON shape available for older backup tooling if needed. */
export function toLegacyFixedCostsJson(costs: FixedCosts): LegacyFixedCosts {
  return fixedCostsToLegacyFixedCosts(costs);
}

export const settingsRepository = {
  load: loadAppSettings,
  save: saveAppSettings,
  defaultBackupSettings: DEFAULT_BACKUP_SETTINGS,
};
