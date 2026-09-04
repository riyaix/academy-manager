import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { OrganizationSettings } from "../../domain/settings";
import type { PaymentRecord } from "../../domain/payment-record";
import type { Student } from "../../domain/student";
import { fromMoney } from "../../domain/money";
import { calculateTaxBreakdown } from "../../domain/billing";

export type PaymentRecordPdfLabels = {
  documentTitle: string;
  recordNumber: string;
  issuedOn: string;
  billedTo: string;
  taxId: string;
  address: string;
  phone: string;
  description: string;
  quantity: string;
  unitPrice: string;
  lineTotal: string;
  subtotal: string;
  vat: string;
  totalDue: string;
  reserveHint: string;
  statusPaid: string;
  statusVoided: string;
  internalNote: string;
};

export type PaymentRecordPdfOptions = {
  organization: OrganizationSettings;
  student?: Student;
  taxMode: string;
  vatRate: number;
  incomeTaxReserveRate: number;
  currencySymbol: string;
  brandColor: string;
  logoDataUrl: string | null;
  labels: PaymentRecordPdfLabels;
};

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 37, g: 99, b: 235 };
}

function formatDate(isoDate: string): string {
  if (!isoDate) return "";
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

function formatOrganizationAddress(organization: OrganizationSettings): string {
  const street = [organization.streetType, organization.streetName, organization.streetNumber]
    .filter(Boolean)
    .join(" ");
  const locality = [organization.postalCode, organization.city, organization.province]
    .filter(Boolean)
    .join(" ");
  return [street, organization.unit, locality].filter(Boolean).join(", ");
}

export function getPaymentRecordPdfLabels(locale: "es" | "en"): PaymentRecordPdfLabels {
  if (locale === "en") {
    return {
      documentTitle: "PAYMENT RECEIPT",
      recordNumber: "No.",
      issuedOn: "Date",
      billedTo: "Billed to",
      taxId: "Tax ID",
      address: "Address",
      phone: "Phone",
      description: "Description",
      quantity: "Qty.",
      unitPrice: "Unit price",
      lineTotal: "Total",
      subtotal: "Subtotal",
      vat: "VAT",
      totalDue: "TOTAL DUE",
      reserveHint: "Suggested income-tax reserve",
      statusPaid: "PAID",
      statusVoided: "VOIDED",
      internalNote: "Internal payment record — not a legal tax invoice.",
    };
  }

  return {
    documentTitle: "RECIBO DE COBRO",
    recordNumber: "Nº",
    issuedOn: "Fecha",
    billedTo: "Cobrado a",
    taxId: "DNI/NIE",
    address: "Dirección",
    phone: "Teléfono",
    description: "Descripción / Concepto",
    quantity: "Cant.",
    unitPrice: "Precio unitario",
    lineTotal: "Total",
    subtotal: "Base imponible (nota)",
    vat: "IVA (nota)",
    totalDue: "TOTAL A COBRAR",
    reserveHint: "Reserva IRPF sugerida (nota)",
    statusPaid: "COBRADO",
    statusVoided: "ANULADO",
    internalNote: "Registro interno de cobro — no es factura legal.",
  };
}

export function generatePaymentRecordPdf(
  record: PaymentRecord,
  options: PaymentRecordPdfOptions,
): jsPDF {
  const doc = new jsPDF();
  const rgbColor = hexToRgb(options.brandColor || "#2563eb");
  const student = options.student;
  const labels = options.labels;
  const tax = calculateTaxBreakdown(
    record.total,
    options.taxMode,
    options.vatRate,
    options.incomeTaxReserveRate,
  );

  doc.setFillColor(rgbColor.r, rgbColor.g, rgbColor.b);
  doc.rect(0, 0, 210, 48, "F");

  if (options.logoDataUrl) {
    try {
      doc.addImage(options.logoDataUrl, "PNG", 14, 6, 28, 28);
    } catch {
      // Logo format may be unsupported — continue without it.
    }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(options.organization.legalName || "Academia", options.logoDataUrl ? 48 : 14, 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const orgAddress = formatOrganizationAddress(options.organization);
  if (options.organization.taxId) {
    doc.text(options.organization.taxId, options.logoDataUrl ? 48 : 14, 20);
  }
  if (orgAddress) doc.text(orgAddress, options.logoDataUrl ? 48 : 14, 26, { maxWidth: 95 });
  if (options.organization.phone) {
    doc.text(options.organization.phone, options.logoDataUrl ? 48 : 14, 32);
  }

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(labels.documentTitle, 14, 42);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`${labels.recordNumber}: ${record.recordId}`, 150, 34);
  doc.text(`${labels.issuedOn}: ${formatDate(record.issuedOn)}`, 150, 42);

  doc.setTextColor(50, 50, 50);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(labels.billedTo, 14, 60);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  let payerY = 67;
  doc.text(record.payerName, 14, payerY);
  payerY += 6;
  if (student?.guardianTaxId) {
    doc.text(`${labels.taxId}: ${student.guardianTaxId}`, 14, payerY);
    payerY += 6;
  }
  if (student?.formattedAddress) {
    doc.text(`${labels.address}: ${student.formattedAddress}`, 14, payerY);
    payerY += 6;
  }
  if (student?.phone) {
    doc.text(`${labels.phone}: ${student.phone}`, 14, payerY);
  }

  const tableData = record.lineItems.map((line) => [
    line.description,
    line.quantity.toString(),
    `${fromMoney(line.unitPrice).toFixed(2)} ${options.currencySymbol}`,
    `${(fromMoney(line.unitPrice) * line.quantity).toFixed(2)} ${options.currencySymbol}`,
  ]);

  autoTable(doc, {
    startY: 95,
    head: [[labels.description, labels.quantity, labels.unitPrice, labels.lineTotal]],
    body: tableData,
    theme: "grid",
    headStyles: { fillColor: [rgbColor.r, rgbColor.g, rgbColor.b], textColor: 255 },
    styles: { fontSize: 10, cellPadding: 5 },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { cellWidth: 20, halign: "center" },
      2: { cellWidth: 35, halign: "right" },
      3: { cellWidth: 35, halign: "right" },
    },
  });

  const docWithTable = doc as jsPDF & { lastAutoTable: { finalY: number } };
  let finalY = docWithTable.lastAutoTable.finalY + 10;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text(
    `${labels.subtotal}: ${fromMoney(tax.subtotal).toFixed(2)} ${options.currencySymbol}`,
    120,
    finalY,
  );
  finalY += 6;
  if (tax.vatRate > 0) {
    doc.text(
      `${labels.vat} (${tax.vatRate}%): ${fromMoney(tax.vatAmount).toFixed(2)} ${options.currencySymbol}`,
      120,
      finalY,
    );
    finalY += 6;
  }
  doc.text(
    `${labels.reserveHint} (${tax.incomeTaxReserveRate}%): ${fromMoney(tax.incomeTaxReserveAmount).toFixed(2)} ${options.currencySymbol}`,
    120,
    finalY,
  );

  finalY += 12;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(50, 50, 50);
  doc.text(labels.totalDue, 120, finalY);
  doc.setFontSize(16);
  doc.setTextColor(rgbColor.r, rgbColor.g, rgbColor.b);
  doc.text(`${fromMoney(record.total).toFixed(2)} ${options.currencySymbol}`, 165, finalY);

  if (record.status === "paid") {
    doc.setTextColor(22, 163, 74);
    doc.setFontSize(20);
    doc.text(labels.statusPaid, 14, finalY);
  } else if (record.status === "voided") {
    doc.setTextColor(220, 38, 38);
    doc.setFontSize(20);
    doc.text(labels.statusVoided, 14, finalY);
  }

  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(labels.internalNote, 14, 285);

  return doc;
}

export function downloadPaymentRecordPdf(
  record: PaymentRecord,
  options: PaymentRecordPdfOptions,
): void {
  const doc = generatePaymentRecordPdf(record, options);
  doc.save(`${record.recordId}_${record.payerName.replace(/\s+/g, "_")}.pdf`);
}
