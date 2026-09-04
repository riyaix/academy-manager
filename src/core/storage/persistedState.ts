import type { ClassGroup } from "../../domain/group";
import type { Course } from "../../domain/course";
import type { Enrollment } from "../../domain/enrollment";
import type { PaymentRecord } from "../../domain/payment-record";
import type { Student } from "../../domain/student";
import type { FixedCosts, OrganizationSettings, TaxMode } from "../../domain/settings";
import { toMoney } from "../../domain/money";

export type PersistedAppState = {
  appName: string;
  appSubtitle: string;
  taxMode: TaxMode;
  defaultVatRate: number;
  defaultIncomeTaxReserveRate: number;
  currencySymbol: string;
  paymentMethods: string[];
  paymentRecordSeq: Record<string, number>;
  brandColor: string;
  logoPath: string | null;
  logoDataUrl: string | null;
  taxIdSeparator: string;
  students: Student[];
  courses: Course[];
  paymentRecords: PaymentRecord[];
  classGroups: ClassGroup[];
  enrollments: Enrollment[];
  fixedCosts: FixedCosts;
  organization: OrganizationSettings;
  fontSize: string;
  fontPreset: string;
  colorScheme: string;
  autoBackupEnabled: boolean;
  autoBackupFolderPath: string | null;
  lastAutoBackupAt: string | null;
  onboardingCompleted: boolean;
};

export function pickPersistedState(state: PersistedAppState): PersistedAppState {
  return {
    appName: state.appName,
    appSubtitle: state.appSubtitle,
    taxMode: state.taxMode,
    defaultVatRate: state.defaultVatRate,
    defaultIncomeTaxReserveRate: state.defaultIncomeTaxReserveRate,
    currencySymbol: state.currencySymbol,
    paymentMethods: state.paymentMethods,
    paymentRecordSeq: state.paymentRecordSeq,
    brandColor: state.brandColor,
    logoPath: state.logoPath,
    logoDataUrl: state.logoDataUrl,
    taxIdSeparator: state.taxIdSeparator,
    students: state.students,
    courses: state.courses,
    paymentRecords: state.paymentRecords,
    classGroups: state.classGroups,
    enrollments: state.enrollments,
    fixedCosts: state.fixedCosts,
    organization: state.organization,
    fontSize: state.fontSize,
    fontPreset: state.fontPreset,
    colorScheme: state.colorScheme,
    autoBackupEnabled: state.autoBackupEnabled,
    autoBackupFolderPath: state.autoBackupFolderPath,
    lastAutoBackupAt: state.lastAutoBackupAt,
    onboardingCompleted: state.onboardingCompleted,
  };
}

export const defaultOrganization: OrganizationSettings = {
  legalName: "Mi Academia",
  taxId: "",
  phone: "",
  email: "",
  streetType: "Calle",
  streetName: "",
  streetNumber: "",
  unit: "",
  postalCode: "",
  city: "",
  province: "",
};

export const defaultFixedCosts: FixedCosts = {
  selfEmployedFee: toMoney(300),
  rent: toMoney(0),
  other: toMoney(0),
};
