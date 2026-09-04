import { useState, useMemo, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { useConfirm } from "../../../core/components/ConfirmDialog";
import { useToast } from "../../../core/components/Toast";
import {
  Plus,
  X,
  Edit,
  Trash2,
  ArrowUpDown,
  Search,
  Download,
  FileText,
  Table as TableIcon,
  BookOpen,
  UserCheck,
  Archive,
} from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { nextPrefixedId } from "../../../domain/ids";
import { parseCourseFee } from "../../../domain/course-fee";
import { buildCourseStudentRoster } from "../../../domain/course-roster";
import { fromMoney, toMoney } from "../../../domain/money";
import { studentDisplayName } from "../../../domain/student";
import { useCoursesStore } from "../hooks/useCoursesStore";
import type { Course, CourseBillingType } from "../../../domain/course";
import type { ActiveStatus } from "../../../domain/shared";
import type { CourseStudentRoster } from "../../../domain/course-roster";

type CourseFormState = {
  courseName: string;
  monthlyFee: string;
  billingType: CourseBillingType;
  status: ActiveStatus;
  createdAt: string;
};

type CourseSortKey = keyof Course;
type SelectedCourseModal = Course & CourseStudentRoster;

const billingTypeKeys: Record<CourseBillingType, string> = {
  monthly: "courses.billingTypes.monthly",
  one_time: "courses.billingTypes.oneTime",
  custom: "courses.billingTypes.quarterly",
};

const statusKeys: Record<ActiveStatus, string> = {
  active: "courses.statuses.active",
  inactive: "courses.statuses.inactive",
};

function compareByKey<T>(left: T, right: T, direction: "ascending" | "descending"): number {
  const leftValue = left == null ? "" : String(left);
  const rightValue = right == null ? "" : String(right);
  if (leftValue < rightValue) return direction === "ascending" ? -1 : 1;
  if (leftValue > rightValue) return direction === "ascending" ? 1 : -1;
  return 0;
}

export function CoursesManager() {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const { toast } = useToast();

  const translateBillingType = (billingType: CourseBillingType) =>
    t(billingTypeKeys[billingType] ?? billingType);
  const translateStatus = (status: ActiveStatus) =>
    t(statusKeys[status] ?? "courses.statuses.active");

  const {
    courses: productos,
    setCourses: setProductos,
    students: clientes,
    enrollments,
    classGroups,
  } = useCoursesStore();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  const [cursoSeleccionado, setCursoSeleccionado] = useState<SelectedCourseModal | null>(null);
  const [mostrarDescarga, setMostrarDescarga] = useState(false);

  const estadoInicialProducto: CourseFormState = {
    courseName: "",
    monthlyFee: "",
    billingType: "monthly",
    status: "active",
    createdAt: new Date().toISOString().split("T")[0],
  };

  const [nuevoProducto, setNuevoProducto] = useState(estadoInicialProducto);
  const [busqueda, setBusqueda] = useState("");
  const [seleccionados, setSeleccionados] = useState<string[]>([]);

  const obtenerSiguienteId = () =>
    nextPrefixedId(
      "P",
      3,
      productos.map((producto) => producto.courseId),
    );

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setNuevoProducto({ ...nuevoProducto, [e.target.name]: e.target.value });

  const guardarProducto = () => {
    if (!nuevoProducto.courseName || !nuevoProducto.monthlyFee) {
      toast({ message: t("courses.validationRequired"), variant: "warning" });
      return;
    }

    const parsedFee = parseCourseFee(nuevoProducto.monthlyFee);
    if (parsedFee === null) {
      toast({ message: t("courses.validationRequired"), variant: "warning" });
      return;
    }

    const datosProducto: Omit<Course, "courseId"> = {
      courseName: nuevoProducto.courseName,
      monthlyFee: toMoney(parsedFee),
      billingType: nuevoProducto.billingType,
      status: nuevoProducto.status,
      createdAt: nuevoProducto.createdAt,
    };

    if (editandoId) {
      setProductos(
        productos.map((course) =>
          course.courseId === editandoId ? { ...datosProducto, courseId: editandoId } : course,
        ),
      );
    } else {
      setProductos([...productos, { ...datosProducto, courseId: obtenerSiguienteId() }]);
    }

    cerrarFormulario();
  };

  const cerrarFormulario = () => {
    setMostrarFormulario(false);
    setEditandoId(null);
    setNuevoProducto(estadoInicialProducto);
  };

  const handleEditar = () => {
    if (seleccionados.length !== 1) return;
    const prodAEditar = productos.find((course) => course.courseId === seleccionados[0]);
    if (prodAEditar) {
      setNuevoProducto({
        courseName: prodAEditar.courseName,
        monthlyFee: String(fromMoney(prodAEditar.monthlyFee)),
        billingType: prodAEditar.billingType,
        status: prodAEditar.status,
        createdAt: prodAEditar.createdAt,
      });
      setEditandoId(prodAEditar.courseId);
      setMostrarFormulario(true);
    }
  };

  const handleEliminar = async () => {
    if (seleccionados.length === 0) return;
    const confirmed = await confirm({
      title: t("courses.deleteConfirmTitle"),
      message: t("courses.deleteConfirm", { count: seleccionados.length }),
      variant: "danger",
      confirmLabel: t("common.delete"),
    });
    if (!confirmed) return;
    setProductos(productos.filter((course) => !seleccionados.includes(course.courseId)));
    setSeleccionados([]);
  };

  const toggleSeleccionarTodo = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSeleccionados(productosMostrar.map((course) => course.courseId));
    else setSeleccionados([]);
  };

  const toggleSeleccionarUnico = (id: string) => {
    if (seleccionados.includes(id)) setSeleccionados(seleccionados.filter((s) => s !== id));
    else setSeleccionados([...seleccionados, id]);
  };

  // --- LÓGICA DEL MODAL DE DETALLES DEL CURSO ---
  const abrirDetallesCurso = (curso: Course) => {
    const roster = buildCourseStudentRoster(
      curso.courseId,
      enrollments,
      classGroups,
      clientes,
    );

    setCursoSeleccionado({
      ...curso,
      active: roster.active,
      historic: roster.historic,
    });
  };

  // --- EXPORTACIÓN ---
  const exportarCSV = () => {
    const encabezados = [
      t("courses.export.csvHeaders.code"),
      t("courses.export.csvHeaders.course"),
      t("courses.export.csvHeaders.type"),
      t("courses.export.csvHeaders.fee"),
      t("courses.export.csvHeaders.status"),
      t("courses.export.csvHeaders.created"),
    ];
    const filas = productosMostrar.map((course) => [
      course.courseId,
      course.courseName,
      translateBillingType(course.billingType),
      fromMoney(course.monthlyFee).toFixed(2),
      translateStatus(course.status),
      course.createdAt || "-",
    ]);
    const contenidoCSV = [
      encabezados.join(","),
      ...filas.map((f) => f.map((str) => `"${str}"`).join(",")),
    ].join("\n");
    const blob = new Blob([contenidoCSV], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = t("courses.export.csvFilename");
    link.click();
    setMostrarDescarga(false);
  };

  const exportarPDF = () => {
    try {
      const doc = new jsPDF("portrait"); // Retrato para cursos queda mejor
      doc.setFontSize(18);
      doc.setTextColor(31, 41, 55);
      doc.text(t("courses.export.pdfTitle"), 14, 22);

      doc.setFontSize(10);
      doc.setTextColor(107, 114, 128);
      doc.text(t("courses.export.generatedOn", { date: new Date().toLocaleDateString() }), 14, 28);

      const encabezados = [[
        t("courses.export.pdfHeaders.code"),
        t("courses.export.pdfHeaders.status"),
        t("courses.export.pdfHeaders.course"),
        t("courses.export.pdfHeaders.type"),
        t("courses.export.pdfHeaders.fee"),
        t("courses.export.pdfHeaders.created"),
      ]];
      const filas = productosMostrar.map((course) => [
        course.courseId,
        translateStatus(course.status),
        course.courseName,
        translateBillingType(course.billingType),
        `${fromMoney(course.monthlyFee).toFixed(2)} €`,
        course.createdAt || "-",
      ]);

      autoTable(doc, {
        head: encabezados,
        body: filas,
        startY: 35,
        theme: "grid",
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [147, 51, 234], textColor: 255 }, // Morado para diferenciar de clientes
        alternateRowStyles: { fillColor: [249, 250, 251] },
        columnStyles: { 0: { fontStyle: "bold" }, 4: { halign: "right" } },
        didParseCell: function (data) {
          if (data.section === "body" && data.column.index === 1) {
            const prod = productosMostrar[data.row.index];
            const estado = prod?.status || "active";
            if (estado === "active") data.cell.styles.textColor = [22, 163, 74];
            else data.cell.styles.textColor = [220, 38, 38];
          }
        },
      });

      const pdfBlob = doc.output("blob");
      const link = document.createElement("a");
      link.href = URL.createObjectURL(pdfBlob);
      link.download = t("courses.export.pdfFilename");
      link.click();
      setMostrarDescarga(false);
    } catch (error) {
      toast({
        message: t("courses.pdfError", {
          message: error instanceof Error ? error.message : String(error),
        }),
        variant: "error",
      });
    }
  };

  // --- FILTRADO Y ORDENACIÓN ---
  const [sortConfig, setSortConfig] = useState<{
    key: CourseSortKey;
    direction: "ascending" | "descending";
  }>({ key: "courseId", direction: "ascending" });

  const solicitarOrden = (key: CourseSortKey) => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") direction = "descending";
    setSortConfig({ key, direction });
  };

  const productosMostrar = useMemo(() => {
    let filtrados = productos;

    if (busqueda) {
      const b = busqueda.toLowerCase();
      filtrados = filtrados.filter(
        (course) =>
          course.courseName.toLowerCase().includes(b) ||
          course.courseId.toLowerCase().includes(b),
      );
    }

    if (sortConfig.key !== null) {
      filtrados.sort((a, b) => compareByKey(a[sortConfig.key], b[sortConfig.key], sortConfig.direction));
    }
    return filtrados;
  }, [productos, busqueda, sortConfig]);

  const SortableHeader = ({
    label,
    sortKey,
    isRight = false,
  }: {
    label: string;
    sortKey: CourseSortKey;
    isRight?: boolean;
  }) => (
    <th
      className={`px-4 py-4 cursor-pointer hover:bg-[var(--color-surface-muted)] transition-colors group ${isRight ? "text-right" : "text-left"}`}
      onClick={() => solicitarOrden(sortKey)}
    >
      <div className={`flex items-center gap-1 text-[var(--color-text)] ${isRight ? "justify-end" : ""}`}>
        {label}
        <ArrowUpDown
          className={`w-3 h-3 ${sortConfig.key === sortKey ? "text-[var(--color-primary)]" : "text-[var(--color-text-muted)] group-hover:text-[var(--color-text-muted)]"}`}
        />
      </div>
    </th>
  );

  return (
    <div className="bg-[var(--color-surface-elevated)] w-full p-6 md:p-8 rounded-xl shadow-sm border border-[var(--color-border)] flex flex-col min-h-[85vh]">
      {/* CABECERA */}
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)] mb-1">{t("courses.title")}</h1>
          <p className="text-sm text-[var(--color-text-muted)]">{t("courses.subtitle")}</p>
        </div>
        {!mostrarFormulario && (
          <button
            onClick={() => {
              setEditandoId(null);
              setNuevoProducto(estadoInicialProducto);
              setMostrarFormulario(true);
            }}
            className="flex items-center font-bold py-2.5 px-5 rounded-lg shadow-sm transition-colors bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-on-primary)] cursor-pointer"
          >
            <Plus className="w-5 h-5 mr-2" /> {t("courses.addCourse")}
          </button>
        )}
      </div>

      {/* FORMULARIO */}
      {mostrarFormulario && (
        <div className="mb-6 p-6 bg-[var(--color-info-surface)] border border-[var(--color-border)] rounded-lg shadow-inner shrink-0">
          <h3 className="font-bold text-[var(--color-text)] mb-4 flex items-center">
            {editandoId ? <Edit className="w-5 h-5 mr-2" /> : <BookOpen className="w-5 h-5 mr-2" />}
            {editandoId ? (
              t("courses.editingCourse", { id: editandoId })
            ) : (
              t("courses.newCourseForm")
            )}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 text-sm">
            <div className="flex flex-col">
              <label className="font-semibold text-[var(--color-text)] mb-1">{t("courses.code")}</label>
              <input
                type="text"
                value={editandoId || obtenerSiguienteId()}
                disabled
                className="border border-[var(--color-border)] rounded p-2 bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] cursor-not-allowed"
              />
            </div>

            <div className="flex flex-col md:col-span-2">
              <label className="font-semibold text-[var(--color-text)] mb-1">{t("courses.courseName")}</label>
              <input
                type="text"
                name="courseName"
                value={nuevoProducto.courseName}
                onChange={handleChange}
                className="border border-[var(--color-border)] rounded p-2 focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                placeholder={t("courses.courseNamePlaceholder")}
              />
            </div>

            <div className="flex flex-col md:col-span-1">
              <label className="font-semibold text-[var(--color-text)] mb-1">{t("courses.billingType")}</label>
              <select
                name="billingType"
                value={nuevoProducto.billingType}
                onChange={handleChange}
                className="border border-[var(--color-border)] rounded p-2 focus:ring-2 focus:ring-[var(--color-primary)] outline-none bg-[var(--color-surface-elevated)]"
              >
                <option value="monthly">{t("courses.billingTypes.monthly")}</option>
                <option value="one_time">{t("courses.billingTypes.oneTime")}</option>
                <option value="custom">{t("courses.billingTypes.quarterly")}</option>
              </select>
            </div>

            <div className="flex flex-col md:col-span-1">
              <label className="font-semibold text-[var(--color-text)] mb-1">{t("courses.baseFee")}</label>
              <input
                type="number"
                name="monthlyFee"
                step="0.01"
                value={nuevoProducto.monthlyFee}
                onChange={handleChange}
                className="border border-[var(--color-border)] rounded p-2 focus:ring-2 focus:ring-[var(--color-primary)] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-right"
                placeholder={t("courses.feePlaceholder")}
              />
            </div>

            <div className="flex flex-col md:col-span-1">
              <label className="font-semibold text-[var(--color-text)] mb-1">{t("courses.status")}</label>
              <select
                name="status"
                value={nuevoProducto.status}
                onChange={handleChange}
                className="border border-[var(--color-border)] rounded p-2 focus:ring-2 focus:ring-[var(--color-primary)] outline-none bg-[var(--color-surface-elevated)] font-bold"
              >
                <option value="active">{t("courses.statuses.active")}</option>
                <option value="inactive">{t("courses.statuses.inactive")}</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[var(--color-border)]">
            <button
              onClick={cerrarFormulario}
              className="bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-[var(--color-danger)] hover:bg-[var(--color-danger-surface)] font-bold py-2 px-6 rounded-lg transition-colors cursor-pointer"
            >
              {t("common.cancel")}
            </button>
            <button
              onClick={guardarProducto}
              className="bg-[var(--color-success)] hover:opacity-90 text-[var(--color-on-primary)] font-bold py-2 px-6 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              {editandoId ? t("courses.updateCourse") : t("courses.saveCourse")}
            </button>
          </div>
        </div>
      )}

      {/* --- TOOLBAR --- */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4 shrink-0">
        <div className="relative w-full md:w-96">
          <Search className="w-5 h-5 text-[var(--color-text-muted)] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder={t("courses.searchPlaceholder")}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto relative">
          <button
            onClick={handleEditar}
            disabled={seleccionados.length !== 1}
            className={`flex items-center px-4 py-2 rounded-lg font-semibold transition-colors border cursor-pointer ${seleccionados.length === 1 ? "bg-[var(--color-surface-elevated)] text-[var(--color-primary)] border-[var(--color-border)] hover:bg-[var(--color-info-surface)]" : "bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)] cursor-not-allowed"}`}
          >
            <Edit className="w-4 h-4 mr-2" /> {t("courses.edit")}
          </button>

          <button
            onClick={handleEliminar}
            disabled={seleccionados.length === 0}
            className={`flex items-center px-4 py-2 rounded-lg font-semibold transition-colors border cursor-pointer ${seleccionados.length > 0 ? "bg-[var(--color-surface-elevated)] text-[var(--color-danger)] border-[var(--color-border)] hover:bg-[var(--color-danger-surface)]" : "bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)] cursor-not-allowed"}`}
          >
            <Trash2 className="w-4 h-4 mr-2" />{" "}
            {seleccionados.length > 0
              ? t("courses.deleteCount", { count: seleccionados.length })
              : t("common.delete")}
          </button>

          <div className="relative">
            <button
              onClick={() => setMostrarDescarga(!mostrarDescarga)}
              className="flex items-center px-3 py-2 rounded-lg font-semibold text-[var(--color-text-muted)] bg-[var(--color-surface-elevated)] border border-[var(--color-border)] hover:bg-[var(--color-surface)] transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
            </button>
            {mostrarDescarga && (
              <div className="absolute right-0 mt-2 w-48 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] shadow-xl rounded-lg py-2 z-20">
                <button
                  onClick={exportarCSV}
                  className="w-full text-left px-4 py-2 hover:bg-[var(--color-surface)] text-sm font-semibold text-[var(--color-text)] flex items-center cursor-pointer"
                >
                  <TableIcon className="w-4 h-4 mr-2 text-[var(--color-success)]" /> {t("courses.exportCsv")}
                </button>
                <button
                  onClick={exportarPDF}
                  className="w-full text-left px-4 py-2 hover:bg-[var(--color-surface)] text-sm font-semibold text-[var(--color-text)] flex items-center cursor-pointer"
                >
                  <FileText className="w-4 h-4 mr-2 text-[var(--color-danger)]" /> {t("courses.exportPdf")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TABLA DE PRODUCTOS */}
      <div className="flex-1 overflow-x-auto overflow-y-auto rounded-lg border border-[var(--color-border)]">
        <table className="min-w-max w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-[var(--color-surface-muted)] uppercase tracking-wider text-[var(--color-text-muted)] text-xs font-semibold select-none sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-4 py-4 w-10">
                <input
                  type="checkbox"
                  checked={
                    seleccionados.length === productosMostrar.length && productosMostrar.length > 0
                  }
                  onChange={toggleSeleccionarTodo}
                  className="w-4 h-4 text-[var(--color-primary)] rounded border-[var(--color-border)] focus:ring-[var(--color-primary)] cursor-pointer"
                />
              </th>
              <SortableHeader label={t("courses.table.code")} sortKey="courseId" />
              <SortableHeader label={t("courses.table.status")} sortKey="status" />
              <SortableHeader label={t("courses.table.course")} sortKey="courseName" />
              <SortableHeader label={t("courses.table.type")} sortKey="billingType" />
              <SortableHeader label={t("courses.table.created")} sortKey="createdAt" />
              <SortableHeader label={t("courses.table.baseFee")} sortKey="monthlyFee" isRight={true} />
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)] bg-[var(--color-surface-elevated)]">
            {productosMostrar.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-[var(--color-text-muted)]">
                  {t("courses.empty")}
                </td>
              </tr>
            ) : (
              productosMostrar.map((prod) => (
                <tr
                  key={prod.courseId}
                  className={`transition-colors ${seleccionados.includes(prod.courseId) ? "bg-[var(--color-info-surface)]" : "hover:bg-[var(--color-surface)]"} ${prod.status === "inactive" ? "opacity-60 bg-[var(--color-surface)]" : ""}`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={seleccionados.includes(prod.courseId)}
                      onChange={() => toggleSeleccionarUnico(prod.courseId)}
                      className="w-4 h-4 text-[var(--color-primary)] rounded border-[var(--color-border)] focus:ring-[var(--color-primary)] cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3 font-bold text-[var(--color-text)]">{prod.courseId}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${prod.status === "active" ? "bg-[var(--color-success-surface)] text-[var(--color-success)]" : "bg-[var(--color-danger-surface)] text-[var(--color-danger)]"}`}
                    >
                      {translateStatus(prod.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-[var(--color-primary)]">
                    <button
                      onClick={() => abrirDetallesCurso(prod)}
                      className="hover:underline focus:outline-none cursor-pointer text-left"
                    >
                      {prod.courseName}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-muted)]">
                    {translateBillingType(prod.billingType)}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-muted)]">{prod.createdAt || "-"}</td>
                  <td className="px-4 py-3 text-right font-bold text-[var(--color-text)]">
                    {fromMoney(prod.monthlyFee).toFixed(2)} €
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL DE DETALLES DEL CURSO (MATRICULACIONES) */}
      {cursoSeleccionado && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-[var(--color-surface-elevated)] w-full max-w-3xl rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
            {/* Cabecera Modal */}
            <div className="p-6 bg-[var(--color-primary)] text-[var(--color-on-primary)] flex justify-between items-center rounded-t-xl shrink-0">
              <div>
                <h2 className="text-xl font-bold flex items-center">{cursoSeleccionado.courseName}</h2>
                <p className="text-[var(--color-on-primary)]/80 text-sm opacity-90 mt-1">
                  {t("courses.modal.subtitle")}
                </p>
              </div>
              <button
                onClick={() => setCursoSeleccionado(null)}
                className="text-[var(--color-on-primary)]/80 hover:text-[var(--color-on-primary)] transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Resumen del Curso */}
            <div className="p-6 bg-[var(--color-info-surface)] border-b border-[var(--color-border)] shrink-0">
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <p className="text-xs font-bold text-[var(--color-text)] uppercase tracking-wider mb-1">
                    {t("courses.code")}
                  </p>
                  <p className="font-semibold text-[var(--color-text)]">{cursoSeleccionado.courseId}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-[var(--color-text)] uppercase tracking-wider mb-1">
                    {t("courses.modal.baseFee")}
                  </p>
                  <p className="font-semibold text-[var(--color-text)]">
                    {fromMoney(cursoSeleccionado.monthlyFee).toFixed(2)} € /{" "}
                    {translateBillingType(cursoSeleccionado.billingType)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-[var(--color-text)] uppercase tracking-wider mb-1">
                    {t("courses.modal.created")}
                  </p>
                  <p className="font-semibold text-[var(--color-text)]">
                    {cursoSeleccionado.createdAt || t("courses.modal.unknownDate")}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-[var(--color-text)] uppercase tracking-wider mb-1">
                    {t("courses.status")}
                  </p>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${cursoSeleccionado.status === "active" ? "bg-[var(--color-success-surface)] text-[var(--color-success)]" : "bg-[var(--color-danger-surface)] text-[var(--color-danger)]"}`}
                  >
                    {translateStatus(cursoSeleccionado.status)}
                  </span>
                </div>
              </div>
            </div>

            {/* Tablas de Alumnos (Con Scroll Integrado) */}
            <div className="p-6 overflow-y-auto flex-1 space-y-8">
              {/* Tabla Activos */}
              <div>
                <h3 className="font-bold text-[var(--color-text)] border-b pb-2 mb-3 flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-[var(--color-success)]" aria-hidden="true" />
                    {t("courses.modal.activeStudents")}
                  </span>
                  <span className="bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] text-xs px-2 py-1 rounded-full">
                    {t("courses.modal.activeCount", { count: cursoSeleccionado.active.length })}
                  </span>
                </h3>
                <div className="border border-[var(--color-border)] rounded-lg overflow-hidden">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-[var(--color-surface)] border-b border-[var(--color-border)]">
                      <tr>
                        <th className="px-4 py-2 font-semibold text-[var(--color-text-muted)] w-24">
                          {t("courses.modal.clientId")}
                        </th>
                        <th className="px-4 py-2 font-semibold text-[var(--color-text-muted)]">
                          {t("courses.modal.student")}
                        </th>
                        <th className="px-4 py-2 font-semibold text-[var(--color-text-muted)] w-24 text-center">
                          {t("courses.modal.age")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-[var(--color-surface-elevated)]">
                      {cursoSeleccionado.active.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-4 py-6 text-center text-[var(--color-text-muted)] italic">
                            {t("courses.modal.noActiveStudents")}
                          </td>
                        </tr>
                      ) : (
                        cursoSeleccionado.active.map((alumno) => (
                          <tr key={alumno.studentId} className="hover:bg-[var(--color-surface)]">
                            <td className="px-4 py-2 text-[var(--color-text-muted)] text-xs">
                              {alumno.studentId}
                            </td>
                            <td className="px-4 py-2 font-medium text-[var(--color-text)]">
                              {studentDisplayName(alumno)}
                            </td>
                            <td className="px-4 py-2 text-[var(--color-text-muted)] text-center">
                              {alumno.age || "-"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tabla Históricos */}
              <div>
                <h3 className="font-bold text-[var(--color-text)] border-b pb-2 mb-3 flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <Archive className="w-4 h-4 text-[var(--color-danger)]" aria-hidden="true" />
                    {t("courses.modal.historicStudents")}
                  </span>
                  <span className="bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] text-xs px-2 py-1 rounded-full">
                    {t("courses.modal.withdrawnCount", { count: cursoSeleccionado.historic.length })}
                  </span>
                </h3>
                <div className="border border-[var(--color-border)] rounded-lg overflow-hidden">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-[var(--color-surface)] border-b border-[var(--color-border)]">
                      <tr>
                        <th className="px-4 py-2 font-semibold text-[var(--color-text-muted)] w-24">
                          {t("courses.modal.clientId")}
                        </th>
                        <th className="px-4 py-2 font-semibold text-[var(--color-text-muted)]">
                          {t("courses.modal.student")}
                        </th>
                        <th className="px-4 py-2 font-semibold text-[var(--color-text-muted)] w-24 text-center">
                          {t("courses.modal.age")}
                        </th>
                        <th className="px-4 py-2 font-semibold text-[var(--color-text-muted)] w-32">
                          {t("courses.modal.lastClass")}
                        </th>
                        <th className="px-4 py-2 font-semibold text-[var(--color-text-muted)] w-24 text-center">
                          {t("courses.status")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-[var(--color-surface-elevated)] opacity-80">
                      {cursoSeleccionado.historic.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-6 text-center text-[var(--color-text-muted)] italic">
                            {t("courses.modal.noHistoricRecords")}
                          </td>
                        </tr>
                      ) : (
                        cursoSeleccionado.historic.map((alumno) => (
                          <tr key={alumno.studentId} className="hover:bg-[var(--color-surface)]">
                            <td className="px-4 py-2 text-[var(--color-text-muted)] text-xs">
                              {alumno.studentId}
                            </td>
                            <td className="px-4 py-2 font-medium text-[var(--color-text)]">
                              {studentDisplayName(alumno)}
                            </td>
                            <td className="px-4 py-2 text-[var(--color-text-muted)] text-center">
                              {alumno.age || "-"}
                            </td>
                            <td className="px-4 py-2 text-[var(--color-text-muted)]">{alumno.lastClassDate}</td>
                            <td className="px-4 py-2 text-center">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--color-danger-surface)] text-[var(--color-danger)]">
                                {t("courses.statuses.withdrawn")}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-surface)] flex justify-end shrink-0 rounded-b-xl">
              <button
                onClick={() => setCursoSeleccionado(null)}
                className="bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface-muted)] font-bold py-2 px-6 rounded-lg transition-colors cursor-pointer"
              >
                {t("courses.modal.closePanel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
