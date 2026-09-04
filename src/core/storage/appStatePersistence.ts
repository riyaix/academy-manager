import type { ClassGroup } from "../../domain/group";
import type { Course } from "../../domain/course";
import type { Enrollment } from "../../domain/enrollment";
import type { PaymentRecord } from "../../domain/payment-record";
import type { Student } from "../../domain/student";
import type { FixedCosts, OrganizationSettings } from "../../domain/settings";
import { createDefaultPersistedState } from "./defaultAppState";
import { deleteLogoFile, readLogoDataUrl, writeLogoFromDataUrl, LOGO_FILE_NAME } from "./logoFile";
import type { PersistedAppState } from "./persistedState";
import {
  classGroupRepository,
  courseRepository,
  enrollmentRepository,
  paymentMethodRepository,
  paymentRecordCounterRepository,
  paymentRecordRepository,
  settingsRepository,
  studentRepository,
} from "./repositories";
import type { AppSettingsSnapshot } from "./repositories/settingsRepository";

function toSettingsSnapshot(state: PersistedAppState): AppSettingsSnapshot {
  return {
    branding: {
      appName: state.appName,
      appSubtitle: state.appSubtitle,
      onboardingCompleted: state.onboardingCompleted,
    },
    organization: state.organization,
    tax: {
      taxMode: state.taxMode,
      defaultVatRate: state.defaultVatRate,
      defaultIncomeTaxReserveRate: state.defaultIncomeTaxReserveRate,
      currencySymbol: state.currencySymbol,
    },
    appearance: {
      brandColor: state.brandColor,
      logoPath: state.logoPath,
      fontSize: state.fontSize,
      fontPreset: state.fontPreset,
      colorScheme: state.colorScheme,
      taxIdSeparator: state.taxIdSeparator,
    },
    fixedCosts: state.fixedCosts,
    backup: {
      autoBackupEnabled: state.autoBackupEnabled,
      autoBackupFolderPath: state.autoBackupFolderPath,
      lastAutoBackupAt: state.lastAutoBackupAt,
    },
  };
}

async function fromSettingsSnapshot(
  snapshot: AppSettingsSnapshot,
  defaults: PersistedAppState,
): Promise<Partial<PersistedAppState>> {
  const logoDataUrl = snapshot.appearance.logoPath ? await readLogoDataUrl() : null;

  return {
    appName: snapshot.branding.appName || defaults.appName,
    appSubtitle: snapshot.branding.appSubtitle || defaults.appSubtitle,
    onboardingCompleted: snapshot.branding.onboardingCompleted ?? defaults.onboardingCompleted,
    organization: snapshot.organization,
    taxMode: snapshot.tax.taxMode === "custom" ? "custom" : "standard",
    defaultVatRate: snapshot.tax.defaultVatRate,
    defaultIncomeTaxReserveRate: snapshot.tax.defaultIncomeTaxReserveRate,
    currencySymbol: snapshot.tax.currencySymbol,
    brandColor: snapshot.appearance.brandColor,
    logoPath: snapshot.appearance.logoPath,
    logoDataUrl,
    fontSize: snapshot.appearance.fontSize,
    fontPreset: snapshot.appearance.fontPreset,
    colorScheme: snapshot.appearance.colorScheme ?? defaults.colorScheme,
    taxIdSeparator: snapshot.appearance.taxIdSeparator,
    fixedCosts: snapshot.fixedCosts,
    autoBackupEnabled: snapshot.backup.autoBackupEnabled,
    autoBackupFolderPath: snapshot.backup.autoBackupFolderPath,
    lastAutoBackupAt: snapshot.backup.lastAutoBackupAt,
  };
}

