import { useState, useRef, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import {
  Users,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Sun,
  Moon,
  Calendar as CalendarIcon,
} from "lucide-react";

import { useCalendarStore } from "../hooks/useCalendarStore";
import { legacyWeekdays, translateWeekday } from "../../../core/i18n/legacyUi";
import {
  isHexColor,
  resolveGroupColorClass,
} from "../../../core/theme/groupColors";
import {
  formatFriendlyLongDate,
  isSameCalendarDay,
} from "../formatCalendarDate";

type CalendarViewMode = "diaria" | "semanal" | "mensual";
type CalendarShift = "mañana" | "tarde";

type CalendarViewProps = {
  initialView?: CalendarViewMode;
};

export function CalendarView({ initialView = "semanal" }: CalendarViewProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith("en") ? "en-US" : "es-ES";
  const { classGroups: grupos, enrollments: matriculas, courses: productos } = useCalendarStore();
  const [fechaBase, setFechaBase] = useState(new Date());
  const [vistaCalendario, setVistaCalendario] = useState<CalendarViewMode>(initialView);
  const [turno, setTurno] = useState<CalendarShift>("tarde");

  const dateInputRef = useRef<HTMLInputElement>(null);

  const diasSemana = legacyWeekdays(t);

  const horasMañana = Array.from(
    { length: 11 },
    (_, i) => `${Math.floor(i / 2) + 9}`.padStart(2, "0") + (i % 2 === 0 ? ":00" : ":30"),
  );
  const horasTarde = Array.from(
    { length: 11 },
    (_, i) => `${Math.floor(i / 2) + 16}`.padStart(2, "0") + (i % 2 === 0 ? ":00" : ":30"),
  );
  const horasActuales = turno === "mañana" ? horasMañana : horasTarde;

  const obtenerLunes = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  };

  const lunesActual = obtenerLunes(fechaBase);

  const diasSemanaActual = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(lunesActual);
    d.setDate(d.getDate() + i);
    return d;
  });

  const navegarCalendario = (direccion: number, saltoRapido = false) => {
    const nuevaFecha = new Date(fechaBase);
    if (vistaCalendario === "diaria") {
      nuevaFecha.setDate(nuevaFecha.getDate() + (saltoRapido ? direccion * 7 : direccion));
    } else if (vistaCalendario === "semanal") {
      nuevaFecha.setDate(nuevaFecha.getDate() + (saltoRapido ? direccion * 28 : direccion * 7));
    } else if (vistaCalendario === "mensual") {
      nuevaFecha.setMonth(nuevaFecha.getMonth() + (saltoRapido ? direccion * 12 : direccion));
    }
    setFechaBase(nuevaFecha);
  };

  const today = new Date();

  const formatearFechaStr = (date: Date) => formatFriendlyLongDate(date, locale);

  const formatearFechaCorta = (date: Date) =>
    `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;

  const cambiarFechaDirecta = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return;
    const [year, month, day] = e.target.value.split("-");
    setFechaBase(new Date(Number(year), Number(month) - 1, Number(day)));
  };

  const calcularPosicionBloque = (horaInicio: string, horaFin: string) => {
    const baseHour = turno === "mañana" ? 9 : 16;
    const startH = parseInt(horaInicio.split(":")[0]);
    const startM = parseInt(horaInicio.split(":")[1]) / 60;
    const endH = parseInt(horaFin.split(":")[0]);
    const endM = parseInt(horaFin.split(":")[1]) / 60;

    if (startH < baseHour || startH > baseHour + 5) return null;

    const top = (startH - baseHour + startM) * 8;
    const height = (endH + endM - (startH + startM)) * 8;
    return { top: `${top}rem`, height: `${height}rem` };
  };

  const generarMesRender = () => {
    const year = fechaBase.getFullYear();
    const month = fechaBase.getMonth();
    const diasEnMes = new Date(year, month + 1, 0).getDate();
    const primerDiaIndex = new Date(year, month, 1).getDay();
    const desfase = primerDiaIndex === 0 ? 6 : primerDiaIndex - 1;

    const dias = Array(desfase).fill(null);
    for (let i = 1; i <= diasEnMes; i++) dias.push(new Date(year, month, i));
    return dias;
  };

  const gridEstilo = {
    gridTemplateColumns:
      vistaCalendario === "diaria"
        ? "80px minmax(300px, 450px) 1fr"
        : "80px repeat(7, minmax(0, 1fr))",
  };

  return (
    <div className="bg-[var(--color-surface-elevated)] w-full p-6 md:p-8 rounded-xl shadow-sm border border-[var(--color-border)] flex flex-col h-full min-h-[85vh]">
      {/* NAVEGACIÓN DEL CALENDARIO (GRILLA DE 3 COLUMNAS) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 items-center mb-6 shrink-0 gap-4">
        {/* IZQUIERDA: Selector de Vista */}
        <div className="flex justify-start">
          <div className="flex bg-[var(--color-info-surface)] p-1 rounded-lg border border-[var(--color-border)]">
            <button
              onClick={() => setVistaCalendario("diaria")}
              className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors cursor-pointer ${vistaCalendario === "diaria" ? "bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-sm" : "text-[var(--color-primary)] hover:bg-[var(--color-info-surface)]"}`}
            >
              {t("calendar.viewDaily")}
            </button>
            <button
              onClick={() => setVistaCalendario("semanal")}
              className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors cursor-pointer ${vistaCalendario === "semanal" ? "bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-sm" : "text-[var(--color-primary)] hover:bg-[var(--color-info-surface)]"}`}
            >
              {t("calendar.viewWeekly")}
            </button>
            <button
              onClick={() => setVistaCalendario("mensual")}
              className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors cursor-pointer ${vistaCalendario === "mensual" ? "bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-sm" : "text-[var(--color-primary)] hover:bg-[var(--color-info-surface)]"}`}
            >
              {t("calendar.viewMonthly")}
            </button>
          </div>
        </div>

        {/* CENTRO: Controles de Navegación Modernos */}
        <div className="flex justify-center items-center gap-3">
          <div className="flex items-center bg-[var(--color-surface-muted)] p-1 rounded-lg border border-[var(--color-border)] shadow-sm">
            <button
              onClick={() => navegarCalendario(-1, true)}
              className="p-1.5 hover:bg-[var(--color-surface-elevated)] rounded text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors cursor-pointer"
              title={t("common.bigJumpBack")}
            >
              <ChevronsLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => navegarCalendario(-1)}
              className="p-1.5 hover:bg-[var(--color-surface-elevated)] rounded text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors cursor-pointer"
              title={t("common.back")}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={() => setFechaBase(new Date())}
              className="px-4 py-1 text-xs font-black tracking-wider text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-primary)] rounded cursor-pointer transition-colors uppercase"
            >
              {t("common.today")}
            </button>

            <button
              onClick={() => navegarCalendario(1)}
              className="p-1.5 hover:bg-[var(--color-surface-elevated)] rounded text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors cursor-pointer"
              title={t("common.forward")}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => navegarCalendario(1, true)}
              className="p-1.5 hover:bg-[var(--color-surface-elevated)] rounded text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors cursor-pointer"
              title={t("common.bigJumpForward")}
            >
              <ChevronsRight className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={() => {
              if (dateInputRef.current && typeof dateInputRef.current.showPicker === "function") {
                dateInputRef.current.showPicker();
              }
            }}
            className="relative flex items-center justify-center text-[var(--color-primary)] text-sm font-bold bg-[var(--color-info-surface)]/50 px-5 py-2.5 rounded-lg border border-[var(--color-border)] min-w-[260px] shadow-sm hover:bg-[var(--color-info-surface)] transition-colors cursor-pointer group"
          >
            <CalendarIcon className="w-4 h-4 mr-2 text-[var(--color-primary)]" />
            {vistaCalendario === "mensual" &&
              fechaBase
                .toLocaleDateString(locale, { month: "long", year: "numeric" })
                .replace(/^./, (char) => char.toUpperCase())}
            {vistaCalendario === "semanal" &&
              t("calendar.weekRange", {
                from: formatearFechaCorta(diasSemanaActual[0]),
                to: formatearFechaCorta(diasSemanaActual[6]),
              })}
            {vistaCalendario === "diaria" && formatearFechaStr(fechaBase)}

            <input
              ref={dateInputRef}
              type="date"
              onChange={cambiarFechaDirecta}
              className="absolute w-0 h-0 opacity-0 pointer-events-none"
              tabIndex={-1}
            />
          </button>
        </div>

        {/* DERECHA: Turnos de Horario */}
        <div className="flex justify-end">
          {vistaCalendario !== "mensual" ? (
            <div className="flex bg-[var(--color-surface-muted)] p-1 rounded-lg border border-[var(--color-border)]">
              <button
                onClick={() => setTurno("mañana")}
                className={`flex items-center px-4 py-1.5 rounded-md text-sm font-bold transition-colors cursor-pointer ${turno === "mañana" ? "bg-[var(--color-group-3)] text-[var(--color-on-group)] shadow-sm" : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]"}`}
              >
                <Sun className="w-4 h-4 mr-2" /> {t("calendar.shiftMorning")}
              </button>
              <button
                onClick={() => setTurno("tarde")}
                className={`flex items-center px-4 py-1.5 rounded-md text-sm font-bold transition-colors cursor-pointer ${turno === "tarde" ? "bg-[var(--color-group-6)] text-[var(--color-on-group)] shadow-sm" : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]"}`}
              >
                <Moon className="w-4 h-4 mr-2" /> {t("calendar.shiftAfternoon")}
              </button>
            </div>
          ) : (
            <div className="min-h-[40px]"></div>
          )}
        </div>
      </div>

      {vistaCalendario === "diaria" && (
        <div className="flex gap-2 mb-4 justify-center shrink-0">
          {diasSemanaActual.map((diaDate) => {
            const isSelected = diaDate.toDateString() === fechaBase.toDateString();
            const nombreDia = diasSemana[(diaDate.getDay() + 6) % 7];
            return (
              <button
                key={diaDate.toISOString()}
                onClick={() => setFechaBase(diaDate)}
                className={`px-6 py-2 rounded-lg font-bold text-sm cursor-pointer transition-all flex flex-col items-center border ${isSelected ? "bg-[var(--color-text)] border-[var(--color-text)] text-[var(--color-on-primary)] shadow-md scale-105" : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:border-[var(--color-border)]"}`}
              >
                <span>{translateWeekday(t, nombreDia)}</span>
                <span className="text-xs opacity-80">{diaDate.getDate()}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* GRILLA DEL CALENDARIO */}
      <div className="flex-1 border border-[var(--color-border)] rounded-xl overflow-hidden flex flex-col bg-[var(--color-surface)] shadow-inner">
        {vistaCalendario !== "mensual" && (
          <>
            <div
              className="grid border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)] shadow-sm z-10 shrink-0"
              style={gridEstilo}
            >
              <div className="p-3 text-center text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider border-r border-[var(--color-border)] flex items-center justify-center">
                {t("calendar.schedule")}
              </div>
              {(vistaCalendario === "diaria" ? [fechaBase] : diasSemanaActual).map((diaDate) => {
                const nombreDia = diasSemana[(diaDate.getDay() + 6) % 7];
                const isToday = isSameCalendarDay(diaDate, today);
                return (
                  <div
                    key={nombreDia}
                    className={`p-3 text-center border-r border-[var(--color-border)] last:border-0 flex flex-col items-center justify-center ${
                      isToday
                        ? "bg-[var(--color-info-surface)] ring-2 ring-inset ring-[var(--color-primary)]"
                        : "bg-[var(--color-surface)]/50"
                    }`}
                  >
                    <span
                      className={`text-sm font-black ${isToday ? "text-[var(--color-primary)]" : "text-[var(--color-text)]"}`}
                    >
                      {translateWeekday(t, nombreDia)} {diaDate.getDate()}
                    </span>
                    {isToday ? (
                      <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--color-primary)]">
                        {t("common.today")}
                      </span>
                    ) : null}
                  </div>
                );
              })}
              {vistaCalendario === "diaria" && <div className="bg-[var(--color-surface)]/50"></div>}
            </div>

            {/* Se ha eliminado el pt-4. El calendario empieza justo debajo de la cabecera */}
            <div className="flex-1 overflow-y-auto relative bg-[var(--color-surface-elevated)] pb-4">
              <div className="grid min-h-full" style={gridEstilo}>
                <div className="border-r border-[var(--color-border)] bg-[var(--color-surface)]">
                  {horasActuales.map((hora) => (
                    <div
                      key={hora}
                      className="h-16 border-b border-[var(--color-border)] flex items-center justify-center text-xs font-bold text-[var(--color-text-muted)]"
                    >
                      <span>{hora}</span>
                    </div>
                  ))}
                </div>

                {(vistaCalendario === "diaria" ? [fechaBase] : diasSemanaActual).map((diaDate) => {
                  const nombreDia = diasSemana[(diaDate.getDay() + 6) % 7];
                  const isToday = isSameCalendarDay(diaDate, today);
                  return (
                    <div
                      key={nombreDia}
                      className={`border-r border-[var(--color-border)] relative ${
                        isToday ? "bg-[var(--color-info-surface)]/40" : ""
                      }`}
                    >
                      {horasActuales.map((hora) => (
                        <div
                          key={`${nombreDia}-${hora}`}
                          className="h-16 border-b border-[var(--color-border)]"
                        ></div>
                      ))}

                      {grupos
                        .filter((group) => group.weekdays.includes(nombreDia))
                        .map((grupo) => {
                          const pos = calcularPosicionBloque(grupo.startTime, grupo.endTime);
                          if (!pos) return null;

                          const isHex = isHexColor(grupo.colorClass);
                          const numKids = matriculas.filter(
                            (enrollment) =>
                              enrollment.classGroupId === grupo.classGroupId &&
                              enrollment.status === "active",
                          ).length;
                          const nomCurso =
                            productos.find((course) => course.courseId === grupo.courseId)
                              ?.courseName || "";

                          return (
                            <div
                              key={`${grupo.classGroupId}-${nombreDia}`}
                              className={`absolute left-2 right-2 rounded-md shadow-md p-3 text-[var(--color-on-group)] overflow-hidden hover:ring-2 hover:ring-[var(--color-on-group)] hover:z-10 transition-all border border-black/10 flex flex-col justify-between cursor-pointer ${!isHex ? resolveGroupColorClass(grupo.colorClass) : ""}`}
                              style={{
                                top: `calc(${pos.top} + 4px)`,
                                height: `calc(${pos.height} - 8px)`,
                                ...(isHex ? { backgroundColor: grupo.colorClass } : {}),
                              }}
                              title={t("calendar.groupTooltip", { name: grupo.name, count: numKids })}
                            >
                              <div>
                                <p className="font-extrabold text-sm drop-shadow-md truncate leading-tight">
                                  {grupo.name}
                                </p>
                                <p className="text-xs font-bold opacity-90 truncate leading-tight mt-1">
                                  {nomCurso}
                                </p>
                              </div>
                              <div className="flex items-center justify-between text-xs font-medium bg-black/20 px-2 py-1 rounded mt-2">
                                <span>
                                  {grupo.startTime}-{grupo.endTime}
                                </span>
                                <span className="flex items-center">
                                  <Users className="w-3 h-3 mr-1" /> {numKids}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  );
                })}
                {vistaCalendario === "diaria" && <div className="bg-[var(--color-surface)]/30"></div>}
              </div>
            </div>
          </>
        )}

        {/* VISTA MENSUAL */}
        {vistaCalendario === "mensual" && (
          <div className="flex-1 flex flex-col bg-[var(--color-surface-elevated)]">
            <div className="grid grid-cols-7 border-b border-[var(--color-border)] bg-[var(--color-surface)] shrink-0">
              {diasSemana.map((dia) => (
                <div
                  key={dia}
                  className="p-3 text-center text-xs font-bold text-[var(--color-text-muted)] uppercase"
                >
                  {translateWeekday(t, dia)}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 grid-rows-5 flex-1">
              {generarMesRender().map((diaObj, idx) => {
                const diaSemanaNombre = diasSemana[idx % 7];
                const gruposDelDia = diaObj
                  ? grupos.filter((group) => group.weekdays.includes(diaSemanaNombre))
                  : [];
                const isToday = diaObj ? isSameCalendarDay(diaObj, today) : false;

                return (
                  <div
                    key={idx}
                    className={`border-r border-b border-[var(--color-border)] p-2 flex flex-col ${
                      !diaObj
                        ? "bg-[var(--color-surface)]"
                        : isToday
                          ? "bg-[var(--color-info-surface)] ring-2 ring-inset ring-[var(--color-primary)]"
                          : "bg-[var(--color-surface-elevated)] hover:bg-[var(--color-info-surface)] transition-colors"
                    }`}
                  >
                    {diaObj && (
                      <span
                        className={`text-sm font-bold mb-2 block text-right ${
                          isToday ? "text-[var(--color-primary)]" : "text-[var(--color-text-muted)]"
                        }`}
                      >
                        {diaObj.getDate()}
                      </span>
                    )}
                    {diaObj && (
                      <div className="flex-1 flex flex-col gap-1 overflow-y-auto">
                        {gruposDelDia.map((group) => {
                          const isHex = isHexColor(group.colorClass);
                          return (
                            <div
                              key={group.classGroupId}
                              className={`text-[10px] md:text-xs text-[var(--color-on-group)] px-1.5 py-1 rounded truncate shadow-sm font-medium cursor-pointer hover:ring-2 hover:ring-[var(--color-on-group)] transition-all ${!isHex ? resolveGroupColorClass(group.colorClass) : ""}`}
                              style={isHex ? { backgroundColor: group.colorClass } : {}}
                              title={t("calendar.groupTimeTooltip", {
                                name: group.name,
                                time: group.startTime,
                              })}
                            >
                              <span className="font-bold mr-1">{group.startTime}</span>
                              {group.name}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
