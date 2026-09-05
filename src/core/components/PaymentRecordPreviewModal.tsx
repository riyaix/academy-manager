import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "./Modal";
import { Button } from "./Button";
import {
  generatePaymentRecordPdf,
  getPaymentRecordPdfLabels,
  type PaymentRecordPdfOptions,
} from "../pdf/generatePaymentRecordPdf";
import type { PaymentRecord } from "../../domain/payment-record";

type PaymentRecordPreviewModalProps = {
  open: boolean;
  record: PaymentRecord | null;
  options: Omit<PaymentRecordPdfOptions, "labels"> | null;
  onClose: () => void;
};

export function PaymentRecordPreviewModal({
  open,
  record,
  options,
  onClose,
}: PaymentRecordPreviewModalProps) {
  const { t, i18n } = useTranslation();
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  const locale = i18n.language.startsWith("en") ? "en" : "es";

  useEffect(() => {
    if (!open || !record || !options) {
      setObjectUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return null;
      });
      return;
    }

    const doc = generatePaymentRecordPdf(record, {
      ...options,
      labels: getPaymentRecordPdfLabels(locale),
    });
    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    setObjectUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return url;
    });

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [open, record, options, locale]);

  const title = useMemo(
    () =>
      record
        ? t("paymentHistory.previewTitle", { id: record.recordId })
        : t("paymentHistory.previewTitleFallback"),
    [record, t],
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="xl"
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("common.close")}
          </Button>
          {objectUrl ? (
            <Button
              type="button"
              onClick={() => {
                if (!record || !options) return;
                const doc = generatePaymentRecordPdf(record, {
                  ...options,
                  labels: getPaymentRecordPdfLabels(locale),
                });
                doc.save(`${record.recordId}_${record.payerName.replace(/\s+/g, "_")}.pdf`);
              }}
            >
              {t("paymentHistory.downloadPdf")}
            </Button>
          ) : null}
        </div>
      }
    >
      {objectUrl ? (
        <iframe
          title={title}
          src={objectUrl}
          className="h-[70vh] w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]"
        />
      ) : (
        <p className="text-sm text-[var(--color-text-muted)]">
          {t("paymentHistory.previewLoading")}
        </p>
      )}
    </Modal>
  );
}
