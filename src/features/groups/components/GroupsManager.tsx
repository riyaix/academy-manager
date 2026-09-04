import { useState, useMemo, type MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { useConfirm } from "../../../core/components/ConfirmDialog";
import { useToast } from "../../../core/components/Toast";
import {
  Users,
  Plus,
  Clock,
  BookOpen,
  Trash2,
  UserPlus,
  Search,
  Edit,
  FolderKanban,
  UserCheck,
  ArrowUpDown,
  Printer,
  Archive,
  Phone,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { nextPrefixedId } from "../../../domain/ids";
import {
  countActiveEnrollmentsInGroup,
  isGroupAtCapacity,
  isStudentActiveInGroup,
} from "../../../domain/enrollment-rules";
import {
  legacyWeekdays,
  translateDomainStatus,
  translateWeekday,
  translateWeekdayShort,
} from "../../../core/i18n/legacyUi";
import { useGroupsStore } from "../hooks/useGroupsStore";
import type { ClassGroup, ClassGroupStatus } from "../../../domain/group";
import type { Enrollment } from "../../../domain/enrollment";
import type { LegacyWeekday } from "../../../domain/shared";
import { studentDisplayName } from "../../../domain/student";
import {
  GROUP_COLOR_PALETTE,
  isHexColor,
  resolveGroupColorClass,
} from "../../../core/theme/groupColors";

type GroupFormState = {
  name: string;
  courseId: string;
  weekdays: LegacyWeekday[];
  startTime: string;
  endTime: string;
  colorClass: string;
  startDate: string;
  endDate: string;
  capacity: string;
  status: ClassGroupStatus;
};

type GroupEnrollmentHistory = {
  activeEnrollment: Enrollment | null;
  totalCiclos: number;
  enrollments: Enrollment[];
};

type GroupSortKey = keyof ClassGroup | "numAlumnos";
type GroupsManagerProps = {
  openNewGroupForm?: boolean;
};

function compareByKey<T>(left: T, right: T, direction: "ascending" | "descending"): number {
  const leftValue = left == null ? "" : String(left);
  const rightValue = right == null ? "" : String(right);
  if (leftValue < rightValue) return direction === "ascending" ? -1 : 1;
  if (leftValue > rightValue) return direction === "ascending" ? 1 : -1;
  return 0;
}

function toGroupRecord(form: GroupFormState, classGroupId: string): ClassGroup {
  return {
    classGroupId,
    name: form.name,
    courseId: form.courseId,
    weekdays: form.weekdays,
    startTime: form.startTime,
    endTime: form.endTime,
    colorClass: form.colorClass,
    startDate: form.startDate || undefined,
    endDate: form.endDate || undefined,
    capacity: form.capacity ? Number(form.capacity) : undefined,
    status: form.status,
  };
}

function toGroupForm(group: ClassGroup): GroupFormState {
  return {
    name: group.name,
    courseId: group.courseId,
    weekdays: group.weekdays,
    startTime: group.startTime,
    endTime: group.endTime,
    colorClass: group.colorClass,
    startDate: group.startDate ?? "",
    endDate: group.endDate ?? "",
    capacity: group.capacity == null ? "" : String(group.capacity),
    status: group.status,
  };
}

export function GroupsManager({ openNewGroupForm = false }: GroupsManagerProps) {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const { toast } = useToast();

  const {
    students: clientes,
    courses: productos,
    classGroups: grupos,
    setClassGroups: setGrupos,
    enrollments: matriculas,
    setEnrollments: setMatriculas,
  } = useGroupsStore();
  const [pestañaActiva, setPestañaActiva] = useState("directorio");

  const [mostrarFormGrupo, setMostrarFormGrupo] = useState(openNewGroupForm);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState<ClassGroup | null>(null);

  const [busquedaMatriculas, setBusquedaMatriculas] = useState("");
  const [busquedaGrupos, setBusquedaGrupos] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<"all" | ClassGroupStatus>("active");
  const [sortConfig, setSortConfig] = useState<{
    key: GroupSortKey;
    direction: "ascending" | "descending";
  }>({ key: "classGroupId", direction: "ascending" });

  const [editandoGrupoId, setEditandoGrupoId] = useState<string | null>(null);

  const estadoInicialGrupo: GroupFormState = {
    name: "",
    courseId: "",
    weekdays: [],
    startTime: "16:00",
    endTime: "17:00",
    colorClass: GROUP_COLOR_PALETTE[0],
    startDate: "",
    endDate: "",
    capacity: "",
    status: "active",
  };
  const [nuevoGrupo, setNuevoGrupo] = useState(estadoInicialGrupo);

  const diasSemana = legacyWeekdays(t);
  const formatGroupDays = (days: LegacyWeekday[]) =>
    days.map((day) => translateWeekday(t, day)).join(", ");
  const paletaColores = GROUP_COLOR_PALETTE;

  const obtenerSiguienteIdGrupo = () =>
    nextPrefixedId(
      "G",
      3,
      grupos.map((grupo) => grupo.classGroupId),
    );

  const toggleDia = (dia: LegacyWeekday) => {
    const nuevosDias = nuevoGrupo.weekdays.includes(dia)
      ? nuevoGrupo.weekdays.filter((d) => d !== dia)
      : [...nuevoGrupo.weekdays, dia];
    setNuevoGrupo({ ...nuevoGrupo, weekdays: nuevosDias });
  };

  const guardarGrupo = () => {
    if (!nuevoGrupo.name || !nuevoGrupo.courseId || nuevoGrupo.weekdays.length === 0) {
      toast({ message: t("groups.validationRequired"), variant: "warning" });
      return;
    }

    if (editandoGrupoId) {
      const updated = toGroupRecord(nuevoGrupo, editandoGrupoId);
      setGrupos(grupos.map((g) => (g.classGroupId === editandoGrupoId ? updated : g)));
      if (grupoSeleccionado?.classGroupId === editandoGrupoId) setGrupoSeleccionado(updated);
    } else {
      setGrupos([...grupos, toGroupRecord(nuevoGrupo, obtenerSiguienteIdGrupo())]);
    }

    cancelarFormularioGrupo();
  };

  const editarGrupo = (grupo: ClassGroup, e?: MouseEvent) => {
    if (e) e.stopPropagation();
    setNuevoGrupo(toGroupForm(grupo));
    setEditandoGrupoId(grupo.classGroupId);
    setMostrarFormGrupo(true);
  };

  const cancelarFormularioGrupo = () => {
    setMostrarFormGrupo(false);
    setEditandoGrupoId(null);
    setNuevoGrupo(estadoInicialGrupo);
  };

  const eliminarGrupo = async (id: string, e?: MouseEvent) => {
    if (e) e.stopPropagation();
    const confirmed = await confirm({
      title: t("groups.deleteConfirmTitle"),
      message: t("groups.deleteConfirm"),
      variant: "danger",
      confirmLabel: t("common.delete"),
    });
    if (!confirmed) return;
    setGrupos(grupos.filter((g) => g.classGroupId !== id));
    setMatriculas(matriculas.filter((m) => m.classGroupId !== id));
    if (grupoSeleccionado?.classGroupId === id) setGrupoSeleccionado(null);
  };

  const [clienteAñadir, setClienteAñadir] = useState("");

  const matricularAlumno = async () => {
    if (!clienteAñadir || !grupoSeleccionado) return;

    if (isGroupAtCapacity(grupoSeleccionado.classGroupId, grupoSeleccionado.capacity, matriculas)) {
      const confirmed = await confirm({
        title: t("groups.capacityConfirmTitle"),
        message: t("groups.capacityConfirm"),
      });
      if (!confirmed) return;
    }

    if (isStudentActiveInGroup(clienteAñadir, grupoSeleccionado.classGroupId, matriculas)) {
      toast({ message: t("groups.alreadyActive"), variant: "warning" });
      return;
    }

    const nuevaMatricula: Enrollment = {
      enrollmentId: `M${Date.now()}`,
      studentId: clienteAñadir,
      classGroupId: grupoSeleccionado.classGroupId,
      enrolledAt: new Date().toISOString().split("T")[0],
      status: "active",
    };

    setMatriculas([...matriculas, nuevaMatricula]);
    setClienteAñadir("");
  };

  const reMatricularAlumno = async (studentId: string) => {
    if (!grupoSeleccionado) return;
    if (isGroupAtCapacity(grupoSeleccionado.classGroupId, grupoSeleccionado.capacity, matriculas)) {
      const confirmed = await confirm({
        title: t("groups.capacityConfirmTitle"),
        message: t("groups.capacityShortConfirm"),
      });
      if (!confirmed) return;
    }

    const nuevaMatricula: Enrollment = {
      enrollmentId: `M${Date.now()}`,
      studentId,
      classGroupId: grupoSeleccionado.classGroupId,
      enrolledAt: new Date().toISOString().split("T")[0],
      status: "active",
    };
    setMatriculas([...matriculas, nuevaMatricula]);
  };

  const darBajaMatricula = async (enrollmentId: string) => {
    const confirmed = await confirm({
      title: t("groups.withdrawConfirmTitle"),
      message: t("groups.withdrawConfirm"),
      variant: "danger",
    });
    if (!confirmed) return;
    setMatriculas(
      matriculas.map((enrollment) =>
        enrollment.enrollmentId === enrollmentId
          ? {
              ...enrollment,
              status: "inactive",
              withdrawnAt: new Date().toISOString().split("T")[0],
            }
          : enrollment,
      ),
    );
  };

  const imprimirAsistencia = () => {
    if (!grupoSeleccionado) return;
    try {
      const doc = new jsPDF("portrait");

      doc.setFontSize(18);
      doc.setTextColor(31, 41, 55);
      doc.text(t("groups.attendance.title", { name: grupoSeleccionado.name }), 14, 22);

      doc.setFontSize(10);
      doc.setTextColor(107, 114, 128);
      doc.text(
        t("groups.attendance.schedule", {
          start: grupoSeleccionado.startTime,
          end: grupoSeleccionado.endTime,
          days: formatGroupDays(grupoSeleccionado.weekdays),
        }),
        14,
        28,
      );

      const alumnosDelGrupo = matriculas
        .filter(
          (enrollment) =>
            enrollment.classGroupId === grupoSeleccionado.classGroupId &&
            enrollment.status === "active",
        )
        .map((enrollment) => {
          const student = clientes.find((client) => client.studentId === enrollment.studentId);
          return student
            ? studentDisplayName(student)
            : t("groups.enrollments.unknownStudent");
        })
        .sort((a, b) => a.localeCompare(b));

      const encabezados = [
        [
          t("groups.attendance.columns.number"),
          t("groups.attendance.columns.studentName"),
          translateWeekdayShort(t, "Lunes"),
          translateWeekdayShort(t, "Martes"),
          translateWeekdayShort(t, "Miércoles"),
          translateWeekdayShort(t, "Jueves"),
          translateWeekdayShort(t, "Viernes"),
        ],
      ];
      const filas = alumnosDelGrupo.map((nombre, index) => [
        String(index + 1),
        nombre,
        "",
        "",
        "",
        "",
        "",
      ]);

      filas.push(["", "", "", "", "", "", ""]);
      filas.push(["", "", "", "", "", "", ""]);

      autoTable(doc, {
        head: encabezados,
        body: filas,
        startY: 35,
        theme: "grid",
        styles: { fontSize: 10, cellPadding: 3, minCellHeight: 10 },
        headStyles: { fillColor: [37, 99, 235], textColor: 255 },
        columnStyles: {
          0: { cellWidth: 10, halign: "center", fontStyle: "bold" },
          1: { cellWidth: "auto" },
          2: { cellWidth: 15 },
          3: { cellWidth: 15 },
          4: { cellWidth: 15 },
          5: { cellWidth: 15 },
          6: { cellWidth: 15 },
        },
      });

      const pdfBlob = doc.output("blob");
      const link = document.createElement("a");
      link.href = URL.createObjectURL(pdfBlob);
      link.download = t("groups.attendance.pdfFilename", { id: grupoSeleccionado.classGroupId });
      link.click();
    } catch (error) {
      toast({
        message: t("groups.pdfError", {
          message: error instanceof Error ? error.message : String(error),
        }),
        variant: "error",
      });
    }
  };

  const solicitarOrden = (key: GroupSortKey) => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") direction = "descending";
    setSortConfig({ key, direction });
  };

  const gruposMostrar = useMemo(() => {
    let filtrados = grupos;

    if (filtroEstado !== "all") {
      filtrados = filtrados.filter((group) => (group.status || "active") === filtroEstado);
    }

    if (busquedaGrupos) {
      const b = busquedaGrupos.toLowerCase();
      filtrados = filtrados.filter(
        (group) =>
          group.name.toLowerCase().includes(b) || group.classGroupId.toLowerCase().includes(b),
      );
    }

    if (sortConfig.key !== null) {
      filtrados.sort((a, b) => {
        if (sortConfig.key === "numAlumnos") {
          return compareByKey(
            countActiveEnrollmentsInGroup(a.classGroupId, matriculas),
            countActiveEnrollmentsInGroup(b.classGroupId, matriculas),
            sortConfig.direction,
          );
        }
        const field = sortConfig.key;
        return compareByKey(a[field], b[field], sortConfig.direction);
      });
    }
    return filtrados;
  }, [grupos, busquedaGrupos, filtroEstado, sortConfig, matriculas]);

  const SortableHeader = ({
    label,
    sortKey,
    isCenter = false,
  }: {
    label: string;
    sortKey: GroupSortKey;
    isCenter?: boolean;
  }) => (
    <th
      className={`px-6 py-4 cursor-pointer hover:bg-[var(--color-surface-muted)] transition-colors group ${isCenter ? "text-center" : "text-left"}`}
      onClick={() => solicitarOrden(sortKey)}
    >
      <div className={`flex items-center gap-1 text-[var(--color-text)] ${isCenter ? "justify-center" : ""}`}>
        {label}
        <ArrowUpDown
          className={`w-3 h-3 ${sortConfig.key === sortKey ? "text-[var(--color-primary)]" : "text-[var(--color-text-muted)] group-hover:text-[var(--color-text-muted)]"}`}
        />
      </div>
    </th>
  );

  return (
    <div className="bg-[var(--color-surface-elevated)] w-full p-6 md:p-8 rounded-xl shadow-sm border border-[var(--color-border)] flex flex-col min-h-[85vh]">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 border-b border-[var(--color-border)] pb-4 shrink-0 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)] mb-1">{t("groups.title")}</h1>
          <p className="text-sm text-[var(--color-text-muted)]">{t("groups.subtitle")}</p>
        </div>

        <div className="flex bg-[var(--color-surface-muted)] p-1 rounded-lg border border-[var(--color-border)]">
          <button
            onClick={() => setPestañaActiva("directorio")}
            className={`flex items-center px-5 py-2 rounded-md text-sm font-bold transition-colors cursor-pointer ${pestañaActiva === "directorio" ? "bg-[var(--color-surface-elevated)] text-[var(--color-primary)] shadow-sm" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"}`}
          >
            <FolderKanban className="w-4 h-4 mr-2" /> {t("groups.tabs.directory")}
          </button>
          <button
            onClick={() => setPestañaActiva("matriculas")}
            className={`flex items-center px-5 py-2 rounded-md text-sm font-bold transition-colors cursor-pointer ${pestañaActiva === "matriculas" ? "bg-[var(--color-surface-elevated)] text-[var(--color-primary)] shadow-sm" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"}`}
          >
            <UserCheck className="w-4 h-4 mr-2" /> {t("groups.tabs.enrollments")}
          </button>
        </div>
      </div>

      {mostrarFormGrupo && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-[var(--color-surface-elevated)] w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 bg-[var(--color-primary)] text-[var(--color-on-primary)] flex justify-between items-center">
              <h3 className="font-bold text-lg flex items-center">
                {editandoGrupoId ? (
                  <Edit className="w-5 h-5 mr-2" />
                ) : (
                  <Clock className="w-5 h-5 mr-2" />
                )}
                {editandoGrupoId
                  ? t("groups.editTitle", { id: editandoGrupoId })
                  : t("groups.createTitle")}
              </h3>
              {!editandoGrupoId && (
                <span className="text-[var(--color-on-primary)]/80">{obtenerSiguienteIdGrupo()}</span>
              )}
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-6 gap-4 text-sm bg-[var(--color-surface)]">
              <div className="flex flex-col md:col-span-2">
                <label className="font-semibold text-[var(--color-text)] mb-1">{t("groups.name")}</label>
                <input
                  type="text"
                  value={nuevoGrupo.name}
                  onChange={(e) => setNuevoGrupo({ ...nuevoGrupo, name: e.target.value })}
                  placeholder={t("groups.placeholders.nameExample")}
                  className="border rounded p-2.5 outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-[var(--color-surface-elevated)]"
                />
              </div>

              <div className="flex flex-col md:col-span-3">
                <label className="font-semibold text-[var(--color-text)] mb-1">{t("groups.linkedCourse")}</label>
                <select
                  value={nuevoGrupo.courseId}
                  onChange={(e) => setNuevoGrupo({ ...nuevoGrupo, courseId: e.target.value })}
                  className="border rounded p-2.5 outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-[var(--color-surface-elevated)] cursor-pointer"
                >
                  <option value="">{t("groups.placeholders.selectCourse")}</option>
                  {productos.map((course) => (
                    <option key={course.courseId} value={course.courseId}>
                      {course.courseName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col md:col-span-1">
                <label className="font-semibold text-[var(--color-text)] mb-1 text-center">{t("groups.status")}</label>
                <select
                  value={nuevoGrupo.status}
                  onChange={(e) =>
                    setNuevoGrupo({
                      ...nuevoGrupo,
                      status: e.target.value as ClassGroupStatus,
                    })
                  }
                  className="border rounded p-2.5 outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-[var(--color-surface-elevated)] cursor-pointer font-bold text-center"
                >
                  <option value="active">{translateDomainStatus(t, "active")}</option>
                  <option value="archived">{translateDomainStatus(t, "archived")}</option>
                </select>
              </div>

              <div className="flex flex-col md:col-span-2">
                <label className="font-semibold text-[var(--color-text)] mb-1">{t("groups.startDate")}</label>
                <input
                  type="date"
                  value={nuevoGrupo.startDate}
                  onChange={(e) => setNuevoGrupo({ ...nuevoGrupo, startDate: e.target.value })}
                  className="border rounded p-2.5 outline-none focus:ring-2 focus:ring-[var(--color-primary)] cursor-pointer bg-[var(--color-surface-elevated)]"
                />
              </div>

              <div className="flex flex-col md:col-span-2">
                <label className="font-semibold text-[var(--color-text)] mb-1">{t("groups.endDate")}</label>
                <input
                  type="date"
                  value={nuevoGrupo.endDate}
                  onChange={(e) => setNuevoGrupo({ ...nuevoGrupo, endDate: e.target.value })}
                  className="border rounded p-2.5 outline-none focus:ring-2 focus:ring-[var(--color-primary)] cursor-pointer bg-[var(--color-surface-elevated)]"
                />
              </div>

              <div className="flex flex-col md:col-span-2">
                <label className="font-semibold text-[var(--color-text)] mb-1">{t("groups.maxCapacity")}</label>
                <input
                  type="number"
                  value={nuevoGrupo.capacity}
                  onChange={(e) => setNuevoGrupo({ ...nuevoGrupo, capacity: e.target.value })}
                  placeholder={t("groups.placeholders.unlimited")}
                  className="border rounded p-2.5 outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-[var(--color-surface-elevated)]"
                />
              </div>

              <div className="flex flex-col md:col-span-6 border-t border-[var(--color-border)] pt-4 mt-2">
                <label className="font-semibold text-[var(--color-text)] mb-2">{t("groups.weekdaysLabel")}</label>
                <div className="flex gap-2">
                  {diasSemana.map((dia) => (
                    <button
                      key={dia}
                      onClick={() => toggleDia(dia)}
                      className={`flex-1 py-2 rounded-lg border font-bold text-xs transition-colors cursor-pointer ${nuevoGrupo.weekdays.includes(dia) ? "bg-[var(--color-primary)] text-[var(--color-on-primary)] border-[var(--color-primary)] shadow-sm" : "bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]"}`}
                    >
                      {translateWeekday(t, dia)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col md:col-span-2">
                <label className="font-semibold text-[var(--color-text)] mb-1">{t("groups.startTime")}</label>
                <input
                  type="time"
                  step="900"
                  value={nuevoGrupo.startTime}
                  onChange={(e) => setNuevoGrupo({ ...nuevoGrupo, startTime: e.target.value })}
                  className="border rounded p-2.5 outline-none focus:ring-2 focus:ring-[var(--color-primary)] cursor-pointer bg-[var(--color-surface-elevated)]"
                />
              </div>

              <div className="flex flex-col md:col-span-2">
                <label className="font-semibold text-[var(--color-text)] mb-1">{t("groups.endTime")}</label>
                <input
                  type="time"
                  step="900"
                  value={nuevoGrupo.endTime}
                  onChange={(e) => setNuevoGrupo({ ...nuevoGrupo, endTime: e.target.value })}
                  className="border rounded p-2.5 outline-none focus:ring-2 focus:ring-[var(--color-primary)] cursor-pointer bg-[var(--color-surface-elevated)]"
                />
              </div>

              <div className="flex flex-col md:col-span-2">
                <label className="font-semibold text-[var(--color-text)] mb-1">{t("groups.calendarColor")}</label>
                <div className="flex gap-1 h-10 items-center bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg px-2">
                  {paletaColores.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNuevoGrupo({ ...nuevoGrupo, colorClass: color })}
                      className={`w-6 h-6 rounded-full shadow-sm cursor-pointer transition-all ${color} ${nuevoGrupo.colorClass === color ? "ring-2 ring-[var(--color-primary)] scale-110" : "opacity-70"}`}
                    ></button>
                  ))}
                  <div className="w-px h-6 bg-[var(--color-surface-muted)] mx-1"></div>
                  <input
                    type="color"
                    value={isHexColor(nuevoGrupo.colorClass) ? nuevoGrupo.colorClass : "#ffffff"}
                    onChange={(e) => setNuevoGrupo({ ...nuevoGrupo, colorClass: e.target.value })}
                    className="w-7 h-7 p-0 border-0 rounded cursor-pointer shadow-sm"
                    title={t("groups.customColor")}
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-surface-elevated)] flex justify-end gap-3">
              <button
                onClick={cancelarFormularioGrupo}
                className="text-[var(--color-text-muted)] border border-[var(--color-border)] hover:bg-[var(--color-surface)] font-bold py-2 px-6 rounded-lg cursor-pointer transition-colors"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={guardarGrupo}
                className="bg-[var(--color-success)] text-[var(--color-on-primary)] hover:opacity-90 font-bold py-2 px-6 rounded-lg shadow-sm cursor-pointer transition-colors"
              >
                {editandoGrupoId ? t("groups.updateGroup") : t("groups.saveGroup")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================
          PESTAÑA 1: DIRECTORIO DE GRUPOS
          ========================================= */}
      {pestañaActiva === "directorio" && (
        <div className="flex-1 flex flex-col">
          <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
            <div className="flex flex-1 max-w-2xl gap-2">
              <div className="relative flex-1">
                <Search className="w-5 h-5 text-[var(--color-text-muted)] absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder={t("groups.directory.searchPlaceholder")}
                  value={busquedaGrupos}
                  onChange={(e) => setBusquedaGrupos(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-[var(--color-border)] rounded-lg outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>
              <select
                value={filtroEstado}
                onChange={(e) =>
                  setFiltroEstado(e.target.value as "all" | ClassGroupStatus)
                }
                className="border border-[var(--color-border)] rounded-lg px-4 outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-[var(--color-surface-elevated)] font-semibold text-[var(--color-text)] cursor-pointer"
              >
                <option value="all">{t("groups.directory.filterAll")}</option>
                <option value="active">{t("groups.directory.filterActive")}</option>
                <option value="archived">{t("groups.directory.filterArchived")}</option>
              </select>
            </div>

            <button
              onClick={() => setMostrarFormGrupo(true)}
              className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-on-primary)] px-5 py-2.5 rounded-lg text-sm font-bold flex items-center shadow-sm cursor-pointer transition-colors"
            >
              <Plus className="w-5 h-5 mr-1" /> {t("groups.directory.createGroup")}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto rounded-xl border border-[var(--color-border)] shadow-sm">
            <table className="min-w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[var(--color-surface)] uppercase tracking-wider text-[var(--color-text-muted)] text-xs font-bold sticky top-0 border-b border-[var(--color-border)] z-10">
                <tr>
                  <SortableHeader label={t("groups.table.code")} sortKey="classGroupId" />
                  <SortableHeader label={t("groups.table.group")} sortKey="name" />
                  <SortableHeader label={t("groups.table.baseCourse")} sortKey="courseId" />
                  <th className="px-6 py-4">{t("groups.directory.scheduleDays")}</th>
                  <th className="px-6 py-4">{t("groups.directory.dates")}</th>
                  <SortableHeader
                    label={t("groups.directory.capacity")}
                    sortKey="numAlumnos"
                    isCenter={true}
                  />
                  <th className="px-6 py-4 text-right">{t("groups.directory.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-[var(--color-surface-elevated)]">
                {gruposMostrar.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-[var(--color-text-muted)]">
                      {t("groups.directory.noMatch")}
                    </td>
                  </tr>
                ) : (
                  gruposMostrar.map((grupo) => {
                    const isHex = isHexColor(grupo.colorClass);
                    const numAlumnos = countActiveEnrollmentsInGroup(grupo.classGroupId, matriculas);
                    const nombreCurso =
                      productos.find((course) => course.courseId === grupo.courseId)?.courseName ||
                      t("groups.directory.courseNotFound");

                    const isArchivado = grupo.status === "archived";
                    const isLleno = isGroupAtCapacity(
                      grupo.classGroupId,
                      grupo.capacity,
                      matriculas,
                    );

                    return (
                      <tr
                        key={grupo.classGroupId}
                        className={`hover:bg-[var(--color-surface)] transition-colors ${isArchivado ? "opacity-60 bg-[var(--color-surface)]" : ""}`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-4 h-4 rounded-full shadow-sm ${!isHex ? resolveGroupColorClass(grupo.colorClass) : ""}`}
                              style={isHex ? { backgroundColor: grupo.colorClass } : {}}
                            ></div>
                            <span className="text-[var(--color-text-muted)] font-bold">
                              {grupo.classGroupId}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-extrabold text-[var(--color-text)] flex items-center gap-2">
                          {grupo.name}
                          {isArchivado && (
                            <Archive
                              className="w-3 h-3 text-[var(--color-text-muted)]"
                              aria-label={t("groups.directory.archivedTooltip")}
                            />
                          )}
                        </td>
                        <td className="px-6 py-4 font-semibold text-[var(--color-primary)]">{nombreCurso}</td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-[var(--color-text)]">
                            {grupo.startTime} - {grupo.endTime}
                          </p>
                          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                            {formatGroupDays(grupo.weekdays)}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-[var(--color-text-muted)]">
                          {grupo.startDate || grupo.endDate ? (
                            <>
                              <p className="text-xs">
                                {t("groups.directory.datesStart")}{" "}
                                <span className="font-semibold">{grupo.startDate || "-"}</span>
                              </p>
                              <p className="text-xs mt-0.5">
                                {t("groups.directory.datesEnd")}{" "}
                                <span className="font-semibold">{grupo.endDate || "-"}</span>
                              </p>
                            </>
                          ) : (
                            <span className="text-xs text-[var(--color-text-muted)] italic">
                              {t("groups.directory.datesUndefined")}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`font-bold px-3 py-1 rounded-full text-xs ${isArchivado ? "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]" : isLleno ? "bg-[var(--color-danger-surface)] text-[var(--color-danger)] border border-[var(--color-border)]" : "bg-[var(--color-success-surface)] text-[var(--color-success)] border border-[var(--color-border)]"}`}
                          >
                            {grupo.capacity
                              ? t("groups.directory.capacityRatio", {
                                  count: numAlumnos,
                                  max: grupo.capacity,
                                })
                              : `${numAlumnos} ${t("groups.directory.capacityActive")}`}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => editarGrupo(grupo)}
                            className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-info-surface)] rounded-lg cursor-pointer transition-colors"
                            title={t("groups.directory.editGroup")}
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => eliminarGrupo(grupo.classGroupId)}
                            className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-surface)] rounded-lg cursor-pointer transition-colors ml-1"
                            title={t("groups.directory.deleteGroup")}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================
          PESTAÑA 2: MATRICULACIONES
          ========================================= */}
      {pestañaActiva === "matriculas" && (
        <div className="flex-1 flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-1/3 flex flex-col border border-[var(--color-border)] rounded-xl overflow-hidden bg-[var(--color-surface)]">
            <div className="p-4 bg-[var(--color-surface-elevated)] border-b border-[var(--color-border)] shadow-sm z-10">
              <h3 className="font-bold text-[var(--color-text)] flex items-center">
                <BookOpen className="w-5 h-5 mr-2" /> {t("groups.enrollments.selectGroup")}
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {grupos.filter((group) => group.status !== "archived").length === 0 ? (
                <p className="text-sm text-[var(--color-text-muted)] italic text-center mt-4">
                  {t("groups.enrollments.noActiveGroups")}
                </p>
              ) : (
                grupos
                  .filter((group) => group.status !== "archived")
                  .map((grupo) => {
                    const numAlumnos = countActiveEnrollmentsInGroup(grupo.classGroupId, matriculas);
                    const isHex = isHexColor(grupo.colorClass);
                    const isLleno = isGroupAtCapacity(
                      grupo.classGroupId,
                      grupo.capacity,
                      matriculas,
                    );

                    return (
                      <div
                        key={grupo.classGroupId}
                        onClick={() => setGrupoSeleccionado(grupo)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${grupoSeleccionado?.classGroupId === grupo.classGroupId ? "bg-[var(--color-surface-elevated)] border-[var(--color-primary)] shadow-md ring-2 ring-blue-200" : "bg-[var(--color-surface-elevated)] border-[var(--color-border)] hover:border-blue-300 hover:shadow-sm"}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <span
                              className={`w-3 h-3 rounded-full shrink-0 ${!isHex ? resolveGroupColorClass(grupo.colorClass) : ""}`}
                              style={isHex ? { backgroundColor: grupo.colorClass } : {}}
                            ></span>
                            <h4 className="font-extrabold text-[var(--color-text)] text-sm truncate">
                              {grupo.name}
                            </h4>
                          </div>
                          <span className="text-xs text-[var(--color-text-muted)] font-bold ml-2">
                            {grupo.classGroupId}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--color-text-muted)] font-bold mb-1 pl-5">
                          {formatGroupDays(grupo.weekdays)} • {grupo.startTime}
                        </p>

                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-[var(--color-border)]">
                          <span
                            className={`text-xs font-bold px-2 py-1 rounded-md ${isLleno ? "text-[var(--color-danger)] bg-[var(--color-danger-surface)]" : "text-[var(--color-primary)] bg-[var(--color-info-surface)]"}`}
                          >
                            {grupo.capacity
                              ? t("groups.enrollments.activeRatio", {
                                  count: numAlumnos,
                                  max: grupo.capacity,
                                })
                              : t("groups.enrollments.activeCount", { count: numAlumnos })}
                          </span>
                          <span className="text-[10px] text-[var(--color-text-muted)] font-medium">
                            {t("groups.enrollments.clickToManage")}
                          </span>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>

          <div className="w-full md:w-2/3 flex flex-col border border-[var(--color-border)] rounded-xl overflow-hidden bg-[var(--color-surface-elevated)] shadow-sm">
            {!grupoSeleccionado ? (
              <div className="flex-1 flex flex-col items-center justify-center text-[var(--color-text-muted)] bg-[var(--color-surface)]/50">
                <Users className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-lg font-bold">{t("groups.enrollments.selectGroupPrompt")}</p>
              </div>
            ) : (
              <>
                <div
                  className={`p-6 text-[var(--color-on-group)] ${!isHexColor(grupoSeleccionado.colorClass) ? resolveGroupColorClass(grupoSeleccionado.colorClass) : ""}`}
                  style={
                    isHexColor(grupoSeleccionado.colorClass)
                      ? { backgroundColor: grupoSeleccionado.colorClass }
                      : {}
                  }
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-black mb-1 flex items-center gap-3">
                        {grupoSeleccionado.name}
                        <span className="text-sm bg-black/20 px-2 py-1 rounded">
                          {grupoSeleccionado.classGroupId}
                        </span>
                        {(() => {
                          const activos = countActiveEnrollmentsInGroup(
                            grupoSeleccionado.classGroupId,
                            matriculas,
                          );
                          const isLleno = isGroupAtCapacity(
                            grupoSeleccionado.classGroupId,
                            grupoSeleccionado.capacity,
                            matriculas,
                          );
                          return (
                            <span
                              className={`text-sm font-bold px-3 py-1 rounded-full ml-2 ${isLleno ? "bg-black/40 text-[var(--color-on-primary)] shadow-sm" : "bg-[var(--color-surface-elevated)]/20"}`}
                            >
                              {grupoSeleccionado.capacity
                                ? t("groups.directory.capacityRatio", {
                                    count: activos,
                                    max: grupoSeleccionado.capacity,
                                  })
                                : `${activos} ${t("groups.enrollments.studentsCount")}`}
                            </span>
                          );
                        })()}
                      </h2>
                      <p className="opacity-90 font-bold">
                        {productos.find((course) => course.courseId === grupoSeleccionado.courseId)
                          ?.courseName || t("groups.directory.courseNotFound")}
                      </p>
                    </div>
                    <div className="text-right">
                      <button
                        onClick={imprimirAsistencia}
                        className="flex items-center gap-2 bg-[var(--color-surface-elevated)]/20 hover:bg-[var(--color-surface-elevated)]/30 text-[var(--color-on-primary)] px-4 py-2 rounded-lg font-bold transition-colors cursor-pointer text-sm shadow-sm"
                      >
                        <Printer className="w-4 h-4" /> {t("groups.enrollments.printAttendance")}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex flex-col md:flex-row gap-3 shadow-inner">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder={t("groups.enrollments.searchEnrolled")}
                      value={busquedaMatriculas}
                      onChange={(e) => setBusquedaMatriculas(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-[var(--color-border)] rounded-lg outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    />
                  </div>
                  <div className="flex flex-1 gap-2">
                    <select
                      value={clienteAñadir}
                      onChange={(e) => setClienteAñadir(e.target.value)}
                      className="flex-1 border border-[var(--color-border)] rounded-lg p-2 outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-[var(--color-surface-elevated)] font-medium cursor-pointer"
                    >
                      <option value="">{t("groups.enrollments.searchDatabase")}</option>
                      {clientes
                        .filter((student) => student.status !== "inactive")
                        .map((student) => (
                          <option key={student.studentId} value={student.studentId}>
                            {studentDisplayName(student)}
                          </option>
                        ))}
                    </select>
                    <button
                      onClick={matricularAlumno}
                      className="bg-[var(--color-success)] hover:opacity-90 text-[var(--color-on-primary)] px-5 py-2 rounded-lg font-bold flex items-center transition-colors cursor-pointer shadow-sm"
                    >
                      <UserPlus className="w-4 h-4 mr-2" /> {t("groups.enrollments.add")}
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-0">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-[var(--color-surface-elevated)] sticky top-0 border-b border-[var(--color-border)] shadow-sm z-10">
                      <tr>
                        <th className="px-6 py-4 font-extrabold text-[var(--color-text-muted)] text-xs uppercase tracking-wider">
                          {t("groups.enrollments.student")}
                        </th>
                        <th className="px-6 py-4 font-extrabold text-[var(--color-text-muted)] text-xs uppercase tracking-wider text-center">
                          {t("groups.enrollments.contact")}
                        </th>
                        <th className="px-6 py-4 font-extrabold text-[var(--color-text-muted)] text-xs uppercase tracking-wider text-center">
                          {t("groups.enrollments.status")}
                        </th>
                        <th className="px-6 py-4 font-extrabold text-[var(--color-text-muted)] text-xs uppercase tracking-wider text-right">
                          {t("groups.enrollments.action")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(() => {
                        const matriculasGrupo = matriculas.filter(
                          (enrollment) =>
                            enrollment.classGroupId === grupoSeleccionado.classGroupId,
                        );
                        const historialAgrupado = matriculasGrupo.reduce<
                          Record<string, GroupEnrollmentHistory>
                        >((acc, enrollment) => {
                          if (!acc[enrollment.studentId])
                            acc[enrollment.studentId] = {
                              activeEnrollment: null,
                              totalCiclos: 0,
                              enrollments: [],
                            };
                          acc[enrollment.studentId].totalCiclos += 1;
                          acc[enrollment.studentId].enrollments.push(enrollment);
                          if (enrollment.status === "active")
                            acc[enrollment.studentId].activeEnrollment = enrollment;
                          return acc;
                        }, {});

                        let registros = Object.keys(historialAgrupado).map((studentId) => ({
                          studentId,
                          ...historialAgrupado[studentId],
                        }));
                        if (busquedaMatriculas) {
                          const b = busquedaMatriculas.toLowerCase();
                          registros = registros.filter((record) => {
                            const student = clientes.find(
                              (client) => client.studentId === record.studentId,
                            );
                            return (
                              student &&
                              (student.guardianFirstName.toLowerCase().includes(b) ||
                                student.guardianLastName.toLowerCase().includes(b) ||
                                (student.studentName &&
                                  student.studentName.toLowerCase().includes(b)))
                            );
                          });
                        }

                        if (registros.length === 0)
                          return (
                            <tr>
                              <td
                                colSpan={4}
                                className="px-6 py-10 text-center text-[var(--color-text-muted)] italic"
                              >
                                {t("groups.enrollments.noStudents")}
                              </td>
                            </tr>
                          );

                        return registros.map((record) => {
                          const estudiante = clientes.find(
                            (student) => student.studentId === record.studentId,
                          );
                          const esActivo = !!record.activeEnrollment;

                          const ultimaMatricula = [...record.enrollments].sort(
                            (left, right) =>
                              new Date(right.enrolledAt).getTime() -
                              new Date(left.enrolledAt).getTime(),
                          )[0];

                          return (
                            <tr
                              key={record.studentId}
                              className={`hover:bg-[var(--color-info-surface)] transition-colors ${!esActivo ? "bg-[var(--color-surface)]/50" : ""}`}
                            >
                              <td className="px-6 py-4">
                                <p
                                  className={`font-bold ${esActivo ? "text-[var(--color-text)]" : "text-[var(--color-text-muted)]"}`}
                                >
                                  {estudiante ? studentDisplayName(estudiante) : record.studentId}
                                </p>
                                <div className="flex gap-2 items-center mt-1">
                                  <span className="text-xs text-[var(--color-text-muted)]">
                                    {record.studentId}
                                  </span>
                                  {estudiante?.age && (
                                    <span className="text-xs text-[var(--color-primary)] font-bold bg-[var(--color-info-surface)] px-1.5 py-0.5 rounded">
                                      {t("groups.enrollments.ageYears", { count: estudiante.age })}
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td className="px-6 py-4 text-center">
                                {estudiante?.phone ? (
                                  <div className="flex flex-col items-center justify-center">
                                    <span className="flex items-center text-[var(--color-text)] font-medium text-xs">
                                      <Phone className="w-3 h-3 mr-1 text-[var(--color-text-muted)]" />{" "}
                                      {estudiante.phone}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-[var(--color-text-muted)] italic">
                                    {t("groups.enrollments.noPhone")}
                                  </span>
                                )}
                              </td>

                              <td className="px-6 py-4 text-center">
                                <div className="flex flex-col items-center gap-1">
                                  {esActivo ? (
                                    <>
                                      <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-[var(--color-success-surface)] text-[var(--color-success)] border border-[var(--color-border)] inline-flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3" aria-hidden="true" />
                                        {translateDomainStatus(t, "active")}
                                      </span>
                                      <span className="text-[10px] text-[var(--color-text-muted)]">
                                        {t("groups.enrollments.enrollDate", {
                                          date: ultimaMatricula?.enrolledAt,
                                        })}
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-[var(--color-danger-surface)] text-[var(--color-danger)] border border-[var(--color-border)] inline-flex items-center gap-1">
                                        <XCircle className="w-3 h-3" aria-hidden="true" />
                                        {translateDomainStatus(t, "inactive")}
                                      </span>
                                      <span className="text-[10px] text-[var(--color-text-muted)]">
                                        {t("groups.enrollments.withdrawDate", {
                                          date: ultimaMatricula?.withdrawnAt,
                                        })}
                                      </span>
                                    </>
                                  )}
                                  {record.totalCiclos > 1 && (
                                    <span className="text-[10px] font-bold text-[var(--color-primary)] bg-[var(--color-info-surface)] px-2 py-0.5 rounded-md border border-[var(--color-border)]">
                                      {t("groups.enrollments.historyCycles", {
                                        count: record.totalCiclos,
                                      })}
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td className="px-6 py-4 text-right">
                                {esActivo ? (
                                  <button
                                    onClick={() => {
                                      if (record.activeEnrollment)
                                        darBajaMatricula(record.activeEnrollment.enrollmentId);
                                    }}
                                    className="text-xs font-bold text-[var(--color-danger)] hover:text-[var(--color-on-primary)] hover:bg-[var(--color-danger)] px-3 py-1.5 rounded border border-[var(--color-border)] transition-colors cursor-pointer"
                                  >
                                    {t("groups.enrollments.withdraw")}
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => reMatricularAlumno(record.studentId)}
                                    className="text-xs font-bold text-[var(--color-success)] hover:text-[var(--color-on-primary)] hover:bg-[var(--color-success)] px-3 py-1.5 rounded border border-[var(--color-border)] transition-colors cursor-pointer"
                                  >
                                    {t("groups.enrollments.reEnroll")}
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
