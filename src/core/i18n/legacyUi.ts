import type { TFunction } from "i18next";
import type { LegacyWeekday } from "../../domain/shared";
import type { PaymentRecordStatus } from "../../domain/payment-record";
import type { ActiveStatus } from "../../domain/shared";
import type { ClassGroupStatus } from "../../domain/group";
import type { EnrollmentStatus } from "../../domain/enrollment";
import { LEGACY_WEEKDAYS, WEEKDAY_I18N_KEY, WEEKDAY_SHORT_I18N_KEY } from "../../domain/legacy-weekdays";

export function translateWeekday(t: TFunction, legacy: LegacyWeekday): string {
  return t(WEEKDAY_I18N_KEY[legacy]);
}

export function translateWeekdayShort(t: TFunction, legacy: LegacyWeekday): string {
  return t(WEEKDAY_SHORT_I18N_KEY[legacy]);
}

export function legacyWeekdays(_t: TFunction): LegacyWeekday[] {
  return [...LEGACY_WEEKDAYS];
}

export function translateDomainStatus(
  t: TFunction,
  status: PaymentRecordStatus | ActiveStatus | ClassGroupStatus | EnrollmentStatus | string,
): string {
  const keyByStatus: Record<string, string> = {
    pending: "status.pending",
    paid: "status.paid",
    voided: "status.voided",
    active: "status.active",
    inactive: "status.inactive",
    archived: "status.archived",
    // Legacy Spanish values still accepted for older UI bridges / imports.
    Pendiente: "status.pending",
    Pagada: "status.paid",
    Anulada: "status.voided",
    Activo: "status.active",
    Inactivo: "status.inactive",
    Archivado: "status.archived",
    Baja: "status.withdrawn",
  };
  const key = keyByStatus[status];
  return key ? t(key) : status;
}

/** @deprecated Prefer translateDomainStatus */
export const translatePaymentStatus = translateDomainStatus;

export function translateRecordStatusFilter(
  t: TFunction,
  filter: "all" | PaymentRecordStatus | string,
): string {
  const keyByFilter: Record<string, string> = {
    all: "paymentHistory.filters.all",
    pending: "status.pending",
    paid: "status.paid",
    voided: "status.voided",
    Todas: "paymentHistory.filters.all",
    Pendiente: "status.pending",
    Pagada: "status.paid",
    Anulada: "status.voided",
  };
  const key = keyByFilter[filter];
  return key ? t(key) : filter;
}
