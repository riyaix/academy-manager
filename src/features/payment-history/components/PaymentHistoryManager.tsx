import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useConfirm } from "../../../core/components/ConfirmDialog";
import { useToast } from "../../../core/components/Toast";
import {
  downloadPaymentRecordPdf,
  getPaymentRecordPdfLabels,
} from "../../../core/pdf/generatePaymentRecordPdf";
import {
  Search,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  Filter,
  Ban,
  Euro,
  TrendingUp,
  AlertCircle,
  CalendarRange,
  X,
} from "lucide-react";
import { downloadPaymentPeriodReportCsv } from "../../../core/export/paymentPeriodReport";
import { PaymentRecordPreviewModal } from "../../../core/components/PaymentRecordPreviewModal";
import { usePaymentHistoryStore } from "../hooks/usePaymentHistoryStore";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  translateDomainStatus,
  translateRecordStatusFilter,
} from "../../../core/i18n/legacyUi";
import { summarizePaymentRecordTotals } from "../../../domain/income-summary";
import { fromMoney } from "../../../domain/money";
import { normalizeTaxMode } from "../../../domain/settings";
import type { PaymentRecord, PaymentRecordStatus } from "../../../domain/payment-record";

type PaymentStatusFilter = "all" | PaymentRecordStatus;

type PaymentHistoryManagerProps = {
  initialStatusFilter?: PaymentStatusFilter;
};

