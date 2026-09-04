import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useShallow } from "zustand/react/shallow";
import { useAppStore } from "../../app/store/appStore";
import { summarizeMonthlyIncome } from "../../domain/income-summary";
import { fromMoney } from "../../domain/money";
import {
  overdueAgingBuckets,
  summarizePaymentStatusBreakdown,
  topStudentsByRevenue,
} from "../../domain/reports";

const PIE_COLORS = [
  "var(--color-success)",
  "var(--color-warning)",
  "var(--color-danger)",
];

export function ReportsPage() {
  const { t, i18n } = useTranslation();
  const { paymentRecords, currencySymbol } = useAppStore(
    useShallow((state) => ({
      paymentRecords: state.paymentRecords,
      currencySymbol: state.currencySymbol,
    })),
  );

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const range = useMemo(
    () => ({
      from: from || undefined,
      to: to || undefined,
    }),
    [from, to],
  );

  const monthly = useMemo(
    () =>
      summarizeMonthlyIncome(paymentRecords, range).map((row) => ({
        month: row.monthKey,
        collected: fromMoney(row.collected),
        pending: fromMoney(row.pending),
      })),
    [paymentRecords, range],
  );

  const statusBreakdown = useMemo(() => {
    const breakdown = summarizePaymentStatusBreakdown(paymentRecords, range);
    return [
      { name: t("status.paid"), value: fromMoney(breakdown.paid), key: "paid" },
      { name: t("status.pending"), value: fromMoney(breakdown.pending), key: "pending" },
      { name: t("status.voided"), value: fromMoney(breakdown.voided), key: "voided" },
    ].filter((item) => item.value > 0);
  }, [paymentRecords, range, t]);

  const topStudents = useMemo(
    () =>
      topStudentsByRevenue(paymentRecords, 5, range).map((row) => ({
        name: row.payerName,
        total: fromMoney(row.total),
      })),
    [paymentRecords, range],
  );

  const aging = useMemo(
    () =>
      overdueAgingBuckets(paymentRecords).map((bucket) => ({
        bucket: t(`reports.aging.${bucket.bucket}`),
        count: bucket.count,
        total: fromMoney(bucket.total),
      })),
    [paymentRecords, t],
  );

  const locale = i18n.language.startsWith("en") ? "en" : "es";
  const moneyLabel = (value: number) =>
    `${value.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currencySymbol}`;

  return (
    <div className="bg-[var(--color-surface-elevated)] w-full p-6 md:p-8 rounded-xl shadow-sm border border-[var(--color-border)] flex flex-col min-h-[85vh] gap-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--color-border)] pb-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)] mb-1">{t("reports.title")}</h1>
          <p className="text-sm text-[var(--color-text-muted)]">{t("reports.subtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm text-[var(--color-text-muted)]">
            {t("reports.from")}
            <input
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              className="mt-1 block rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2"
            />
          </label>
          <label className="text-sm text-[var(--color-text-muted)]">
            {t("reports.to")}
            <input
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              className="mt-1 block rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2"
            />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="rounded-xl border border-[var(--color-border)] p-4">
          <h2 className="font-bold text-[var(--color-text)] mb-4">{t("reports.monthlyTitle")}</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" tick={{ fill: "var(--color-text-muted)", fontSize: 12 }} />
                <YAxis tick={{ fill: "var(--color-text-muted)", fontSize: 12 }} />
                <Tooltip formatter={(value) => moneyLabel(Number(value))} />
                <Legend />
                <Bar dataKey="collected" name={t("status.paid")} fill="var(--color-success)" />
                <Bar dataKey="pending" name={t("status.pending")} fill="var(--color-warning)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-xl border border-[var(--color-border)] p-4">
          <h2 className="font-bold text-[var(--color-text)] mb-4">{t("reports.statusTitle")}</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusBreakdown} dataKey="value" nameKey="name" outerRadius={100} label>
                  {statusBreakdown.map((entry, index) => (
                    <Cell key={entry.key} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => moneyLabel(Number(value))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-xl border border-[var(--color-border)] p-4">
          <h2 className="font-bold text-[var(--color-text)] mb-4">{t("reports.topStudentsTitle")}</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topStudents} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis type="number" tick={{ fill: "var(--color-text-muted)", fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  tick={{ fill: "var(--color-text-muted)", fontSize: 12 }}
                />
                <Tooltip formatter={(value) => moneyLabel(Number(value))} />
                <Bar dataKey="total" name={t("reports.revenue")} fill="var(--color-primary)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-xl border border-[var(--color-border)] p-4">
          <h2 className="font-bold text-[var(--color-text)] mb-4">{t("reports.agingTitle")}</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={aging}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="bucket" tick={{ fill: "var(--color-text-muted)", fontSize: 12 }} />
                <YAxis tick={{ fill: "var(--color-text-muted)", fontSize: 12 }} />
                <Tooltip formatter={(value) => moneyLabel(Number(value))} />
                <Bar dataKey="total" name={t("reports.overdue")} fill="var(--color-danger)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </div>
  );
}
