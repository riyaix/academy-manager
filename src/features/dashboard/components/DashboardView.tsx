import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Users,
  BookOpen,
  CalendarDays,
  UserPlus,
  FilePlus,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Receipt,
} from "lucide-react";

import { useNavigation } from "../../../app/navigation/useNavigation";
import { useDashboardStore } from "../hooks/useDashboardStore";
import { translateWeekday } from "../../../core/i18n/legacyUi";
import { legacyWeekdayFromDate } from "../../../domain/legacy-weekdays";
import { fromMoney } from "../../../domain/money";
import { Button } from "../../../core/components/Button";
import {
  groupColorInlineStyle,
  isHexColor,
  resolveGroupColorClass,
} from "../../../core/theme/groupColors";

/**
 * Operational dashboard: students, groups, calendar, billing shortcuts.
 * Income charts / fixed costs / IRPF panels live under `../archived/` (not rendered).
 */
export function DashboardView() {
  const { t } = useTranslation();
  const { students, classGroups, enrollments, courses, paymentRecords } = useDashboardStore();
  const { navigateTo } = useNavigation();

  const kpis = useMemo(() => {
    const activos = students.filter((student) => student.status === "active");
    const gruposActivos = classGroups.filter((group) => group.status !== "archived");
    const matsActivas = enrollments.filter((enrollment) => enrollment.status === "active");

    const plazasTotales = gruposActivos.reduce(
      (acc, group) => acc + (Number(group.capacity) || 0),
      0,
    );
    const porcentajeOcupacion =
      plazasTotales > 0 ? Math.round((matsActivas.length / plazasTotales) * 100) : 0;

    const mesActual = new Date().toISOString().slice(0, 7);
    const altasMes = activos.filter((student) =>
      (student.enrolledAt || "").startsWith(mesActual),
    ).length;

    const gruposLlenos = gruposActivos.filter((group) => {
      const aforo = Number(group.capacity) || 0;
      if (aforo <= 0) return false;
      const count = matsActivas.filter(
        (enrollment) => enrollment.classGroupId === group.classGroupId,
      ).length;
      return count >= aforo;
    }).length;

    return {
      totalActivos: activos.length,
      totalGrupos: gruposActivos.length,
      porcentajeOcupacion,
      altasMes,
      gruposLlenos,
    };
  }, [students, classGroups, enrollments]);

  const alertas = useMemo(() => {
    const dSemana = legacyWeekdayFromDate(new Date());
    const clasesHoy = classGroups
      .filter((group) => group.status !== "archived" && (group.weekdays || []).includes(dSemana))
      .sort((left, right) => (left.startTime || "").localeCompare(right.startTime || ""));
    const facturasPendientes = paymentRecords.filter((record) => record.status === "pending");
    return { clasesHoy, facturasPendientes, hoyStr: dSemana };
  }, [classGroups, paymentRecords]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text)] mb-1">
            {t("dashboard.title")}
          </h1>
          <p className="text-sm text-[var(--color-text-muted)]">{t("dashboard.subtitle")}</p>
        </div>
        <Button
          type="button"
          onClick={() => navigateTo("billing", "lote")}
          leftIcon={<Receipt className="h-4 w-4" aria-hidden />}
          className="w-full sm:w-auto shrink-0"
        >
          {t("dashboard.emitFullMonthly")}
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <button
          type="button"
          onClick={() => navigateTo("students", "nuevo")}
          className="bg-[var(--color-surface-elevated)] border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:shadow-md p-3 rounded-xl flex items-center gap-3 transition-all cursor-pointer text-left min-h-[44px]"
        >
          <span className="w-10 h-10 bg-[var(--color-info-surface)] text-[var(--color-primary)] rounded-lg flex items-center justify-center shrink-0">
            <UserPlus className="w-5 h-5" aria-hidden />
          </span>
          <span className="font-bold text-[var(--color-text)] text-sm leading-tight whitespace-pre-line">
            {t("dashboard.quickNewStudent")}
          </span>
        </button>
        <button
          type="button"
          onClick={() => navigateTo("groups", "nuevo")}
          className="bg-[var(--color-surface-elevated)] border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:shadow-md p-3 rounded-xl flex items-center gap-3 transition-all cursor-pointer text-left min-h-[44px]"
        >
          <span className="w-10 h-10 bg-[var(--color-info-surface)] text-[var(--color-primary)] rounded-lg flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" aria-hidden />
          </span>
          <span className="font-bold text-[var(--color-text)] text-sm leading-tight whitespace-pre-line">
            {t("dashboard.quickNewGroup")}
          </span>
        </button>
        <button
          type="button"
          onClick={() => navigateTo("billing", "manual")}
          className="bg-[var(--color-surface-elevated)] border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:shadow-md p-3 rounded-xl flex items-center gap-3 transition-all cursor-pointer text-left min-h-[44px]"
        >
          <span className="w-10 h-10 bg-[var(--color-info-surface)] text-[var(--color-primary)] rounded-lg flex items-center justify-center shrink-0">
            <FilePlus className="w-5 h-5" aria-hidden />
          </span>
          <span className="font-bold text-[var(--color-text)] text-sm leading-tight whitespace-pre-line">
            {t("dashboard.quickSingleInvoice")}
          </span>
        </button>
        <button
          type="button"
          onClick={() => navigateTo("calendar", "semana")}
          className="bg-[var(--color-surface-elevated)] border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:shadow-md p-3 rounded-xl flex items-center gap-3 transition-all cursor-pointer text-left min-h-[44px]"
        >
          <span className="w-10 h-10 bg-[var(--color-info-surface)] text-[var(--color-primary)] rounded-lg flex items-center justify-center shrink-0">
            <CalendarDays className="w-5 h-5" aria-hidden />
          </span>
          <span className="font-bold text-[var(--color-text)] text-sm leading-tight whitespace-pre-line">
            {t("dashboard.quickViewCalendar")}
          </span>
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[var(--color-surface-elevated)] p-5 rounded-xl border border-[var(--color-border)] shadow-sm">
          <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">
            {t("dashboard.kpiActiveStudents")}
          </p>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-black text-[var(--color-text)] mb-0">{kpis.totalActivos}</p>
            {kpis.altasMes > 0 ? (
              <span className="text-xs font-bold text-[var(--color-success)] bg-[var(--color-success-surface)] px-2 py-0.5 rounded mb-1">
                {t("dashboard.kpiEnrollmentsThisMonth", { count: kpis.altasMes })}
              </span>
            ) : null}
          </div>
        </div>
        <div className="bg-[var(--color-surface-elevated)] p-5 rounded-xl border border-[var(--color-border)] shadow-sm">
          <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">
            {t("dashboard.kpiOpenGroups")}
          </p>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-black text-[var(--color-text)] mb-0">{kpis.totalGrupos}</p>
            {kpis.gruposLlenos > 0 ? (
              <span className="text-xs font-bold text-[var(--color-warning)] bg-[var(--color-warning-surface)] px-2 py-0.5 rounded mb-1">
                {t("dashboard.kpiFullGroups", { count: kpis.gruposLlenos })}
              </span>
            ) : null}
          </div>
        </div>
        <div className="bg-[var(--color-surface-elevated)] p-5 rounded-xl border border-[var(--color-border)] shadow-sm">
          <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">
            {t("dashboard.kpiOccupancy")}
          </p>
          <div className="flex items-center gap-3">
            <p className="text-3xl font-black text-[var(--color-text)] mb-0">
              {kpis.porcentajeOcupacion}%
            </p>
            <div className="flex-1 h-2 bg-[var(--color-surface-muted)] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${kpis.porcentajeOcupacion > 85 ? "bg-[var(--color-warning)]" : "bg-[var(--color-primary)]"}`}
                style={{ width: `${Math.min(kpis.porcentajeOcupacion, 100)}%` }}
              />
            </div>
          </div>
        </div>
        <div className="bg-[var(--color-surface-elevated)] p-5 rounded-xl border border-[var(--color-border)] shadow-sm">
          <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">
            {t("dashboard.kpiCoursesOffered")}
          </p>
          <p className="text-3xl font-black text-[var(--color-text)] mb-0">{courses.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-xl p-6 shadow-sm flex flex-col h-[350px]">
          <h2 className="font-bold text-[var(--color-text)] mb-4 flex items-center justify-between text-lg">
            <span>
              {t("dashboard.classesTodayTitle", {
                day: translateWeekday(t, alertas.hoyStr),
              })}
            </span>
            <span className="bg-[var(--color-info-surface)] text-[var(--color-primary)] text-xs px-2 py-1 rounded-md font-bold">
              {alertas.clasesHoy.length}
            </span>
          </h2>
          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {alertas.clasesHoy.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-[var(--color-text-muted)]">
                <CalendarDays className="w-10 h-10 mb-2 opacity-30" aria-hidden />
                <p className="text-sm font-bold">{t("dashboard.classesTodayEmpty")}</p>
              </div>
            ) : (
              alertas.clasesHoy.map((grupo) => {
                const aGrupo = enrollments.filter(
                  (enrollment) =>
                    enrollment.classGroupId === grupo.classGroupId &&
                    enrollment.status === "active",
                ).length;
                return (
                  <div
                    key={grupo.classGroupId}
                    className="border border-[var(--color-border)] rounded-lg p-3 hover:bg-[var(--color-surface)] transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-3 h-3 rounded-full shrink-0 ${grupo.colorClass && !isHexColor(grupo.colorClass) ? resolveGroupColorClass(grupo.colorClass) : ""}`}
                        style={groupColorInlineStyle(grupo.colorClass)}
                        aria-hidden
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-[var(--color-text)] text-sm truncate">
                          {grupo.name}
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                          {grupo.startTime} - {grupo.endTime}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[var(--color-text-muted)] bg-[var(--color-surface)] border border-[var(--color-border)] px-2 py-1 rounded shrink-0">
                      {t("dashboard.studentsInGroup", { count: aGrupo })}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-xl p-6 shadow-sm flex flex-col h-[350px]">
          <h2 className="font-bold text-[var(--color-text)] mb-4 text-lg">
            {t("dashboard.paymentAlertsTitle")}
          </h2>

          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {alertas.facturasPendientes.length > 0 ? (
              <div className="bg-[var(--color-warning-surface)] border border-[var(--color-border)] p-4 rounded-xl">
                <div className="flex justify-between items-start mb-3 gap-2">
                  <p className="font-bold text-[var(--color-text)] text-sm flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[var(--color-warning)] shrink-0" aria-hidden />
                    {t("dashboard.pendingPayments", {
                      count: alertas.facturasPendientes.length,
                    })}
                  </p>
                  <button
                    type="button"
                    onClick={() => navigateTo("payment-history", "morosos")}
                    className="text-xs font-bold text-[var(--color-text)] bg-[var(--color-surface-elevated)] border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] px-2 py-1 rounded transition-colors cursor-pointer min-h-[36px]"
                  >
                    {t("common.manage")}
                  </button>
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                  {alertas.facturasPendientes.slice(0, 4).map((record) => (
                    <div
                      key={record.recordId}
                      className="flex justify-between items-center text-xs bg-[var(--color-surface-elevated)] p-1.5 rounded border border-[var(--color-border)]"
                    >
                      <span className="font-bold text-[var(--color-text)] truncate pr-2">
                        {record.payerName}
                      </span>
                      <span className="font-black text-[var(--color-warning)] whitespace-nowrap">
                        {fromMoney(record.total).toFixed(2)}€
                      </span>
                    </div>
                  ))}
                  {alertas.facturasPendientes.length > 4 ? (
                    <p className="text-xs text-center text-[var(--color-warning)] font-bold mt-2">
                      {t("dashboard.morePending", {
                        count: alertas.facturasPendientes.length - 4,
                      })}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="bg-[var(--color-success-surface)] border border-[var(--color-border)] p-4 rounded-xl flex items-center gap-3">
                <CheckCircle2
                  className="w-5 h-5 text-[var(--color-success)] shrink-0"
                  aria-hidden
                />
                <p className="font-bold text-[var(--color-success)] text-sm mb-0">
                  {t("dashboard.allPaid")}
                </p>
              </div>
            )}

            {kpis.gruposLlenos > 0 ? (
              <div className="bg-[var(--color-info-surface)] border border-[var(--color-border)] p-3 rounded-xl flex items-start gap-3">
                <Users
                  className="w-5 h-5 text-[var(--color-primary)] shrink-0 mt-0.5"
                  aria-hidden
                />
                <div>
                  <p className="font-bold text-[var(--color-text)] text-sm mb-0">
                    {t("dashboard.capacityFullTitle")}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    {t("dashboard.capacityFullHint", { count: kpis.gruposLlenos })}
                  </p>
                </div>
              </div>
            ) : null}

            {alertas.facturasPendientes.length === 0 && kpis.gruposLlenos === 0 ? (
              <div className="flex flex-col items-center justify-center text-[var(--color-text-muted)] py-8">
                <AlertTriangle className="w-8 h-8 mb-2 opacity-30" aria-hidden />
                <p className="text-sm font-medium">{t("dashboard.noAlerts")}</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
