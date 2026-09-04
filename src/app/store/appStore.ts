import { create } from "zustand";
import type { ClassGroup } from "../../domain/group";
import type { Course } from "../../domain/course";
import type { Enrollment } from "../../domain/enrollment";
import type { PaymentRecord } from "../../domain/payment-record";
import type { Student } from "../../domain/student";
import type { FixedCosts, OrganizationSettings, TaxMode } from "../../domain/settings";
import { createEmptyPersistedState, createMockAppState } from "../../core/storage/mockAppState";
import { isTauriRuntime } from "../../core/storage/runtime";
import { createPersistedSetter } from "./persistedSetter";

export type AppStoreState = {
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
  setAppName: (value: string) => void;
  setAppSubtitle: (value: string) => void;
  setTaxMode: (value: TaxMode) => void;
  setDefaultVatRate: (value: number) => void;
  setDefaultIncomeTaxReserveRate: (value: number) => void;
  setCurrencySymbol: (value: string) => void;
  setPaymentRecordSeq: (value: Record<string, number>) => void;
  setBrandColor: (value: string) => void;
  setLogoDataUrl: (value: string | null) => void;
  setTaxIdSeparator: (value: string) => void;
  setStudents: (value: Student[]) => void;
  setCourses: (value: Course[]) => void;
  setPaymentRecords: (value: PaymentRecord[]) => void;
  setClassGroups: (value: ClassGroup[]) => void;
  setEnrollments: (value: Enrollment[]) => void;
  setFixedCosts: (value: FixedCosts) => void;
  setOrganization: (value: OrganizationSettings) => void;
  setFontSize: (value: string) => void;
  setFontPreset: (value: string) => void;
  setColorScheme: (value: string) => void;
  setAutoBackupEnabled: (value: boolean) => void;
  setAutoBackupFolderPath: (value: string | null) => void;
  setLastAutoBackupAt: (value: string | null) => void;
  setOnboardingCompleted: (value: boolean) => void;
};

const initialState = isTauriRuntime() ? createEmptyPersistedState() : createMockAppState();

export const useAppStore = create<AppStoreState>((set) => ({
  ...initialState,
  setAppName: createPersistedSetter("appName", set),
  setAppSubtitle: createPersistedSetter("appSubtitle", set),
  setTaxMode: createPersistedSetter("taxMode", set),
  setDefaultVatRate: createPersistedSetter("defaultVatRate", set),
  setDefaultIncomeTaxReserveRate: createPersistedSetter("defaultIncomeTaxReserveRate", set),
  setCurrencySymbol: createPersistedSetter("currencySymbol", set),
  setPaymentRecordSeq: createPersistedSetter("paymentRecordSeq", set),
  setBrandColor: createPersistedSetter("brandColor", set),
  setLogoDataUrl: createPersistedSetter("logoDataUrl", set),
  setTaxIdSeparator: createPersistedSetter("taxIdSeparator", set),
  setStudents: createPersistedSetter("students", set),
  setCourses: createPersistedSetter("courses", set),
  setPaymentRecords: createPersistedSetter("paymentRecords", set),
  setClassGroups: createPersistedSetter("classGroups", set),
  setEnrollments: createPersistedSetter("enrollments", set),
  setFixedCosts: createPersistedSetter("fixedCosts", set),
  setOrganization: createPersistedSetter("organization", set),
  setFontSize: createPersistedSetter("fontSize", set),
  setFontPreset: createPersistedSetter("fontPreset", set),
  setColorScheme: createPersistedSetter("colorScheme", set),
  setAutoBackupEnabled: createPersistedSetter("autoBackupEnabled", set),
  setAutoBackupFolderPath: createPersistedSetter("autoBackupFolderPath", set),
  setLastAutoBackupAt: createPersistedSetter("lastAutoBackupAt", set),
  setOnboardingCompleted: createPersistedSetter("onboardingCompleted", set),
}));
