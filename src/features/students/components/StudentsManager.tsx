import { useState, useMemo, useEffect, type ChangeEvent, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useConfirm } from "../../../core/components/ConfirmDialog";
import { useToast } from "../../../core/components/Toast";
import {
  UserPlus,
  X,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  FileText,
  Table as TableIcon,
  FileUp,
} from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  buildStudentCourseHistory,
  type StudentCourseHistoryEntry,
} from "../../../domain/enrollment-history";
import { nextPrefixedId } from "../../../domain/ids";
import { formatDniNumbers } from "../../../domain/tax-id";
import { translateDomainStatus } from "../../../core/i18n/legacyUi";
import {
  guardianDisplayName,
  type Student,
  type StudentStatus,
} from "../../../domain/student";
import { useStudentsStore } from "../hooks/useStudentsStore";
import { StudentImportModal } from "./StudentImportModal";

type StudentFormState = {
  taxIdNumbers: string;
  taxIdLetter: string;
  guardianFirstName: string;
  guardianLastName: string;
  streetType: string;
  streetName: string;
  streetNumber: string;
  unitAbbreviation: string;
  unitNumber: string;
  floorNumber: string;
  floorLetter: string;
  postalCode: string;
  city: string;
  email: string;
  phone: string;
  studentName: string;
  age: string;
  enrolledAt: string;
  status: StudentStatus;
  notes: string;
};

type StudentSortKey = "studentId" | "guardianFirstName" | "guardianLastName" | "studentName" | "enrolledAt";
type StudentHistoryModal = Student & { historial: StudentCourseHistoryEntry[] };

type StudentsManagerProps = {
  openNewForm?: boolean;
};

function compareByKey<T>(left: T, right: T, direction: "ascending" | "descending"): number {
  const leftValue = left == null ? "" : String(left);
  const rightValue = right == null ? "" : String(right);
  if (leftValue < rightValue) return direction === "ascending" ? -1 : 1;
  if (leftValue > rightValue) return direction === "ascending" ? 1 : -1;
  return 0;
}

const INITIAL_FORM_STATE: StudentFormState = {
  taxIdNumbers: "",
  taxIdLetter: "",
  guardianFirstName: "",
  guardianLastName: "",
  streetType: "C/",
  streetName: "",
  streetNumber: "",
  unitAbbreviation: "Pta.",
  unitNumber: "",
  floorNumber: "",
  floorLetter: "",
  postalCode: "",
  city: "Badajoz",
  email: "",
  phone: "",
  studentName: "",
  age: "",
  enrolledAt: new Date().toISOString().split("T")[0],
  status: "active",
  notes: "",
};