export function PaymentHistoryManager({
  initialStatusFilter = "all",
}: PaymentHistoryManagerProps) {
  const { t, i18n } = useTranslation();
  const { confirm } = useConfirm();
  const { toast } = useToast();

  const {
    paymentRecords: facturas,
    setPaymentRecords: setFacturas,
    students: clientes,
    organization,
    taxMode,
    defaultVatRate,
    defaultIncomeTaxReserveRate,
    currencySymbol,
    brandColor,
    logoDataUrl,
    paymentMethods,
  } = usePaymentHistoryStore();
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<PaymentStatusFilter>(initialStatusFilter);
  const [filtroMetodoPago, setFiltroMetodoPago] = useState("Todos");
  const [previewRecord, setPreviewRecord] = useState<PaymentRecord | null>(null);

  // Nuevo Estado para el Rango de Fechas
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  const metodosDisponibles = useMemo(() => {
    const fromRecords = facturas
      .map((record) => record.paymentMethod)
      .filter((method) => Boolean(method));
    return [...new Set([...paymentMethods, ...fromRecords])].sort((left, right) =>
      (left ?? "").localeCompare(right ?? ""),
    );
  }, [facturas, paymentMethods]);

  // Aplicar filtros (Búsqueda, Estado y Rango de Fechas)
  const facturasFiltradas = useMemo(() => {
    return facturas
      .filter((record) => {
        const coincideBusqueda =
          record.recordId.toLowerCase().includes(busqueda.toLowerCase()) ||
          record.payerName.toLowerCase().includes(busqueda.toLowerCase());
        const coincideEstado = filtroEstado === "all" || record.status === filtroEstado;
        const coincideMetodo =
          filtroMetodoPago === "Todos" ||
          (filtroMetodoPago === "__none__" ? !record.paymentMethod : record.paymentMethod === filtroMetodoPago);

        // Lógica del Rango de Fechas
        let coincideFecha = true;
        const fDate = new Date(record.issuedOn);
        if (fechaDesde) {
          coincideFecha = coincideFecha && fDate >= new Date(fechaDesde);
        }
        if (fechaHasta) {
          coincideFecha = coincideFecha && fDate <= new Date(fechaHasta);
        }

        return coincideBusqueda && coincideEstado && coincideMetodo && coincideFecha;
      })
      .sort((a, b) => new Date(b.issuedOn).getTime() - new Date(a.issuedOn).getTime());
  }, [facturas, busqueda, filtroEstado, filtroMetodoPago, fechaDesde, fechaHasta]);

  const metricas = useMemo(() => {
    const totals = summarizePaymentRecordTotals(facturasFiltradas);
    return {
      cobrado: totals.collected,
      pendiente: totals.pending,
      emitido: totals.issued,
    };
  }, [facturasFiltradas]);

  // --- ACCIONES DE ESTADO ---
  const cambiarEstado = (recordId: string, nuevoEstado: PaymentRecordStatus) => {
    setFacturas(
      facturas.map((record) => {
        if (record.recordId !== recordId) return record;
        if (nuevoEstado === "voided") {
          return { ...record, status: nuevoEstado, voidedAt: new Date().toISOString() };
        }
        return { ...record, status: nuevoEstado };
      }),
    );
  };

  const formatearFechaStr = (fechaObj: string) => {
    if (!fechaObj) return "";
    const [year, month, day] = fechaObj.split("-");
    return `${day}/${month}/${year}`;
  };

  const pdfOptionsFor = (record: PaymentRecord) => {
    const student = clientes.find((client) => client.studentId === record.studentId);
    return {
      organization: organization ?? { legalName: t("settings.company.defaultName") },
      student,
      taxMode: normalizeTaxMode(taxMode),
      vatRate: defaultVatRate ?? 0,
      incomeTaxReserveRate: defaultIncomeTaxReserveRate ?? 20,
      currencySymbol: currencySymbol ?? "€",
      brandColor: brandColor || "#2563eb",
      logoDataUrl: logoDataUrl,
    };
  };

  // --- MOTOR DE PDF DE REGISTROS DE COBRO ---
  const descargarPDF = (record: PaymentRecord) => {
    try {
      const locale = i18n.language?.startsWith("en") ? "en" : "es";
      downloadPaymentRecordPdf(record, {
        ...pdfOptionsFor(record),
        labels: getPaymentRecordPdfLabels(locale),
      });
    } catch (error) {
      toast({
        message: t("paymentHistory.pdfError", {
          message: error instanceof Error ? error.message : String(error),
        }),
        variant: "error",
      });
    }
  };

  const anularFactura = async (id: string) => {
    const confirmed = await confirm({
      title: t("paymentHistory.voidConfirmTitle"),
      message: t("paymentHistory.voidConfirm"),
      variant: "danger",
    });
    if (!confirmed) return;
    cambiarEstado(id, "voided");
  };

  const exportarCsv = () => {
    if (facturasFiltradas.length === 0) {
      toast({ message: t("paymentHistory.export.empty"), variant: "warning" });
      return;
    }

    downloadPaymentPeriodReportCsv(
      facturasFiltradas,
      {
        month: t("paymentHistory.export.columns.month"),
        student: t("paymentHistory.export.columns.student"),
        amount: t("paymentHistory.export.columns.amount"),
        status: t("paymentHistory.export.columns.status"),
      },
      (status) => translateDomainStatus(t, status),
      t("paymentHistory.export.filename"),
    );
  };

  const exportarPdf = () => {
    if (facturasFiltradas.length === 0) {
      toast({ message: t("paymentHistory.export.empty"), variant: "warning" });
      return;
    }

    try {
      const doc = new jsPDF("landscape");
      doc.setFontSize(16);
      doc.text(t("paymentHistory.export.pdfTitle"), 14, 18);
      doc.setFontSize(10);
      doc.text(
        t("paymentHistory.export.generatedOn", { date: new Date().toLocaleDateString() }),
        14,
        25,
      );

      autoTable(doc, {
        startY: 30,
        head: [
          [
            t("paymentHistory.columns.recordNumber"),
            t("common.date"),
            t("paymentHistory.columns.client"),
            t("paymentHistory.columns.paymentMethod"),
            t("common.amount"),
            t("common.status"),
          ],
        ],
        body: facturasFiltradas.map((record) => [
          record.recordId,
          formatearFechaStr(record.issuedOn),
          record.payerName,
          record.paymentMethod || t("paymentHistory.noPaymentMethod"),
          `${fromMoney(record.total).toFixed(2)} ${currencySymbol ?? "€"}`,
          translateDomainStatus(t, record.status),
        ]),
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [37, 99, 235], textColor: 255 },
      });

      const blob = doc.output("blob");
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = t("paymentHistory.export.pdfFilename");
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      toast({
        message: t("paymentHistory.pdfError", {
          message: error instanceof Error ? error.message : String(error),
        }),
        variant: "error",
      });
    }
  };

  return (
    <div className="bg-[var(--color-surface-elevated)] w-full p-6 md:p-8 rounded-xl shadow-sm border border-[var(--color-border)] flex flex-col min-h-[85vh]">
      {/* CABECERA */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-[var(--color-border)] pb-4 shrink-0 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)] mb-1">{t("paymentHistory.title")}</h1>
          <p className="text-sm text-[var(--color-text-muted)]">{t("paymentHistory.subtitle")}</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={exportarCsv}
            className="text-sm font-bold text-[var(--color-primary)] bg-[var(--color-info-surface)] border border-blue-200 hover:bg-[var(--color-info-surface)] px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {t("paymentHistory.exportCsv")}
          </button>
          <button
            type="button"
            onClick={exportarPdf}
            className="text-sm font-bold text-[var(--color-primary)] bg-[var(--color-info-surface)] border border-blue-200 hover:bg-[var(--color-info-surface)] px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            {t("paymentHistory.exportPdf")}
          </button>
          <div className="bg-[var(--color-info-surface)] text-[var(--color-primary)] px-4 py-2 rounded-lg font-bold flex items-center border border-[var(--color-border)] shadow-sm">
            <FileText className="w-5 h-5 mr-2" />{" "}
            {t("paymentHistory.recordsInView", { count: facturasFiltradas.length })}
          </div>
        </div>
      </div>

      {/* MÉTRICAS FINANCIERAS (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 shrink-0">
        <div className="bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-[var(--color-info-surface)] text-[var(--color-primary)] rounded-lg">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-[var(--color-text-muted)] font-bold uppercase tracking-wider mb-0.5">
              {t("paymentHistory.kpi.totalIssued")}
            </p>
            <p className="text-2xl font-black text-[var(--color-text)]">
              {fromMoney(metricas.emitido).toFixed(2)} €
            </p>
          </div>
        </div>

        <div className="bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-[var(--color-success-surface)] text-[var(--color-success)] rounded-lg">
            <Euro className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-[var(--color-text-muted)] font-bold uppercase tracking-wider mb-0.5">
              {t("paymentHistory.kpi.totalCollected")}
            </p>
            <p className="text-2xl font-black text-[var(--color-success)]">
              {fromMoney(metricas.cobrado).toFixed(2)} €
            </p>
          </div>
        </div>

        <div className="bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-orange-100 text-orange-600 rounded-lg">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-[var(--color-text-muted)] font-bold uppercase tracking-wider mb-0.5">
              {t("paymentHistory.kpi.totalPending")}
            </p>
            <p className="text-2xl font-black text-orange-600">
              {fromMoney(metricas.pendiente).toFixed(2)} €
            </p>
          </div>
        </div>
      </div>

      {/* BARRA DE FILTROS SUPERPOTENCIADA */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6 bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-border)] shrink-0 items-center">
        {/* Búsqueda Textual */}
        <div className="relative w-full lg:w-1/3">
          <Search className="w-5 h-5 text-[var(--color-text-muted)] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder={t("paymentHistory.searchPlaceholder")}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-[var(--color-border)] rounded-lg outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-[var(--color-surface-elevated)]"
          />
        </div>

        <div className="flex flex-col md:flex-row gap-4 w-full lg:w-2/3 justify-end items-center">
          {/* Filtro de Método de Pago */}
          <div className="relative w-full md:w-auto min-w-[180px]">
            <Filter className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3 top-3" />
            <select
              value={filtroMetodoPago}
              onChange={(e) => setFiltroMetodoPago(e.target.value)}
              className="w-full pl-9 pr-8 py-2 border border-[var(--color-border)] rounded-lg outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-[var(--color-surface-elevated)] font-medium text-[var(--color-text)] cursor-pointer appearance-none"
            >
              <option value="Todos">{t("paymentHistory.filters.allPaymentMethods")}</option>
              <option value="__none__">{t("paymentHistory.filters.noPaymentMethod")}</option>
              {metodosDisponibles.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro de Estado */}
          <div className="relative w-full md:w-auto min-w-[180px]">
            <Filter className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3 top-3" />
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value as PaymentStatusFilter)}
              className="w-full pl-9 pr-8 py-2 border border-[var(--color-border)] rounded-lg outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-[var(--color-surface-elevated)] font-medium text-[var(--color-text)] cursor-pointer appearance-none"
            >
              <option value="all">{translateRecordStatusFilter(t, "all")}</option>
              <option value="pending">{translateRecordStatusFilter(t, "pending")}</option>
              <option value="paid">{translateRecordStatusFilter(t, "paid")}</option>
              <option value="voided">{translateRecordStatusFilter(t, "voided")}</option>
            </select>
          </div>

          {/* Rango de Fechas */}
          <div className="flex items-center gap-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg pl-3 pr-4 py-2 w-full md:w-auto focus-within:ring-2 focus-within:ring-[var(--color-primary)] transition-shadow">
            <CalendarRange className="w-4 h-4 text-[var(--color-text-muted)]" />
            <div className="flex items-center gap-2 text-sm font-medium">
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="outline-none text-[var(--color-text)] bg-transparent cursor-pointer"
                title={t("common.dateFrom")}
              />
              <span className="text-[var(--color-border)]">|</span>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="outline-none text-[var(--color-text)] bg-transparent cursor-pointer"
                title={t("common.dateTo")}
              />
            </div>
            {(fechaDesde || fechaHasta) && (
              <button
                onClick={() => {
                  setFechaDesde("");
                  setFechaHasta("");
                }}
                className="ml-2 text-red-400 hover:text-[var(--color-danger)] font-bold text-xs"
                title={t("common.clearDates")}
                aria-label={t("common.clearDates")}
              >
                <X className="w-3 h-3" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* TABLA DE FACTURAS */}
      <div className="flex-1 overflow-y-auto rounded-xl border border-[var(--color-border)] shadow-sm">
        <table className="min-w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-[var(--color-surface)] uppercase tracking-wider text-[var(--color-text-muted)] text-xs font-bold sticky top-0 border-b border-[var(--color-border)] z-10">
            <tr>
              <th scope="col" className="px-6 py-4">{t("paymentHistory.columns.recordNumber")}</th>
              <th scope="col" className="px-6 py-4">{t("common.date")}</th>
              <th scope="col" className="px-6 py-4">{t("paymentHistory.columns.client")}</th>
              <th scope="col" className="px-6 py-4">{t("paymentHistory.columns.paymentMethod")}</th>
              <th scope="col" className="px-6 py-4 text-right">{t("common.amount")}</th>
              <th scope="col" className="px-6 py-4 text-center">{t("common.status")}</th>
              <th scope="col" className="px-6 py-4 text-right">{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-[var(--color-surface-elevated)]">
            {facturasFiltradas.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-[var(--color-text-muted)] text-base">
                  {t("paymentHistory.empty")}
                </td>
              </tr>
            ) : (
              facturasFiltradas.map((record) => {
                const esPagada = record.status === "paid";
                const esAnulada = record.status === "voided";
                const esPendiente = record.status === "pending";

                return (
                  <tr
                    key={record.recordId}
                    className={`hover:bg-[var(--color-info-surface)]/50 transition-colors ${esAnulada ? "opacity-60 bg-[var(--color-surface)]" : ""}`}
                  >
                    <td className="px-6 py-4 font-bold text-[var(--color-text)]">{record.recordId}</td>
                    <td className="px-6 py-4 text-[var(--color-text-muted)] font-medium">
                      {formatearFechaStr(record.issuedOn)}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-[var(--color-text)]">{record.payerName}</p>
                      <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{record.studentId}</p>
                    </td>
                    <td className="px-6 py-4 text-[var(--color-text-muted)] font-medium">
                      {record.paymentMethod || t("paymentHistory.noPaymentMethod")}
                    </td>
                    <td className="px-6 py-4 text-right font-black text-[var(--color-text)] text-base">
                      {fromMoney(record.total).toFixed(2)} €
                    </td>
                    <td className="px-6 py-4 text-center">
                      {esPagada && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-[var(--color-success-surface)] text-[var(--color-success)] border border-[var(--color-border)]">
                          <CheckCircle className="w-3 h-3 mr-1" />{" "}
                          {translateDomainStatus(t, "paid")}
                        </span>
                      )}
                      {esPendiente && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200">
                          <Clock className="w-3 h-3 mr-1" />{" "}
                          {translateDomainStatus(t, "pending")}
                        </span>
                      )}
                      {esAnulada && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] border border-[var(--color-border)]">
                          <Ban className="w-3 h-3 mr-1" /> {translateDomainStatus(t, "voided")}
                        </span>
                      )}
                      {esAnulada && record.voidedAt && (
                        <p className="text-[10px] text-[var(--color-text-muted)] mt-1">
                          {t("paymentHistory.voidedOn", {
                            date: formatearFechaStr(record.voidedAt.split("T")[0]),
                          })}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewRecord(record)}
                        className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-info-surface)] p-2 rounded-lg transition-colors cursor-pointer"
                        title={t("paymentHistory.previewPdf")}
                        aria-label={t("paymentHistory.previewPdf")}
                      >
                        <FileText className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => descargarPDF(record)}
                        className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-info-surface)] p-2 rounded-lg transition-colors cursor-pointer"
                        title={t("paymentHistory.downloadPdf")}
                        aria-label={t("paymentHistory.downloadPdf")}
                      >
                        <Download className="w-5 h-5" />
                      </button>

                      {esPendiente && (
                        <button
                          onClick={() => cambiarEstado(record.recordId, "paid")}
                          className="text-[var(--color-text-muted)] hover:text-[var(--color-success)] hover:bg-[var(--color-success-surface)] p-2 rounded-lg transition-colors cursor-pointer"
                          title={t("paymentHistory.markPaid")}
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                      )}

                      {esPagada && (
                        <button
                          onClick={() => cambiarEstado(record.recordId, "pending")}
                          className="text-[var(--color-text-muted)] hover:text-orange-600 hover:bg-orange-50 p-2 rounded-lg transition-colors cursor-pointer"
                          title={t("paymentHistory.markPending")}
                        >
                          <Clock className="w-5 h-5" />
                        </button>
                      )}

                      {!esAnulada && (
                        <button
                          onClick={() => anularFactura(record.recordId)}
                          className="text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-surface)] p-2 rounded-lg transition-colors cursor-pointer ml-2"
                          title={t("paymentHistory.voidRecord")}
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <PaymentRecordPreviewModal
        open={previewRecord != null}
        record={previewRecord}
        options={previewRecord ? pdfOptionsFor(previewRecord) : null}
        onClose={() => setPreviewRecord(null)}
      />
    </div>
  );
}
