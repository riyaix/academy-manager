import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useConfirm } from "../../../core/components/ConfirmDialog";
import { useToast } from "../../../core/components/Toast";
import { allocatePaymentRecordIds, findDuplicateBatchBilling } from "../../../domain/billing";
import { buildBatchPaymentRecords, resolvePayerName } from "../../../domain/billing-batch";
import { formatBillingPeriod } from "../../../domain/billing-period";
import { addMoney, fromMoney, toMoney } from "../../../domain/money";
import {
  calculatePaymentTotal,
  type PaymentLineItem,
  type PaymentRecord,
} from "../../../domain/payment-record";
import { studentDisplayName } from "../../../domain/student";
import { DuplicateBatchWarning } from "./DuplicateBatchWarning";
import { useBillingStore } from "../hooks/useBillingStore";
import { FileText, Plus, Trash2, Users, Layers, Zap, AlertCircle, RotateCcw } from "lucide-react";

type BillingMode = "lote" | "manual";
type ManualLineField = "description" | "quantity" | "unitPrice";

type BillingFormProps = {
  initialModo?: BillingMode;
};

const emptyLineItem = (): PaymentLineItem => ({
  description: "",
  quantity: 1,
  unitPrice: toMoney(0),
});

export function BillingForm({ initialModo = "lote" }: BillingFormProps) {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const { toast } = useToast();
  const [modo, setModo] = useState<BillingMode>(initialModo);

  const {
    students,
    courses,
    paymentRecords,
    setPaymentRecords,
    classGroups,
    enrollments,
    organization,
    paymentRecordSeq,
    setPaymentRecordSeq,
    paymentMethods,
  } = useBillingStore();

  const reserveRecordIds = (count: number) => {
    const { ids, nextCounters } = allocatePaymentRecordIds(
      count,
      paymentRecords,
      paymentRecordSeq ?? {},
    );
    setPaymentRecordSeq(nextCounters);
    return ids;
  };

  const showSuccessToast = () => {
    toast({ message: t("billing.createdSuccess"), variant: "success" });
  };

  // ==========================================
  // BATCH BILLING
  // ==========================================
  const [billingPeriod, setBillingPeriod] = useState(() => formatBillingPeriod(t));
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [batchPaymentMethod, setBatchPaymentMethod] = useState("");

  const activeClassGroups = useMemo(
    () => classGroups.filter((group) => group.status !== "archived"),
    [classGroups],
  );

  const toggleGroup = (classGroupId: string) => {
    if (selectedGroupIds.includes(classGroupId)) {
      setSelectedGroupIds(selectedGroupIds.filter((id) => id !== classGroupId));
    } else {
      setSelectedGroupIds([...selectedGroupIds, classGroupId]);
    }
  };

  const selectAllGroups = () => {
    const activeIds = activeClassGroups.map((group) => group.classGroupId);
    if (selectedGroupIds.length === activeIds.length) {
      setSelectedGroupIds([]);
    } else {
      setSelectedGroupIds(activeIds);
    }
  };

  const clearBatch = async () => {
    const confirmed = await confirm({
      title: t("billing.clearBatchTitle"),
      message: t("billing.clearBatchConfirm"),
      variant: "danger",
    });
    if (!confirmed) return;
    setBillingPeriod(formatBillingPeriod(t));
    setSelectedGroupIds([]);
    setBatchPaymentMethod("");
  };

  const batchPreview = useMemo(() => {
    return buildBatchPaymentRecords({
      billingPeriod,
      selectedGroupIds,
      enrollments,
      classGroups,
      courses,
      students,
    });
  }, [selectedGroupIds, enrollments, classGroups, courses, students, billingPeriod]);

  const duplicateConflicts = useMemo(
    () => findDuplicateBatchBilling(paymentRecords, billingPeriod, selectedGroupIds),
    [paymentRecords, billingPeriod, selectedGroupIds],
  );

  const generateBatchRecords = async () => {
    if (batchPreview.length === 0) return;

    if (duplicateConflicts.length > 0) {
      const conflictList = duplicateConflicts
        .map((conflict) => `• ${conflict.recordId} — ${conflict.payerName}`)
        .join("\n");
      const proceedDespiteDuplicates = await confirm({
        title: t("billing.duplicateWarningTitle"),
        message: t("billing.duplicateWarningConfirm", {
          count: duplicateConflicts.length,
          list: conflictList,
        }),
        variant: "danger",
      });
      if (!proceedDespiteDuplicates) return;
    }

    const confirmed = await confirm({
      title: t("billing.generateBatchTitle"),
      message: t("billing.generateBatchConfirm", { count: batchPreview.length }),
    });
    if (!confirmed) return;

    const issuedOn = new Date().toISOString().split("T")[0];
    const recordIds = reserveRecordIds(batchPreview.length);
    const newRecords: PaymentRecord[] = batchPreview.map((draft, index) => ({
      recordId: recordIds[index],
      issuedOn,
      studentId: draft.student.studentId,
      payerName: resolvePayerName(draft.student),
      lineItems: draft.lineItems,
      total: draft.total,
      status: "pending",
      billingPeriod,
      groupIds: [...selectedGroupIds],
      ...(batchPaymentMethod ? { paymentMethod: batchPaymentMethod } : {}),
    }));

    setPaymentRecords([...paymentRecords, ...newRecords]);
    setSelectedGroupIds([]);
    showSuccessToast();
  };

  // ==========================================
  // MANUAL BILLING
  // ==========================================
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [manualIssueDate, setManualIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [manualPaymentMethod, setManualPaymentMethod] = useState("");
  const [manualLineItems, setManualLineItems] = useState<PaymentLineItem[]>([emptyLineItem()]);

  const addManualLine = () => setManualLineItems([...manualLineItems, emptyLineItem()]);

  const updateManualLine = (index: number, field: ManualLineField, value: string) => {
    const next = [...manualLineItems];
    if (field === "description") {
      next[index] = { ...next[index], description: value };
    } else if (field === "quantity") {
      next[index] = { ...next[index], quantity: Number.parseFloat(value) || 0 };
    } else {
      next[index] = { ...next[index], unitPrice: toMoney(Number.parseFloat(value) || 0) };
    }
    setManualLineItems(next);
  };

  const removeManualLine = (index: number) => {
    if (manualLineItems.length === 1) return;
    setManualLineItems(manualLineItems.filter((_, i) => i !== index));
  };

  const loadCourseIntoLine = (index: number, courseId: string) => {
    const course = courses.find((item) => item.courseId === courseId);
    if (course) {
      const next = [...manualLineItems];
      next[index] = {
        ...next[index],
        description: course.courseName,
        unitPrice: course.monthlyFee,
      };
      setManualLineItems(next);
    }
  };

  const clearManual = async () => {
    const confirmed = await confirm({
      title: t("billing.clearManualTitle"),
      message: t("billing.clearManualConfirm"),
      variant: "danger",
    });
    if (!confirmed) return;
    setSelectedStudentId("");
    setManualIssueDate(new Date().toISOString().split("T")[0]);
    setManualPaymentMethod("");
    setManualLineItems([emptyLineItem()]);
  };

  const manualTotal = calculatePaymentTotal(manualLineItems);

  const saveManualRecord = () => {
    if (!selectedStudentId) {
      toast({ message: t("billing.clientRequired"), variant: "warning" });
      return;
    }
    if (manualLineItems.some((line) => !line.description || fromMoney(line.unitPrice) <= 0)) {
      toast({ message: t("billing.linesInvalid"), variant: "warning" });
      return;
    }

    const student = students.find((item) => item.studentId === selectedStudentId);
    if (!student) {
      toast({ message: t("billing.clientRequired"), variant: "warning" });
      return;
    }
    const [recordId] = reserveRecordIds(1);

    const newRecord: PaymentRecord = {
      recordId,
      issuedOn: manualIssueDate,
      studentId: selectedStudentId,
      payerName: resolvePayerName(student),
      lineItems: manualLineItems,
      total: manualTotal,
      status: "pending",
      ...(manualPaymentMethod ? { paymentMethod: manualPaymentMethod } : {}),
    };

    setPaymentRecords([...paymentRecords, newRecord]);
    setSelectedStudentId("");
    setManualLineItems([emptyLineItem()]);
    showSuccessToast();
  };

  return (
    <div className="bg-[var(--color-surface-elevated)] w-full p-6 md:p-8 rounded-xl shadow-sm border border-[var(--color-border)] flex flex-col min-h-[85vh] relative">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-[var(--color-border)] pb-4 shrink-0 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)] mb-1">{t("billing.title")}</h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            {organization?.legalName
              ? t("billing.subtitleWithOrg", { name: organization.legalName })
              : t("billing.subtitle")}
          </p>
        </div>

        <div className="flex bg-[var(--color-surface-muted)] p-1 rounded-lg border border-[var(--color-border)]">
          <button
            onClick={() => setModo("lote")}
            className={`flex items-center px-5 py-2 rounded-md text-sm font-bold transition-colors cursor-pointer ${modo === "lote" ? "bg-[var(--color-surface-elevated)] text-[var(--color-primary)] shadow-sm" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"}`}
          >
            <Zap className="w-4 h-4 mr-2" /> {t("billing.modeBatch")}
          </button>
          <button
            onClick={() => setModo("manual")}
            className={`flex items-center px-5 py-2 rounded-md text-sm font-bold transition-colors cursor-pointer ${modo === "manual" ? "bg-[var(--color-surface-elevated)] text-[var(--color-primary)] shadow-sm" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"}`}
          >
            <FileText className="w-4 h-4 mr-2" /> {t("billing.modeManual")}
          </button>
        </div>
      </div>

      {modo === "lote" && (
        <div className="flex-1 flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/2 flex flex-col gap-6">
            <div className="bg-[var(--color-info-surface)] border border-[var(--color-border)] p-5 rounded-xl relative">
              <h3 className="font-bold text-[var(--color-primary)] mb-2 flex items-center">
                <Layers className="w-5 h-5 mr-2" /> {t("billing.step1Title")}
              </h3>
              <p className="text-sm text-[var(--color-primary)]/80 mb-4">
                {t("billing.step1Hint")}
              </p>

              <label className="font-bold text-[var(--color-text)] text-sm mb-1 block">
                {t("billing.billingPeriodLabel")}
              </label>
              <input
                type="text"
                value={billingPeriod}
                onChange={(e) => setBillingPeriod(e.target.value)}
                className="w-full border border-blue-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-[var(--color-primary)] font-semibold bg-[var(--color-surface-elevated)]"
                placeholder={t("billing.billingPeriodPlaceholder")}
              />

              <label className="font-bold text-[var(--color-text)] text-sm mb-1 block mt-4">
                {t("billing.paymentMethodLabel")}
              </label>
              <select
                value={batchPaymentMethod}
                onChange={(e) => setBatchPaymentMethod(e.target.value)}
                className="w-full border border-blue-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-[var(--color-surface-elevated)] cursor-pointer font-medium"
              >
                <option value="">{t("billing.paymentMethodNone")}</option>
                {paymentMethods.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-5 rounded-xl flex-1 flex flex-col relative">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h3 className="font-bold text-[var(--color-text)] mb-1 flex items-center">
                    <Users className="w-5 h-5 mr-2 text-[var(--color-text-muted)]" />{" "}
                    {t("billing.step2Title")}
                  </h3>
                  <p className="text-sm text-[var(--color-text-muted)]">{t("billing.step2Hint")}</p>
                </div>
                <button
                  onClick={selectAllGroups}
                  className="text-xs font-bold text-[var(--color-primary)] hover:underline cursor-pointer"
                >
                  {t("billing.selectAllGroups")}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                {activeClassGroups.length === 0 ? (
                  <p className="text-sm text-center text-[var(--color-text-muted)] italic py-4">
                    {t("billing.noActiveGroups")}
                  </p>
                ) : (
                  activeClassGroups.map((group) => {
                    const isSelected = selectedGroupIds.includes(group.classGroupId);
                    const activeCount = enrollments.filter(
                      (enrollment) =>
                        enrollment.classGroupId === group.classGroupId &&
                        enrollment.status === "active",
                    ).length;
                    return (
                      <div
                        key={group.classGroupId}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors flex items-center justify-between ${isSelected ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-[var(--color-on-primary)] shadow-md" : "bg-[var(--color-surface-elevated)] border-[var(--color-border)] hover:border-[var(--color-primary)]"}`}
                        onClickCapture={() => toggleGroup(group.classGroupId)}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            readOnly
                            className="w-4 h-4 cursor-pointer"
                          />
                          <div>
                            <p className="font-bold text-sm leading-tight">{group.name}</p>
                            <p
                              className={`text-xs mt-0.5 ${isSelected ? "text-[var(--color-on-primary)]/80" : "text-[var(--color-text-muted)]"}`}
                            >
                              {group.startTime} • {group.weekdays.join(", ")}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`text-xs font-bold px-2 py-1 rounded-md ${isSelected ? "bg-black/20" : "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]"}`}
                        >
                          {t("billing.studentsCount", { count: activeCount })}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="w-full md:w-1/2 flex flex-col border border-[var(--color-border)] rounded-xl overflow-hidden shadow-sm bg-[var(--color-surface-elevated)]">
            <div className="p-5 border-b border-[var(--color-border)] bg-[var(--color-surface)] flex justify-between items-center">
              <h3 className="font-bold text-[var(--color-text)]">{t("billing.step3Title")}</h3>
              <button
                onClick={clearBatch}
                className="text-sm font-bold text-[var(--color-text-muted)] hover:text-[var(--color-danger)] flex items-center transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 mr-1" /> {t("billing.clearAll")}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {batchPreview.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-[var(--color-text-muted)] text-center">
                  <FileText className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-lg font-bold">{t("billing.emptyPreviewTitle")}</p>
                  <p className="text-sm mt-1">{t("billing.emptyPreviewHint")}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg flex items-start gap-2 mb-4">
                    <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-yellow-800 font-medium">
                      {t("billing.familyGroupingHint")}
                    </p>
                  </div>

                  <DuplicateBatchWarning conflicts={duplicateConflicts} />

                  {batchPreview.map((draft) => (
                    <div
                      key={draft.student.studentId}
                      className="border border-[var(--color-border)] rounded-lg p-3 bg-[var(--color-surface-elevated)] shadow-sm flex justify-between items-center"
                    >
                      <div className="w-2/3">
                        <p className="font-bold text-[var(--color-text)] text-sm truncate">
                          {resolvePayerName(draft.student)}
                        </p>
                        <div className="mt-1 space-y-1">
                          {draft.lineItems.map((line, i) => (
                            <p
                              key={i}
                              className="text-[10px] text-[var(--color-text-muted)] truncate"
                            >
                              - {line.description}
                            </p>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-[var(--color-primary)]">
                          {fromMoney(draft.total).toFixed(2)} €
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-5 bg-[var(--color-surface)] border-t border-[var(--color-border)] shrink-0">
              <div className="flex justify-between items-center mb-4">
                <p className="text-[var(--color-text-muted)] font-medium text-sm">
                  {t("billing.totalRecordsLabel")}
                </p>
                <p className="font-black text-2xl text-[var(--color-text)]">
                  {batchPreview.length}
                </p>
              </div>
              <div className="flex justify-between items-center mb-6">
                <p className="text-[var(--color-text-muted)] font-medium text-sm">
                  {t("billing.estimatedVolumeLabel")}
                </p>
                <p className="font-black text-2xl text-[var(--color-success)]">
                  {fromMoney(addMoney(...batchPreview.map((draft) => draft.total))).toFixed(2)} €
                </p>
              </div>

              <button
                onClick={generateBatchRecords}
                disabled={batchPreview.length === 0}
                className={`w-full py-4 rounded-xl font-black text-lg flex items-center justify-center transition-all ${batchPreview.length > 0 ? "bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-on-primary)] shadow-lg cursor-pointer hover:scale-[1.01]" : "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] cursor-not-allowed"}`}
              >
                <Zap className="w-6 h-6 mr-2" fill="currentColor" /> {t("billing.generateRecords")}
              </button>
            </div>
          </div>
        </div>
      )}

      {modo === "manual" && (
        <div className="max-w-4xl mx-auto w-full">
          <div className="flex justify-end mb-4">
            <button
              onClick={clearManual}
              className="text-sm font-bold text-[var(--color-text-muted)] hover:text-[var(--color-danger)] flex items-center transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 mr-1" /> {t("billing.clearForm")}
            </button>
          </div>

          <div className="bg-[var(--color-surface)] p-6 rounded-xl border border-[var(--color-border)] mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="font-bold text-[var(--color-text)] text-sm mb-1 block">
                  {t("billing.selectClientLabel")}
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full border border-[var(--color-border)] rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-[var(--color-surface-elevated)] cursor-pointer font-medium"
                >
                  <option value="">{t("billing.selectClientPlaceholder")}</option>
                  {students.map((student) => (
                    <option key={student.studentId} value={student.studentId}>
                      {studentDisplayName(student)}
                      {student.guardianTaxId ? ` (${student.guardianTaxId})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-bold text-[var(--color-text)] text-sm mb-1 block">
                  {t("billing.issueDateLabel")}
                </label>
                <input
                  type="date"
                  value={manualIssueDate}
                  onChange={(e) => setManualIssueDate(e.target.value)}
                  className="w-full border border-[var(--color-border)] rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-[var(--color-surface-elevated)] cursor-pointer font-medium"
                />
              </div>
              <div>
                <label className="font-bold text-[var(--color-text)] text-sm mb-1 block">
                  {t("billing.paymentMethodLabel")}
                </label>
                <select
                  value={manualPaymentMethod}
                  onChange={(e) => setManualPaymentMethod(e.target.value)}
                  className="w-full border border-[var(--color-border)] rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-[var(--color-surface-elevated)] cursor-pointer font-medium"
                >
                  <option value="">{t("billing.paymentMethodNone")}</option>
                  {paymentMethods.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="border border-[var(--color-border)] rounded-xl overflow-hidden shadow-sm mb-6">
            <div className="bg-[var(--color-surface)] border-b border-[var(--color-border)] p-4 flex justify-between items-center">
              <h3 className="font-bold text-[var(--color-text)]">{t("billing.lineItemsTitle")}</h3>
              <button
                onClick={addManualLine}
                className="text-sm font-bold text-[var(--color-primary)] bg-[var(--color-info-surface)] hover:bg-[var(--color-info-surface)] px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center"
              >
                <Plus className="w-4 h-4 mr-1" /> {t("billing.addFreeLine")}
              </button>
            </div>

            <div className="p-0">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-[var(--color-surface-elevated)] border-b border-[var(--color-border)] text-xs uppercase text-[var(--color-text-muted)]">
                  <tr>
                    <th scope="col" className="px-6 py-3 font-bold w-1/3">
                      {t("billing.catalogOptional")}
                    </th>
                    <th scope="col" className="px-6 py-3 font-bold w-full">
                      {t("billing.conceptDescription")}
                    </th>
                    <th scope="col" className="px-6 py-3 font-bold text-center w-24">
                      {t("billing.quantity")}
                    </th>
                    <th scope="col" className="px-6 py-3 font-bold text-right w-32">
                      {t("billing.unitPrice")}
                    </th>
                    <th className="px-6 py-3 font-bold text-center w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {manualLineItems.map((line, index) => (
                    <tr key={index} className="bg-[var(--color-surface-elevated)]">
                      <td className="px-4 py-3">
                        <select
                          onChange={(e) => loadCourseIntoLine(index, e.target.value)}
                          className="w-full border border-[var(--color-border)] rounded p-2 text-xs outline-none focus:border-[var(--color-primary)] bg-[var(--color-surface)]"
                        >
                          <option value="">{t("billing.selectCoursePlaceholder")}</option>
                          {courses.map((course) => (
                            <option key={course.courseId} value={course.courseId}>
                              {course.courseName}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={line.description}
                          onChange={(e) => updateManualLine(index, "description", e.target.value)}
                          placeholder={t("billing.conceptPlaceholder")}
                          className="w-full border border-[var(--color-border)] rounded p-2 text-sm font-medium outline-none focus:border-[var(--color-primary)]"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="1"
                          value={line.quantity}
                          onChange={(e) => updateManualLine(index, "quantity", e.target.value)}
                          className="w-full border border-[var(--color-border)] rounded p-2 text-sm text-center outline-none focus:border-[var(--color-primary)]"
                        />
                      </td>
                      <td className="px-4 py-3 relative">
                        <input
                          type="number"
                          step="0.01"
                          value={fromMoney(line.unitPrice)}
                          onChange={(e) => updateManualLine(index, "unitPrice", e.target.value)}
                          className="w-full border border-[var(--color-border)] rounded p-2 text-sm text-right outline-none focus:border-[var(--color-primary)] pr-6"
                        />
                        <span className="absolute right-6 top-5 text-[var(--color-text-muted)] text-sm font-bold">
                          €
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => removeManualLine(index)}
                          className="p-1.5 text-red-400 hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-surface)] rounded transition-colors cursor-pointer disabled:opacity-30"
                          disabled={manualLineItems.length === 1}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-[var(--color-surface)] border-t border-[var(--color-border)] p-6 flex justify-end items-center gap-6">
              <p className="text-[var(--color-text-muted)] font-bold uppercase tracking-wide text-sm">
                {t("billing.totalLabel")}
              </p>
              <p className="font-black text-3xl text-[var(--color-text)]">
                {fromMoney(manualTotal).toFixed(2)} €
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={saveManualRecord}
              className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-on-primary)] font-bold py-3 px-8 rounded-xl shadow-md cursor-pointer transition-colors text-lg flex items-center"
            >
              {t("billing.saveManual")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