export function StudentsManager({ openNewForm = false }: StudentsManagerProps) {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const { toast } = useToast();

  const {
    students,
    setStudents,
    enrollments,
    classGroups,
    courses,
    taxIdSeparator,
  } = useStudentsStore();
  const [showForm, setShowForm] = useState(openNewForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [selectedStudentHistory, setSelectedStudentHistory] = useState<StudentHistoryModal | null>(null);
  const [detailStudentId, setDetailStudentId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const [filters, setFilters] = useState({ minAge: "", maxAge: "", status: "" });

  const [formState, setFormState] = useState(INITIAL_FORM_STATE);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const nextStudentId = () =>
    nextPrefixedId(
      "C",
      3,
      students.map((student) => student.studentId),
    );

  const handleTaxIdNumbers = (e: ChangeEvent<HTMLInputElement>) => {
    setFormState({
      ...formState,
      taxIdNumbers: formatDniNumbers(e.target.value, taxIdSeparator),
    });
  };

  const handleTaxIdLetter = (e: ChangeEvent<HTMLInputElement>) =>
    setFormState({
      ...formState,
      taxIdLetter: e.target.value
        .toUpperCase()
        .replace(/[^A-Z]/g, "")
        .slice(0, 1),
    });

  const handleFloorLetter = (e: ChangeEvent<HTMLInputElement>) =>
    setFormState({
      ...formState,
      floorLetter: e.target.value
        .toUpperCase()
        .replace(/[^A-Z]/g, "")
        .slice(0, 2),
    });

  const handlePhone = (e: ChangeEvent<HTMLInputElement>) => {
    let phone = e.target.value.replace(/\D/g, "").slice(0, 9);
    if (phone.length > 7) phone = phone.replace(/(\d{3})(\d{2})(\d{2})(\d{1,2})/, "$1 $2 $3 $4");
    else if (phone.length > 5) phone = phone.replace(/(\d{3})(\d{2})(\d{1,2})/, "$1 $2 $3");
    else if (phone.length > 3) phone = phone.replace(/(\d{3})(\d{1,2})/, "$1 $2");
    setFormState({ ...formState, phone });
  };

  const handlePostalCode = (e: ChangeEvent<HTMLInputElement>) => {
    let postalCode = e.target.value.replace(/\D/g, "").slice(0, 5);
    let city = formState.city;
    if (postalCode.length >= 2) {
      const prefix = postalCode.substring(0, 2);
      if (prefix === "06") city = "Badajoz";
      else if (prefix === "10") city = "Cáceres";
      else if (prefix === "28") city = "Madrid";
      else if (prefix === "08") city = "Barcelona";
      else if (prefix === "41") city = "Sevilla";
      else if (prefix === "46") city = "Valencia";
    } else if (postalCode.length === 0) {
      city = "Badajoz";
    }
    setFormState({ ...formState, postalCode, city });
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => setFormState({ ...formState, [e.target.name]: e.target.value });

  const saveStudent = () => {
    if (!formState.guardianFirstName || !formState.guardianLastName) {
      toast({ message: t("students.validationNameRequired"), variant: "warning" });
      return;
    }

    const guardianTaxId = formState.taxIdNumbers
      ? `${formState.taxIdNumbers}-${formState.taxIdLetter}`
      : undefined;
    const formattedAddress =
      `${formState.streetType} ${formState.streetName}` +
      (formState.streetNumber ? `, n.º ${formState.streetNumber}` : "");
    let formattedUnit = "";
    if (formState.unitNumber) formattedUnit += `${formState.unitAbbreviation} ${formState.unitNumber} `;
    if (formState.floorNumber) formattedUnit += `Apt. ${formState.floorNumber} `;
    if (formState.floorLetter) formattedUnit += `${formState.floorLetter}`;

    const studentData: Omit<Student, "studentId"> = {
      guardianTaxId,
      guardianFirstName: formState.guardianFirstName,
      guardianLastName: formState.guardianLastName,
      streetType: formState.streetType,
      streetName: formState.streetName || undefined,
      streetNumber: formState.streetNumber || undefined,
      unitAbbreviation: formState.unitAbbreviation,
      unitNumber: formState.unitNumber || undefined,
      floorNumber: formState.floorNumber || undefined,
      floorLetter: formState.floorLetter || undefined,
      formattedAddress: formattedAddress.trim() || undefined,
      formattedUnit: formattedUnit.trim() || undefined,
      postalCode: formState.postalCode || undefined,
      city: formState.city || undefined,
      email: formState.email || undefined,
      phone: formState.phone || undefined,
      studentName: formState.studentName || undefined,
      age: formState.age ? formState.age : undefined,
      enrolledAt: formState.enrolledAt,
      status: formState.status,
      notes: formState.notes || undefined,
    };

    if (editingId) {
      setStudents(
        students.map((student) =>
          student.studentId === editingId ? { ...studentData, studentId: editingId } : student,
        ),
      );
    } else {
      setStudents([...students, { ...studentData, studentId: nextStudentId() }]);
    }

    closeForm();
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormState(INITIAL_FORM_STATE);
  };

  const openEdit = (studentId: string) => {
    const studentToEdit = students.find((student) => student.studentId === studentId);
    if (!studentToEdit) return;
    const taxIdParts = studentToEdit.guardianTaxId
      ? studentToEdit.guardianTaxId.split("-")
      : ["", ""];
    setFormState({
      ...INITIAL_FORM_STATE,
      guardianFirstName: studentToEdit.guardianFirstName,
      guardianLastName: studentToEdit.guardianLastName,
      taxIdNumbers: taxIdParts[0] || "",
      taxIdLetter: taxIdParts[1] || "",
      streetType: studentToEdit.streetType ?? INITIAL_FORM_STATE.streetType,
      streetName: studentToEdit.streetName ?? "",
      streetNumber: studentToEdit.streetNumber ?? "",
      unitAbbreviation: studentToEdit.unitAbbreviation ?? INITIAL_FORM_STATE.unitAbbreviation,
      unitNumber: studentToEdit.unitNumber ?? "",
      floorNumber: studentToEdit.floorNumber ?? "",
      floorLetter: studentToEdit.floorLetter ?? "",
      postalCode: studentToEdit.postalCode ?? "",
      city: studentToEdit.city ?? "",
      email: studentToEdit.email ?? "",
      phone: studentToEdit.phone ?? "",
      studentName: studentToEdit.studentName ?? "",
      age: studentToEdit.age == null ? "" : String(studentToEdit.age),
      enrolledAt: studentToEdit.enrolledAt,
      status: studentToEdit.status ?? "active",
      notes: studentToEdit.notes ?? "",
    });
    setEditingId(studentToEdit.studentId);
    setShowForm(true);
  };

  const handleEdit = () => {
    const targetId =
      selectedIds.length === 1 ? selectedIds[0] : detailStudentId ?? selectedIds[0];
    if (!targetId) return;
    openEdit(targetId);
  };

  const handleDelete = async () => {
    if (selectedIds.length === 0) return;
    const confirmed = await confirm({
      title: t("students.deleteConfirmTitle"),
      message: t("students.deleteConfirm", { count: selectedIds.length }),
      variant: "danger",
      confirmLabel: t("common.delete"),
    });
    if (!confirmed) return;
    setStudents(students.filter((student) => !selectedIds.includes(student.studentId)));
    setSelectedIds([]);
  };

  const toggleSelectAll = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedIds(visibleStudents.map((student) => student.studentId));
    else setSelectedIds([]);
  };

  const toggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter((item) => item !== id));
    else setSelectedIds([...selectedIds, id]);
  };

  const exportCsv = () => {
    const headers = [
      t("students.export.csvHeaders.code"),
      t("students.export.csvHeaders.status"),
      t("students.export.csvHeaders.firstName"),
      t("students.export.csvHeaders.lastName"),
      t("students.export.csvHeaders.taxId"),
      t("students.export.csvHeaders.student"),
      t("students.export.csvHeaders.age"),
      t("students.export.csvHeaders.enrollmentDate"),
      t("students.export.csvHeaders.address"),
      t("students.export.csvHeaders.zip"),
      t("students.export.csvHeaders.city"),
      t("students.export.csvHeaders.email"),
      t("students.export.csvHeaders.phone"),
    ];
    const rows = visibleStudents.map((student) => [
      student.studentId,
      translateDomainStatus(t, student.status || "active"),
      student.guardianFirstName,
      student.guardianLastName,
      student.guardianTaxId ?? "",
      student.studentName ?? "",
      student.age ?? "",
      student.enrolledAt,
      student.formattedAddress ?? "",
      student.postalCode ?? "",
      student.city ?? "",
      student.email ?? "",
      student.phone ?? "",
    ]);
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = t("students.export.csvFilename");
    link.click();
    setShowExportMenu(false);
  };

  const exportPdf = () => {
    try {
      const doc = new jsPDF("landscape");

      doc.setFontSize(18);
      doc.setTextColor(31, 41, 55);
      doc.text(t("students.export.pdfTitle"), 14, 22);

      doc.setFontSize(10);
      doc.setTextColor(107, 114, 128);
      doc.text(t("students.export.generatedOn", { date: new Date().toLocaleDateString() }), 14, 28);

      const headers = [
        [
          t("students.export.pdfHeaders.code"),
          t("students.export.pdfHeaders.status"),
          t("students.export.pdfHeaders.fullName"),
          t("students.export.pdfHeaders.taxId"),
          t("students.export.pdfHeaders.student"),
          t("students.export.pdfHeaders.age"),
          t("students.export.pdfHeaders.phone"),
          t("students.export.pdfHeaders.city"),
        ],
      ];
      const rows = visibleStudents.map((student) => [
        student.studentId,
        translateDomainStatus(t, student.status || "active"),
        guardianDisplayName(student),
        student.guardianTaxId ?? "",
        student.studentName ?? "",
        student.age == null || student.age === "" ? "-" : String(student.age),
        student.phone ?? "",
        student.city ?? "",
      ]);

      autoTable(doc, {
        head: headers,
        body: rows,
        startY: 35,
        theme: "grid",
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [37, 99, 235], textColor: 255 },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        columnStyles: { 0: { fontStyle: "bold" }, 1: { textColor: [255, 255, 255] } },
        didParseCell: function (data) {
          if (data.section === "body" && data.column.index === 1) {
            const student = visibleStudents[data.row.index];
            const status = student?.status || "active";
            if (status === "active") data.cell.styles.textColor = [22, 163, 74];
            else data.cell.styles.textColor = [220, 38, 38];
          }
        },
      });

      const pdfBlob = doc.output("blob");
      const link = document.createElement("a");
      link.href = URL.createObjectURL(pdfBlob);
      link.download = t("students.export.pdfFilename");
      link.click();

      setShowExportMenu(false);
    } catch (error) {
      toast({
        message: t("students.pdfError", {
          message: error instanceof Error ? error.message : String(error),
        }),
        variant: "error",
      });
      console.error(error);
    }
  };

  const openStudentHistory = (student: Student) => {
    if (!student.studentName) return;
    const historial = buildStudentCourseHistory(
      student.studentId,
      enrollments,
      classGroups,
      courses,
    );
    setSelectedStudentHistory({ ...student, historial });
  };

  const [sortConfig, setSortConfig] = useState<{
    key: StudentSortKey;
    direction: "ascending" | "descending";
  }>({ key: "studentId", direction: "ascending" });

  const visibleStudents = useMemo(() => {
    let filtered = students;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (student) =>
          student.guardianFirstName.toLowerCase().includes(query) ||
          student.guardianLastName.toLowerCase().includes(query) ||
          (student.guardianTaxId && student.guardianTaxId.toLowerCase().includes(query)) ||
          (student.studentName && student.studentName.toLowerCase().includes(query)),
      );
    }

    if (filters.status) {
      filtered = filtered.filter((student) => (student.status || "active") === filters.status);
    }

    if (filters.minAge) {
      filtered = filtered.filter(
        (student) =>
          student.age != null &&
          Number.parseInt(String(student.age), 10) >= Number.parseInt(filters.minAge, 10),
      );
    }
    if (filters.maxAge) {
      filtered = filtered.filter(
        (student) =>
          student.age != null &&
          Number.parseInt(String(student.age), 10) <= Number.parseInt(filters.maxAge, 10),
      );
    }

    if (sortConfig.key !== null) {
      filtered.sort((left, right) =>
        compareByKey(left[sortConfig.key], right[sortConfig.key], sortConfig.direction),
      );
    }
    return filtered;
  }, [students, searchQuery, sortConfig, filters]);

  const detailStudent = useMemo(
    () => visibleStudents.find((student) => student.studentId === detailStudentId) ?? null,
    [visibleStudents, detailStudentId],
  );

  useEffect(() => {
    if (visibleStudents.length === 0) {
      setDetailStudentId(null);
      return;
    }
    if (!detailStudentId || !visibleStudents.some((student) => student.studentId === detailStudentId)) {
      setDetailStudentId(visibleStudents[0].studentId);
    }
  }, [visibleStudents, detailStudentId]);

  const selectStudent = (id: string) => {
    setDetailStudentId(id);
  };

  const DetailField = ({ label, value }: { label: string; value?: ReactNode }) => (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-1 text-sm text-[var(--color-text)] break-words">{value || "-"}</p>
    </div>
  );

  return (
    <div className="bg-[var(--color-surface-elevated)] w-full p-6 md:p-8 rounded-xl shadow-sm border border-[var(--color-border)] flex flex-col min-h-[85vh]">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)] mb-1">{t("students.title")}</h1>
          <p className="text-sm text-[var(--color-text-muted)]">{t("students.subtitle")}</p>
        </div>
        {!showForm && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowImportModal(true)}
              className="flex items-center font-bold py-2.5 px-5 rounded-lg shadow-sm transition-colors bg-[var(--color-surface-elevated)] text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[var(--color-surface)]"
            >
              <FileUp className="w-5 h-5 mr-2" /> {t("students.import.button")}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setFormState(INITIAL_FORM_STATE);
                setShowForm(true);
              }}
              className="flex items-center font-bold py-2.5 px-5 rounded-lg shadow-sm transition-colors bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-on-primary)]"
            >
              <UserPlus className="w-5 h-5 mr-2" /> {t("students.addClient")}
            </button>
          </div>
        )}
      </div>

      {showForm && (
        <div className="mb-6 p-6 bg-[var(--color-info-surface)]/50 border border-[var(--color-border)] rounded-lg shadow-inner shrink-0">
          <h3 className="font-bold text-[var(--color-primary)] mb-4 flex items-center">
            {editingId ? <Edit className="w-5 h-5 mr-2" /> : <UserPlus className="w-5 h-5 mr-2" />}
            {editingId ? t("students.editingClient", { id: editingId }) : t("students.newClientForm")}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
            <div className="flex flex-col">
              <label className="font-semibold text-[var(--color-text)] mb-1">{t("students.code")}</label>
              <input
                type="text"
                value={editingId || nextStudentId()}
                disabled
                className="border border-[var(--color-border)] rounded p-2 bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] cursor-not-allowed"
              />
            </div>

            <div className="flex flex-col md:col-span-1">
              <label className="font-semibold text-[var(--color-text)] mb-1">{t("students.taxId")}</label>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={formState.taxIdNumbers}
                  onChange={handleTaxIdNumbers}
                  placeholder={t("students.placeholders.dniNumbers")}
                  className="w-full border border-[var(--color-border)] rounded p-2 focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-left"
                />
                <span className="text-[var(--color-text-muted)] flex items-center">-</span>
                <input
                  type="text"
                  value={formState.taxIdLetter}
                  onChange={handleTaxIdLetter}
                  placeholder={t("students.placeholders.dniLetter")}
                  className="w-10 border border-[var(--color-border)] rounded p-2 focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-center font-bold uppercase"
                />
              </div>
            </div>

            <div className="flex flex-col md:col-span-1">
              <label className="font-semibold text-[var(--color-text)] mb-1">{t("students.firstName")}</label>
              <input
                type="text"
                name="guardianFirstName"
                value={formState.guardianFirstName}
                onChange={handleChange}
                className="border border-[var(--color-border)] rounded p-2 focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
              />
            </div>

            <div className="flex flex-col md:col-span-2">
              <label className="font-semibold text-[var(--color-text)] mb-1">{t("students.lastName")}</label>
              <input
                type="text"
                name="guardianLastName"
                value={formState.guardianLastName}
                onChange={handleChange}
                className="border border-[var(--color-border)] rounded p-2 focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
              />
            </div>

            <div className="flex flex-col md:col-span-1">
              <label className="font-semibold text-[var(--color-text)] mb-1">{t("students.streetType")}</label>
              <select
                name="streetType"
                value={formState.streetType}
                onChange={handleChange}
                className="border border-[var(--color-border)] rounded p-2 focus:ring-2 focus:ring-[var(--color-primary)] outline-none bg-[var(--color-surface-elevated)]"
              >
                <option value="C/">{t("students.streetTypes.street")}</option>
                <option value="Av.">{t("students.streetTypes.avenue")}</option>
                <option value="Pl.">{t("students.streetTypes.square")}</option>
                <option value="Pº">{t("students.streetTypes.promenade")}</option>
                <option value="Ctra.">{t("students.streetTypes.road")}</option>
                <option value="Cam.">{t("students.streetTypes.path")}</option>
              </select>
            </div>

            <div className="flex flex-col md:col-span-3">
              <label className="font-semibold text-[var(--color-text)] mb-1">{t("students.streetName")}</label>
              <input
                type="text"
                name="streetName"
                value={formState.streetName}
                onChange={handleChange}
                className="border border-[var(--color-border)] rounded p-2 focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                placeholder={t("students.placeholders.streetExample")}
              />
            </div>

            <div className="flex flex-col md:col-span-1">
              <label className="font-semibold text-[var(--color-text)] mb-1">{t("students.number")}</label>
              <div className="flex">
                <span className="bg-[var(--color-surface-muted)] border border-r-0 border-[var(--color-border)] rounded-l p-2 text-[var(--color-text-muted)] font-semibold select-none">
                  {t("students.prefixes.number")}
                </span>
                <input
                  type="text"
                  name="streetNumber"
                  value={formState.streetNumber}
                  onChange={handleChange}
                  className="w-full border border-[var(--color-border)] rounded-r p-2 focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col md:col-span-1">
              <label className="font-semibold text-[var(--color-text)] mb-1">{t("students.portal")}</label>
              <div className="flex">
                <select
                  name="unitAbbreviation"
                  value={formState.unitAbbreviation}
                  onChange={handleChange}
                  className="bg-[var(--color-surface)] border border-r-0 border-[var(--color-border)] rounded-l p-2 outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-xs"
                >
                  <option value="Pta.">{t("students.portalTypes.door")}</option>
                  <option value="P.">{t("students.portalTypes.gate")}</option>
                  <option value="Esc.">{t("students.portalTypes.staircase")}</option>
                  <option value="Blq.">{t("students.portalTypes.block")}</option>
                </select>
                <input
                  type="text"
                  name="unitNumber"
                  value={formState.unitNumber}
                  onChange={handleChange}
                  className="w-full border border-[var(--color-border)] rounded-r p-2 focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col md:col-span-1">
              <label className="font-semibold text-[var(--color-text)] mb-1">{t("students.floor")}</label>
              <div className="flex">
                <span className="bg-[var(--color-surface-muted)] border border-r-0 border-[var(--color-border)] rounded-l p-2 text-[var(--color-text-muted)] font-semibold select-none">
                  {t("students.prefixes.apartment")}
                </span>
                <input
                  type="text"
                  name="floorNumber"
                  value={formState.floorNumber}
                  onChange={handleChange}
                  className="w-1/2 border border-r-0 border-[var(--color-border)] p-2 outline-none text-center focus:ring-2 focus:ring-[var(--color-primary)]"
                  placeholder={t("students.placeholders.floorNum")}
                />
                <input
                  type="text"
                  name="floorLetter"
                  value={formState.floorLetter}
                  onChange={handleFloorLetter}
                  className="w-1/2 border border-[var(--color-border)] rounded-r p-2 outline-none text-center uppercase font-bold focus:ring-2 focus:ring-[var(--color-primary)]"
                  placeholder={t("students.placeholders.floorLetter")}
                />
              </div>
            </div>

            <div className="flex flex-col md:col-span-1">
              <label className="font-semibold text-[var(--color-text)] mb-1">{t("students.zip")}</label>
              <input
                type="text"
                name="postalCode"
                value={formState.postalCode}
                onChange={handlePostalCode}
                className="border border-[var(--color-border)] rounded p-2 focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                placeholder={t("students.placeholders.zip")}
              />
            </div>

            <div className="flex flex-col md:col-span-2">
              <label className="font-semibold text-[var(--color-text)] mb-1">{t("students.city")}</label>
              <input
                type="text"
                name="city"
                value={formState.city}
                onChange={handleChange}
                className="border border-[var(--color-border)] rounded p-2 focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
              />
            </div>

            <div className="flex flex-col md:col-span-2">
              <label className="font-semibold text-[var(--color-text)] mb-1">{t("students.email")}</label>
              <input
                type="email"
                name="email"
                value={formState.email}
                onChange={handleChange}
                className="border border-[var(--color-border)] rounded p-2 focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
              />
            </div>

            <div className="flex flex-col md:col-span-1">
              <label className="font-semibold text-[var(--color-text)] mb-1">{t("students.phone")}</label>
              <input
                type="text"
                name="phone"
                value={formState.phone}
                onChange={handlePhone}
                placeholder={t("students.placeholders.phone")}
                className="border border-[var(--color-border)] rounded p-2 focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-left"
              />
            </div>

            <div className="flex flex-col md:col-span-2">
              <label className="font-semibold text-[var(--color-text)] mb-1">{t("students.studentName")}</label>
              <input
                type="text"
                name="studentName"
                value={formState.studentName}
                onChange={handleChange}
                className="border border-[var(--color-border)] rounded p-2 focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
              />
            </div>

            <div className="flex flex-col md:col-span-1">
              <label className="font-semibold text-[var(--color-text)] mb-1">{t("students.age")}</label>
              <input
                type="number"
                name="age"
                value={formState.age}
                onChange={handleChange}
                placeholder={t("students.placeholders.ageYears")}
                className="border border-[var(--color-border)] rounded p-2 focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-left [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>

            <div className="flex flex-col md:col-span-1">
              <label className="font-semibold text-[var(--color-text)] mb-1">{t("students.enrollmentDate")}</label>
              <input
                type="date"
                name="enrolledAt"
                value={formState.enrolledAt}
                onChange={handleChange}
                className="border border-[var(--color-border)] rounded p-2 focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
              />
            </div>

            <div className="flex flex-col md:col-span-1">
              <label className="font-semibold text-[var(--color-text)] mb-1">{t("students.status")}</label>
              <select
                name="status"
                value={formState.status}
                onChange={handleChange}
                className="border border-[var(--color-border)] rounded p-2 focus:ring-2 focus:ring-[var(--color-primary)] outline-none bg-[var(--color-surface-elevated)] font-bold"
              >
                <option value="active">{t("students.statuses.active")}</option>
                <option value="inactive">{t("students.statuses.inactive")}</option>
              </select>
            </div>

            <div className="flex flex-col md:col-span-5 mt-2">
              <label className="font-semibold text-[var(--color-text)] mb-1">{t("students.notes")}</label>
              <textarea
                name="notes"
                value={formState.notes}
                onChange={handleChange}
                className="border border-[var(--color-border)] rounded p-2 focus:ring-2 focus:ring-[var(--color-primary)] outline-none resize-y min-h-[60px]"
              ></textarea>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[var(--color-border)]">
            <button
              onClick={closeForm}
              className="bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-[var(--color-danger)] hover:bg-[var(--color-danger-surface)] hover:border-red-300 font-bold py-2 px-6 rounded-lg transition-colors"
            >
              {t("common.cancel")}
            </button>
            <button
              onClick={saveStudent}
              className="bg-[var(--color-success)] hover:opacity-90 text-[var(--color-on-primary)] font-bold py-2 px-6 rounded-lg shadow-sm transition-colors"
            >
              {editingId ? t("students.updateClient") : t("students.saveClient")}
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4 shrink-0">
        <div className="relative w-full md:w-96">
          <Search className="w-5 h-5 text-[var(--color-text-muted)] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder={t("students.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto relative">
          <button
            onClick={handleEdit}
            disabled={!detailStudentId && selectedIds.length !== 1}
            className={`flex items-center px-4 py-2 rounded-lg font-semibold transition-colors border ${detailStudentId || selectedIds.length === 1 ? "bg-[var(--color-surface-elevated)] text-[var(--color-primary)] border-blue-200 hover:bg-[var(--color-info-surface)]" : "bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)] cursor-not-allowed"}`}
          >
            <Edit className="w-4 h-4 mr-2" /> {t("common.edit")}
          </button>

          <button
            onClick={handleDelete}
            disabled={selectedIds.length === 0}
            className={`flex items-center px-4 py-2 rounded-lg font-semibold transition-colors border ${selectedIds.length > 0 ? "bg-[var(--color-surface-elevated)] text-[var(--color-danger)] border-[var(--color-border)] hover:bg-[var(--color-danger-surface)]" : "bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)] cursor-not-allowed"}`}
          >
            <Trash2 className="w-4 h-4 mr-2" />{" "}
            {selectedIds.length > 0
              ? t("students.deleteCount", { count: selectedIds.length })
              : t("common.delete")}
          </button>

          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center px-3 py-2 rounded-lg font-semibold transition-colors border ${showFilters || filters.status || filters.minAge || filters.maxAge ? "bg-[var(--color-info-surface)] text-[var(--color-primary)] border-blue-200" : "bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:bg-[var(--color-surface)]"}`}
            >
              <Filter className="w-4 h-4" />
            </button>
            {showFilters && (
              <div className="absolute right-0 mt-2 w-64 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] shadow-xl rounded-lg p-4 z-20">
                <h4 className="font-bold text-[var(--color-text)] mb-3">{t("students.filters.title")}</h4>
                <div className="mb-3">
                  <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">
                    {t("students.filters.status")}
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full border rounded p-1.5 outline-none focus:ring-1 focus:ring-[var(--color-primary)] text-sm"
                  >
                    <option value="">{t("students.filters.all")}</option>
                    <option value="active">{t("students.filters.activeOnly")}</option>
                    <option value="inactive">{t("students.filters.inactiveOnly")}</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">
                    {t("students.filters.ageRange")}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={filters.minAge}
                      onChange={(e) => setFilters({ ...filters, minAge: e.target.value })}
                      className="w-1/2 border rounded p-1.5 outline-none focus:ring-1 focus:ring-[var(--color-primary)] text-sm"
                      placeholder={t("students.filters.min")}
                    />
                    <input
                      type="number"
                      value={filters.maxAge}
                      onChange={(e) => setFilters({ ...filters, maxAge: e.target.value })}
                      className="w-1/2 border rounded p-1.5 outline-none focus:ring-1 focus:ring-[var(--color-primary)] text-sm"
                      placeholder={t("students.filters.max")}
                    />
                  </div>
                </div>
                <div className="flex justify-between">
                  <button
                    onClick={() => setFilters({ status: "", minAge: "", maxAge: "" })}
                    className="text-xs text-[var(--color-danger)] hover:underline"
                  >
                    {t("common.clear")}
                  </button>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="bg-[var(--color-primary)] text-[var(--color-on-primary)] text-xs px-3 py-1 rounded"
                  >
                    {t("common.apply")}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center px-3 py-2 rounded-lg font-semibold text-[var(--color-text-muted)] bg-[var(--color-surface-elevated)] border border-[var(--color-border)] hover:bg-[var(--color-surface)] transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] shadow-xl rounded-lg py-2 z-20">
                <button
                  onClick={exportCsv}
                  className="w-full text-left px-4 py-2 hover:bg-[var(--color-surface)] text-sm font-semibold text-[var(--color-text)] flex items-center"
                >
                  <TableIcon className="w-4 h-4 mr-2 text-[var(--color-success)]" /> {t("students.exportCsv")}
                </button>
                <button
                  onClick={exportPdf}
                  className="w-full text-left px-4 py-2 hover:bg-[var(--color-surface)] text-sm font-semibold text-[var(--color-text)] flex items-center"
                >
                  <FileText className="w-4 h-4 mr-2 text-[var(--color-danger)]" /> {t("students.exportPdf")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 gap-4 overflow-hidden">
        <div className="flex w-full lg:w-2/5 min-h-[420px] flex-col overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
              <input
                type="checkbox"
                checked={
                  selectedIds.length === visibleStudents.length && visibleStudents.length > 0
                }
                onChange={toggleSelectAll}
                className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
              />
              {t("students.list.selectAll")}
            </label>
            <select
              value={sortConfig.key}
              onChange={(e) =>
                setSortConfig({ key: e.target.value as StudentSortKey, direction: "ascending" })
              }
              className="rounded border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-2 py-1 text-xs text-[var(--color-text)] outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
              aria-label={t("students.list.sortBy")}
            >
              <option value="studentId">{t("students.table.code")}</option>
              <option value="guardianFirstName">{t("students.table.firstName")}</option>
              <option value="guardianLastName">{t("students.table.lastName")}</option>
              <option value="studentName">{t("students.table.student")}</option>
              <option value="enrolledAt">{t("students.table.enrolledAt")}</option>
            </select>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {visibleStudents.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-[var(--color-text-muted)]">{t("students.empty")}</p>
            ) : (
              visibleStudents.map((student) => {
                const isActive = detailStudentId === student.studentId;
                const isInactive = student.status === "inactive";
                return (
                  <div
                    key={student.studentId}
                    className={`flex items-start gap-2 px-3 py-3 transition-colors ${
                      isActive ? "bg-[var(--color-info-surface)]" : "hover:bg-[var(--color-surface)]"
                    } ${isInactive ? "opacity-70" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(student.studentId)}
                      onChange={() => toggleSelectOne(student.studentId)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1 h-4 w-4 shrink-0 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                    />
                    <button
                      type="button"
                      onClick={() => selectStudent(student.studentId)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[var(--color-text-muted)]">
                          {student.studentId}
                        </span>
                        <span
                          className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold ${
                            student.status === "active" || !student.status
                              ? "bg-[var(--color-success-surface)] text-[var(--color-success)]"
                              : "bg-[var(--color-danger-surface)] text-[var(--color-danger)]"
                          }`}
                        >
                          {translateDomainStatus(t, student.status || "active")}
                        </span>
                      </div>
                      <p className="mt-1 truncate font-semibold text-[var(--color-text)]">
                        {guardianDisplayName(student)}
                      </p>
                      <p className="truncate text-sm text-[var(--color-primary)]">
                        {student.studentName || t("students.detail.noStudent")}
                      </p>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="hidden lg:flex lg:w-3/5 min-h-[420px] flex-col overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
          {detailStudent ? (
            <>
              <div className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[var(--color-text-muted)]">{detailStudent.studentId}</p>
                    <h2 className="mt-1 text-xl font-bold text-[var(--color-text)]">
                      {guardianDisplayName(detailStudent)}
                    </h2>
                    {detailStudent.studentName ? (
                      <button
                        type="button"
                        onClick={() => openStudentHistory(detailStudent)}
                        className="mt-1 text-sm font-semibold text-[var(--color-primary)] hover:underline"
                      >
                        {detailStudent.studentName}
                      </button>
                    ) : (
                      <p className="mt-1 text-sm text-[var(--color-text-muted)]">{t("students.detail.noStudent")}</p>
                    )}
                  </div>
                  <span
                    className={`inline-flex items-center rounded px-2.5 py-1 text-xs font-bold ${
                      detailStudent.status === "active" || !detailStudent.status
                        ? "bg-[var(--color-success-surface)] text-[var(--color-success)] border border-[var(--color-border)]"
                        : "bg-[var(--color-danger-surface)] text-[var(--color-danger)] border border-[var(--color-border)]"
                    }`}
                  >
                    {translateDomainStatus(t, detailStudent.status || "active")}
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                <section>
                  <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-[var(--color-text)]">
                    {t("students.detail.contact")}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <DetailField label={t("students.taxId")} value={detailStudent.guardianTaxId} />
                    <DetailField label={t("students.phone")} value={detailStudent.phone} />
                    <DetailField label={t("students.email")} value={detailStudent.email} />
                    <DetailField
                      label={t("students.enrollmentDate")}
                      value={detailStudent.enrolledAt}
                    />
                    <DetailField
                      label={t("students.age")}
                      value={
                        detailStudent.age
                          ? t("students.history.ageYears", { count: detailStudent.age })
                          : null
                      }
                    />
                  </div>
                </section>

                <section>
                  <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-[var(--color-text)]">
                    {t("students.detail.address")}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <DetailField label={t("students.table.address")} value={detailStudent.formattedAddress} />
                    <DetailField
                      label={t("students.table.floorDetails")}
                      value={detailStudent.formattedUnit}
                    />
                    <DetailField label={t("students.zip")} value={detailStudent.postalCode} />
                    <DetailField label={t("students.city")} value={detailStudent.city} />
                  </div>
                </section>

                {detailStudent.notes ? (
                  <section>
                    <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-[var(--color-text)]">
                      {t("students.notes")}
                    </h3>
                    <p className="rounded-lg bg-[var(--color-surface)] p-3 text-sm text-[var(--color-text)] whitespace-pre-wrap">
                      {detailStudent.notes}
                    </p>
                  </section>
                ) : null}
              </div>

              <div className="flex gap-2 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3">
                <button
                  type="button"
                  onClick={() => openEdit(detailStudent.studentId)}
                  className="inline-flex items-center rounded-lg border border-blue-200 bg-[var(--color-surface-elevated)] px-4 py-2 text-sm font-semibold text-[var(--color-primary)] hover:bg-[var(--color-info-surface)]"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  {t("common.edit")}
                </button>
                {detailStudent.studentName ? (
                  <button
                    type="button"
                    onClick={() => openStudentHistory(detailStudent)}
                    className="inline-flex items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2 text-sm font-semibold text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    {t("students.history.title")}
                  </button>
                ) : null}
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-[var(--color-text-muted)]">
              {t("students.detail.selectPrompt")}
            </div>
          )}
        </div>
      </div>

      {selectedStudentHistory && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-[var(--color-surface-elevated)] w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 bg-[var(--color-primary)] text-[var(--color-on-primary)] flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold flex items-center">{t("students.history.title")}</h2>
                <p className="text-[var(--color-on-primary)]/80 text-sm opacity-90">{t("students.history.subtitle")}</p>
              </div>
              <button
                onClick={() => setSelectedStudentHistory(null)}
                className="text-[var(--color-on-primary)]/80 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 bg-[var(--color-surface)] border-b border-[var(--color-border)]">
              <div className="flex gap-8">
                <div>
                  <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">
                    {t("students.history.name")}
                  </p>
                  <p className="font-semibold text-[var(--color-text)] text-lg">{selectedStudentHistory.studentName}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">
                    {t("students.history.age")}
                  </p>
                  <p className="font-semibold text-[var(--color-text)] text-lg">
                    {selectedStudentHistory.age
                      ? t("students.history.ageYears", { count: selectedStudentHistory.age })
                      : t("common.notAvailable")}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <h3 className="font-bold text-[var(--color-text)] mb-4">{t("students.history.coursesTitle")}</h3>
              <div className="border border-[var(--color-border)] rounded-lg overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[var(--color-surface-muted)] border-b border-[var(--color-border)]">
                    <tr>
                      <th className="px-4 py-2 font-semibold text-[var(--color-text-muted)] w-24">
                        {t("students.history.year")}
                      </th>
                      <th className="px-4 py-2 font-semibold text-[var(--color-text-muted)]">
                        {t("students.history.course")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedStudentHistory.historial.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="px-4 py-6 text-center text-[var(--color-text-muted)] italic">
                          {t("students.history.noEnrollments")}
                        </td>
                      </tr>
                    ) : (
                      selectedStudentHistory.historial.map((item, index) => (
                        <tr key={index} className="hover:bg-[var(--color-surface)]">
                          <td className="px-4 py-3 text-[var(--color-text-muted)]">{item.year}</td>
                          <td className="px-4 py-3 font-medium text-[var(--color-text)]">
                            {item.courseLabel}
                            {item.status ? (
                              <span className="ml-2 text-xs text-[var(--color-text-muted)]">
                                ({translateDomainStatus(t, item.status)})
                              </span>
                            ) : null}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-surface)] flex justify-end">
              <button
                onClick={() => setSelectedStudentHistory(null)}
                className="bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface-muted)] font-bold py-2 px-6 rounded-lg transition-colors"
              >
                {t("common.close")}
              </button>
            </div>
          </div>
        </div>
      )}

      <StudentImportModal
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
        existingStudents={students}
        onImport={setStudents}
      />
    </div>
  );
}
