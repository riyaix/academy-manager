import type { PersistedAppState } from "./persistedState";
import { createEmptyPersistedState } from "./mockAppState";
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

export async function isDatabaseEmpty(): Promise<boolean> {
  const [students, courses, paymentRecords] = await Promise.all([
    studentRepository.list(),
    courseRepository.list(),
    paymentRecordRepository.list(),
  ]);

  return students.length === 0 && courses.length === 0 && paymentRecords.length === 0;
}

export async function persistFullAppState(state: PersistedAppState): Promise<void> {
  await courseRepository.replaceAll(state.courses);
  await studentRepository.replaceAll(state.students);
  await classGroupRepository.replaceAll(state.classGroups);
  await enrollmentRepository.replaceAll(state.enrollments);
  await paymentRecordRepository.replaceAll(state.paymentRecords);
  await paymentMethodRepository.replaceAll(state.paymentMethods);
  await paymentRecordCounterRepository.replaceAll(state.paymentRecordSeq);
  await settingsRepository.save(toSettingsSnapshot(state));
}

export async function seedDatabaseIfEmpty(
  seedState: PersistedAppState = createEmptyPersistedState(),
): Promise<boolean> {
  if (!(await isDatabaseEmpty())) {
    return false;
  }

  await persistFullAppState(seedState);
  return true;
}