export async function loadPersistedAppState(
  defaults: PersistedAppState = createDefaultPersistedState(),
): Promise<PersistedAppState> {
  const [
    students,
    courses,
    classGroups,
    enrollments,
    paymentRecords,
    paymentMethods,
    paymentRecordSeq,
    settings,
  ] = await Promise.all([
    studentRepository.list(),
    courseRepository.list(),
    classGroupRepository.list(),
    enrollmentRepository.list(),
    paymentRecordRepository.list(),
    paymentMethodRepository.list(),
    paymentRecordCounterRepository.load(),
    settingsRepository.load({
      branding: {
        appName: defaults.appName,
        appSubtitle: defaults.appSubtitle,
        onboardingCompleted: defaults.onboardingCompleted,
      },
      organization: defaults.organization,
      tax: {
        taxMode: defaults.taxMode,
        defaultVatRate: defaults.defaultVatRate,
        defaultIncomeTaxReserveRate: defaults.defaultIncomeTaxReserveRate,
        currencySymbol: defaults.currencySymbol,
      },
      appearance: {
        brandColor: defaults.brandColor,
        logoPath: defaults.logoPath,
        fontSize: defaults.fontSize,
        fontPreset: defaults.fontPreset,
        colorScheme: defaults.colorScheme,
        taxIdSeparator: defaults.taxIdSeparator,
      },
      fixedCosts: defaults.fixedCosts,
      backup: {
        autoBackupEnabled: defaults.autoBackupEnabled,
        autoBackupFolderPath: defaults.autoBackupFolderPath,
        lastAutoBackupAt: defaults.lastAutoBackupAt,
      },
    }),
  ]);

  const settingsSlice = await fromSettingsSnapshot(settings, defaults);

  return {
    ...defaults,
    ...settingsSlice,
    students,
    courses,
    classGroups,
    enrollments,
    paymentRecords,
    paymentMethods: paymentMethods.length > 0 ? paymentMethods : defaults.paymentMethods,
    paymentRecordSeq,
  };
}

async function persistLogoState(
  logoDataUrl: string | null,
  currentState: PersistedAppState,
): Promise<void> {
  if (logoDataUrl) {
    await writeLogoFromDataUrl(logoDataUrl);
    currentState.logoPath = LOGO_FILE_NAME;
  } else {
    await deleteLogoFile();
    currentState.logoPath = null;
  }

  await settingsRepository.save(toSettingsSnapshot(currentState));
}

export async function persistAppStoreField<K extends keyof PersistedAppState>(
  field: K,
  value: PersistedAppState[K],
  currentState?: PersistedAppState,
): Promise<void> {
  switch (field) {
    case "students":
      await studentRepository.replaceAll(value as Student[]);
      return;
    case "courses":
      await courseRepository.replaceAll(value as Course[]);
      return;
    case "classGroups":
      await classGroupRepository.replaceAll(value as ClassGroup[]);
      return;
    case "enrollments":
      await enrollmentRepository.replaceAll(value as Enrollment[]);
      return;
    case "paymentRecords":
      await paymentRecordRepository.replaceAll(value as PaymentRecord[]);
      return;
    case "paymentMethods":
      await paymentMethodRepository.replaceAll(value as string[]);
      return;
    case "paymentRecordSeq":
      await paymentRecordCounterRepository.replaceAll(value as Record<string, number>);
      return;
    case "logoDataUrl": {
      const snapshot = {
        ...(currentState ?? createDefaultPersistedState()),
        logoDataUrl: value as string | null,
      } as PersistedAppState;
      await persistLogoState(value as string | null, snapshot);
      return;
    }
    case "appName":
    case "appSubtitle":
    case "onboardingCompleted":
    case "organization":
    case "taxMode":
    case "defaultVatRate":
    case "defaultIncomeTaxReserveRate":
    case "currencySymbol":
    case "brandColor":
    case "logoPath":
    case "fontSize":
    case "fontPreset":
    case "colorScheme":
    case "taxIdSeparator":
    case "fixedCosts":
    case "autoBackupEnabled":
    case "autoBackupFolderPath":
    case "lastAutoBackupAt": {
      const snapshot = {
        ...(currentState ?? createDefaultPersistedState()),
        [field]: value,
      } as PersistedAppState;
      await settingsRepository.save(toSettingsSnapshot(snapshot));
      return;
    }
    default:
      return;
  }
}

export type { OrganizationSettings, FixedCosts };
