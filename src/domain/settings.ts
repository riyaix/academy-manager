import type { Money } from "./money";
import type { ISODate } from "./shared";

export type TaxMode = "standard" | "custom";
export type LegacyTaxMode = "defecto" | "personalizado";

export type FontSizePreference = "small" | "normal" | "large";

export type OrganizationSettings = {
  legalName: string;
  taxId?: string;
  phone?: string;
  email?: string;
  streetType?: string;
  streetName?: string;
  streetNumber?: string;
  unit?: string;
  postalCode?: string;
  city?: string;
  province?: string;
};

export type TaxSettings = {
  taxMode: TaxMode;
  defaultVatRate: number;
  defaultIncomeTaxReserveRate: number;
  currencySymbol: string;
};

export type FixedCosts = {
  selfEmployedFee: Money;
  rent: Money;
  other: Money;
};

export type AppearanceSettings = {
  brandColor: string;
  /** Relative path under app config, e.g. `logo.png`. */
  logoPath: string | null;
  fontSize: FontSizePreference;
  colorScheme: "system" | "light" | "dark";
  taxIdSeparator: string;
};

export type AppBranding = {
  appName: string;
  appSubtitle: string;
};

export type PrivacySettings = {
  pinEnabled: boolean;
  encryptBackups: boolean;
  encryptDatabase: boolean;
};

export type BackupSettings = {
  autoBackupEnabled: boolean;
  autoBackupFolderPath: string | null;
  lastAutoBackupAt: string | null;
};

export type AppSettings = {
  branding: AppBranding;
  organization: OrganizationSettings;
  tax: TaxSettings;
  appearance: AppearanceSettings;
  fixedCosts: FixedCosts;
  paymentMethods: string[];
  privacy: PrivacySettings;
  backup: BackupSettings;
  locale: "es" | "en";
  updatedAt?: ISODate;
};

export const DEFAULT_PAYMENT_METHODS = [
  "Domiciliación Bancaria",
  "Transferencia",
  "Efectivo",
  "Tarjeta (TPV)",
  "Bizum",
] as const;

export type PaymentMethod = (typeof DEFAULT_PAYMENT_METHODS)[number];

export function normalizeTaxMode(value: string | null | undefined): TaxMode {
  return value === "personalizado" || value === "custom" ? "custom" : "standard";
}
