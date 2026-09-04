import { beforeEach, describe, expect, it, vi } from "vitest";
import type Database from "@tauri-apps/plugin-sql";
import { toMoney } from "../../../domain/money";
import type { PaymentRecord } from "../../../domain/payment-record";
import type { Student } from "../../../domain/student";
import { createEmptyPersistedState } from "../mockAppState";
import { createNodeSqliteAdapter, openMigratedMemoryDb } from "../test/nodeSqliteAdapter";
import { paymentRecordRepository } from "./paymentRecordRepository";
import { settingsRepository, type AppSettingsSnapshot } from "./settingsRepository";
import { studentRepository } from "./studentRepository";

const { dbHolder } = vi.hoisted(() => ({
  dbHolder: { client: null as Database | null },
}));

vi.mock("../database", () => ({
  getDatabase: async () => {
    if (!dbHolder.client) {
      throw new Error("Test database was not initialized.");
    }
    return dbHolder.client;
  },
}));

function sampleStudent(overrides: Partial<Student> = {}): Student {
  return {
    studentId: "C001",
    guardianFirstName: "Ana",
    guardianLastName: "Lopez",
    enrolledAt: "2026-01-15",
    status: "active",
    ...overrides,
  };
}

function sampleRecord(overrides: Partial<PaymentRecord> = {}): PaymentRecord {
  return {
    recordId: "F-2026-001",
    issuedOn: "2026-02-01",
    studentId: "C001",
    payerName: "Ana Lopez",
    lineItems: [{ description: "Fee", quantity: 1, unitPrice: toMoney(40) }],
    total: toMoney(40),
    status: "pending",
    billingPeriod: "2026-02",
    groupIds: ["G001"],
    ...overrides,
  };
}

function sampleSettings(overrides: Partial<AppSettingsSnapshot> = {}): AppSettingsSnapshot {
  const empty = createEmptyPersistedState();
  return {
    branding: {
      appName: empty.appName,
      appSubtitle: empty.appSubtitle,
      onboardingCompleted: empty.onboardingCompleted,
    },
    organization: empty.organization,
    tax: {
      taxMode: empty.taxMode,
      defaultVatRate: empty.defaultVatRate,
      defaultIncomeTaxReserveRate: empty.defaultIncomeTaxReserveRate,
      currencySymbol: empty.currencySymbol,
    },
    appearance: {
      brandColor: empty.brandColor,
      logoPath: empty.logoPath,
      fontSize: empty.fontSize,
      fontPreset: empty.fontPreset,
      colorScheme: empty.colorScheme,
      taxIdSeparator: empty.taxIdSeparator,
    },
    fixedCosts: empty.fixedCosts,
    backup: {
      autoBackupEnabled: empty.autoBackupEnabled,
      autoBackupFolderPath: empty.autoBackupFolderPath,
      lastAutoBackupAt: empty.lastAutoBackupAt,
    },
    ...overrides,
  };
}

describe("studentRepository", () => {
  beforeEach(() => {
    dbHolder.client = createNodeSqliteAdapter(openMigratedMemoryDb());
  });

  it("round-trips created students", async () => {
    const student = sampleStudent({ studentName: "Lucia" });
    await studentRepository.replaceAll([student]);
    await expect(studentRepository.list()).resolves.toEqual([student]);
  });

  it("reads an empty list when no students exist", async () => {
    await expect(studentRepository.list()).resolves.toEqual([]);
  });

  it("updates and deletes through replaceAll", async () => {
    await studentRepository.replaceAll([sampleStudent()]);
    await studentRepository.replaceAll([
      sampleStudent({ guardianLastName: "Garcia", status: "inactive" }),
    ]);
    expect(await studentRepository.list()).toEqual([
      sampleStudent({ guardianLastName: "Garcia", status: "inactive" }),
    ]);

    await studentRepository.replaceAll([]);
    await expect(studentRepository.list()).resolves.toEqual([]);
  });
});

describe("paymentRecordRepository", () => {
  beforeEach(async () => {
    dbHolder.client = createNodeSqliteAdapter(openMigratedMemoryDb());
    await studentRepository.replaceAll([sampleStudent()]);
  });

  it("round-trips records with line items and cent totals", async () => {
    const record = sampleRecord();
    await paymentRecordRepository.replaceAll([record]);
    await expect(paymentRecordRepository.list()).resolves.toEqual([record]);
  });

  it("updates status on replaceAll", async () => {
    await paymentRecordRepository.replaceAll([sampleRecord()]);
    await paymentRecordRepository.replaceAll([sampleRecord({ status: "paid" })]);
    expect((await paymentRecordRepository.list())[0]?.status).toBe("paid");
  });

  it("rolls back a failed batch replace", async () => {
    const inner = dbHolder.client;
    if (!inner) throw new Error("Test database was not initialized.");

    let paymentInserts = 0;
    dbHolder.client = {
      select: inner.select.bind(inner),
      execute: async (query: string, bindValues?: unknown[]) => {
        if (query.includes("INSERT INTO payment_records")) {
          paymentInserts += 1;
          if (paymentInserts > 1) {
            throw new Error("forced failure");
          }
        }
        return inner.execute(query, bindValues);
      },
    } as Database;

    await expect(
      paymentRecordRepository.replaceAll([
        sampleRecord({ recordId: "F-2026-001" }),
        sampleRecord({ recordId: "F-2026-002" }),
      ]),
    ).rejects.toThrow("forced failure");

    dbHolder.client = inner;
    await expect(paymentRecordRepository.list()).resolves.toEqual([]);
  });
});

describe("settingsRepository", () => {
  beforeEach(() => {
    dbHolder.client = createNodeSqliteAdapter(openMigratedMemoryDb());
  });

  it("returns defaults when no sections are stored", async () => {
    const defaults = sampleSettings();
    await expect(settingsRepository.load(defaults)).resolves.toMatchObject({
      branding: defaults.branding,
      tax: defaults.tax,
    });
  });

  it("round-trips saved settings", async () => {
    const snapshot = sampleSettings({
      branding: {
        appName: "Academia Norte",
        appSubtitle: "Cobros",
        onboardingCompleted: true,
      },
    });
    await settingsRepository.save(snapshot);
    await expect(settingsRepository.load(sampleSettings())).resolves.toMatchObject({
      branding: snapshot.branding,
      organization: snapshot.organization,
    });
  });

  it("updates an existing settings section", async () => {
    await settingsRepository.save(sampleSettings());
    await settingsRepository.save(
      sampleSettings({
        tax: {
          taxMode: "custom",
          defaultVatRate: 21,
          defaultIncomeTaxReserveRate: 15,
          currencySymbol: "€",
        },
      }),
    );
    const loaded = await settingsRepository.load(sampleSettings());
    expect(loaded.tax.taxMode).toBe("custom");
    expect(loaded.tax.defaultVatRate).toBe(21);
  });
});
