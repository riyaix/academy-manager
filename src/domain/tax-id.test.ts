import { describe, expect, it } from "vitest";
import { formatDniNumbers, formatTaxIdentifier } from "./tax-id";

describe("formatTaxIdentifier", () => {
  it("formats NIF numbers with trailing letter", () => {
    expect(formatTaxIdentifier("12345678z")).toBe("12.345.678-Z");
  });

  it("formats NIE starting with letter", () => {
    expect(formatTaxIdentifier("x1234567l")).toBe("X-1.234.567L");
  });
});

describe("formatDniNumbers", () => {
  it("groups digits with custom separator", () => {
    expect(formatDniNumbers("12345678", "-")).toBe("12-345-678");
  });
});
