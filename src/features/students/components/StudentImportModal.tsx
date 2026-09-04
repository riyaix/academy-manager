import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { FileUp, Upload } from "lucide-react";
import { Modal } from "../../../core/components/Modal";
import { Button } from "../../../core/components/Button";
import { Select } from "../../../core/components/Select";
import { useToast } from "../../../core/components/Toast";
import { parseSpreadsheetFile } from "../../../core/import/parseSpreadsheet";
import {
  applyStudentImport,
  buildStudentImportPreview,
  guessStudentColumnMapping,
  type StudentColumnMapping,
  type StudentImportField,
  type StudentImportMode,
  type StudentImportPreviewRow,
} from "../../../domain/student-import";
import type { Student } from "../../../domain/student";

type StudentImportModalProps = {
  open: boolean;
  onClose: () => void;
  existingStudents: Student[];
  onImport: (students: Student[]) => void;
};

type Step = "upload" | "mapping" | "preview" | "done";

const IMPORT_FIELDS: StudentImportField[] = [
  "skip",
  "guardianFirstName",
  "guardianLastName",
  "guardianTaxId",
  "studentName",
  "email",
  "phone",
  "postalCode",
  "city",
  "age",
  "enrolledAt",
  "status",
  "notes",
];

export function StudentImportModal({
  open,
  onClose,
  existingStudents,
  onImport,
}: StudentImportModalProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<StudentColumnMapping>({});
  const [mode, setMode] = useState<StudentImportMode>("skip_duplicates");
  const [preview, setPreview] = useState<StudentImportPreviewRow[]>([]);
  const [summary, setSummary] = useState({ created: 0, updated: 0, skipped: 0 });
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setStep("upload");
    setFileName("");
    setHeaders([]);
    setRows([]);
    setMapping({});
    setMode("skip_duplicates");
    setPreview([]);
    setSummary({ created: 0, updated: 0, skipped: 0 });
    setBusy(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setBusy(true);
    try {
      const table = await parseSpreadsheetFile(file);
      if (table.headers.length === 0 || table.rows.length === 0) {
        toast({ message: t("students.import.emptyFile"), variant: "warning" });
        return;
      }
      setFileName(file.name);
      setHeaders(table.headers);
      setRows(table.rows);
      setMapping(guessStudentColumnMapping(table.headers));
      setStep("mapping");
    } catch (error) {
      toast({
        message: t("students.import.parseError", {
          message: error instanceof Error ? error.message : String(error),
        }),
        variant: "error",
      });
    } finally {
      setBusy(false);
    }
  };

  const requiredMapped =
    Object.values(mapping).includes("guardianFirstName") &&
    Object.values(mapping).includes("guardianLastName");

  const issueCounts = useMemo(() => {
    const counts = { missing: 0, duplicates: 0, ready: 0 };
    for (const row of preview) {
      if (row.issues.some((issue) => issue.reason === "missing_name")) counts.missing += 1;
      else if (
        row.issues.some(
          (issue) => issue.reason === "duplicate_tax_id" || issue.reason === "duplicate_name",
        )
      ) {
        counts.duplicates += 1;
      } else counts.ready += 1;
    }
    return counts;
  }, [preview]);

  const buildPreview = () => {
    if (!requiredMapped) {
      toast({ message: t("students.import.mappingRequired"), variant: "warning" });
      return;
    }
    setPreview(buildStudentImportPreview(headers, rows, mapping, existingStudents));
    setStep("preview");
  };

  const confirmImport = () => {
    const result = applyStudentImport(existingStudents, preview, mode);
    onImport(result.students);
    setSummary({
      created: result.created.length,
      updated: result.updated.length,
      skipped: result.skipped.length,
    });
    setStep("done");
    toast({
      message: t("students.import.successToast", {
        created: result.created.length,
        updated: result.updated.length,
        skipped: result.skipped.length,
      }),
      variant: "success",
    });
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={t("students.import.title")}
      description={t("students.import.description")}
      size="xl"
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" onClick={handleClose}>
            {t("common.close")}
          </Button>
          {step === "mapping" ? (
            <Button type="button" onClick={buildPreview} disabled={!requiredMapped}>
              {t("students.import.continuePreview")}
            </Button>
          ) : null}
          {step === "preview" ? (
            <>
              <Button type="button" variant="secondary" onClick={() => setStep("mapping")}>
                {t("common.back")}
              </Button>
              <Button type="button" onClick={confirmImport}>
                {t("students.import.confirm")}
              </Button>
            </>
          ) : null}
          {step === "done" ? (
            <Button type="button" onClick={handleClose}>
              {t("students.import.done")}
            </Button>
          ) : null}
        </div>
      }
    >
      {step === "upload" ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-12 text-center">
          <Upload className="size-10 text-[var(--color-primary)]" aria-hidden />
          <p className="text-sm text-[var(--color-text-muted)]">{t("students.import.uploadHint")}</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt,.xlsx,.xls"
            className="hidden"
            onChange={handleFile}
          />
          <Button
            type="button"
            loading={busy}
            leftIcon={<FileUp className="size-4" aria-hidden />}
            onClick={() => fileInputRef.current?.click()}
          >
            {t("students.import.chooseFile")}
          </Button>
        </div>
      ) : null}

      {step === "mapping" ? (
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-text-muted)]">
            {t("students.import.mappingHint", { file: fileName, count: rows.length })}
          </p>
          <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--color-surface)]">
                <tr>
                  <th className="px-3 py-2 font-semibold text-[var(--color-text-muted)]">
                    {t("students.import.column")}
                  </th>
                  <th className="px-3 py-2 font-semibold text-[var(--color-text-muted)]">
                    {t("students.import.mapTo")}
                  </th>
                  <th className="px-3 py-2 font-semibold text-[var(--color-text-muted)]">
                    {t("students.import.sample")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {headers.map((header) => (
                  <tr key={header}>
                    <td className="px-3 py-2 font-medium text-[var(--color-text)]">{header}</td>
                    <td className="px-3 py-2">
                      <Select
                        value={mapping[header] ?? "skip"}
                        onChange={(event) =>
                          setMapping({
                            ...mapping,
                            [header]: event.target.value as StudentImportField,
                          })
                        }
                        aria-label={t("students.import.mapTo")}
                      >
                        {IMPORT_FIELDS.map((field) => (
                          <option key={field} value={field}>
                            {t(`students.import.fields.${field}`)}
                          </option>
                        ))}
                      </Select>
                    </td>
                    <td className="px-3 py-2 text-[var(--color-text-muted)]">
                      {rows[0]?.[header] || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {step === "preview" ? (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[var(--color-text-muted)]">
              {t("students.import.previewSummary", {
                ready: issueCounts.ready,
                duplicates: issueCounts.duplicates,
                missing: issueCounts.missing,
              })}
            </p>
            <Select
              value={mode}
              onChange={(event) => setMode(event.target.value as StudentImportMode)}
              aria-label={t("students.import.duplicateMode")}
              className="max-w-xs"
            >
              <option value="skip_duplicates">{t("students.import.skipDuplicates")}</option>
              <option value="update_duplicates">{t("students.import.updateDuplicates")}</option>
            </Select>
          </div>
          <div className="max-h-80 overflow-auto rounded-lg border border-[var(--color-border)]">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-[var(--color-surface)]">
                <tr>
                  <th className="px-3 py-2">{t("students.import.row")}</th>
                  <th className="px-3 py-2">{t("students.firstName")}</th>
                  <th className="px-3 py-2">{t("students.lastName")}</th>
                  <th className="px-3 py-2">{t("students.taxId")}</th>
                  <th className="px-3 py-2">{t("students.studentName")}</th>
                  <th className="px-3 py-2">{t("students.import.issues")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {preview.map((row) => (
                  <tr key={row.rowNumber}>
                    <td className="px-3 py-2 text-[var(--color-text-muted)]">{row.rowNumber}</td>
                    <td className="px-3 py-2">{row.draft.guardianFirstName || "—"}</td>
                    <td className="px-3 py-2">{row.draft.guardianLastName || "—"}</td>
                    <td className="px-3 py-2">{row.draft.guardianTaxId || "—"}</td>
                    <td className="px-3 py-2">{row.draft.studentName || "—"}</td>
                    <td className="px-3 py-2 text-xs">
                      {row.issues.length === 0
                        ? t("students.import.issueNone")
                        : row.issues
                            .map((issue) =>
                              t(`students.import.issueReasons.${issue.reason}`, {
                                id: issue.matchedStudentId ?? "",
                              }),
                            )
                            .join("; ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {step === "done" ? (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-success-surface)] p-6 text-sm text-[var(--color-text)]">
          <p className="font-semibold mb-2">{t("students.import.doneTitle")}</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>{t("students.import.logCreated", { count: summary.created })}</li>
            <li>{t("students.import.logUpdated", { count: summary.updated })}</li>
            <li>{t("students.import.logSkipped", { count: summary.skipped })}</li>
          </ul>
        </div>
      ) : null}
    </Modal>
  );
}
