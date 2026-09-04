import { describe, expect, it } from "vitest";
import {
  formatPaymentRecordId,
  nextPrefixedId,
  parsePaymentRecordSequence,
  parsePrefixedNumericId,
} from "./ids";

describe("parsePrefixedNumericId", () => {
  it("returns null for wrong prefix or non-numeric suffix", () => {
    expect(parsePrefixedNumericId("C001", "P")).toBeNull();
    expect(parsePrefixedNumericId("CXX", "C")).toBeNull();
  });

  it("parses numeric suffix after prefix", () => {
    expect(parsePrefixedNumericId("G012", "G")).toBe(12);
  });
});

describe("nextPrefixedId", () => {
  it("returns first id when list is empty", () => {
    expect(nextPrefixedId("C", 3, [])).toBe("C001");
  });

  it("uses max existing id + 1 after deletes", () => {
    expect(nextPrefixedId("C", 3, ["C001", "C003"])).toBe("C004");
  });
});

describe("payment record id parsing", () => {
  it("parses year sequence from record id", () => {
    expect(parsePaymentRecordSequence("F-2026-012", 2026)).toBe(12);
    expect(parsePaymentRecordSequence("F-2025-001", 2026)).toBeNull();
  });

  it("formats padded record ids", () => {
    expect(formatPaymentRecordId(2026, 7)).toBe("F-2026-007");
  });
});
