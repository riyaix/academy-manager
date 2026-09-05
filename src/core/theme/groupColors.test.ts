import { describe, expect, it } from "vitest";
import { GROUP_COLOR_PALETTE, isHexColor, resolveGroupColorClass } from "./groupColors";

describe("groupColors", () => {
  it("maps legacy Tailwind classes to semantic tokens", () => {
    expect(resolveGroupColorClass("bg-blue-500")).toBe(GROUP_COLOR_PALETTE[0]);
    expect(resolveGroupColorClass("bg-emerald-500")).toBe(GROUP_COLOR_PALETTE[1]);
    expect(resolveGroupColorClass("bg-violet-500")).toBe(GROUP_COLOR_PALETTE[4]);
  });

  it("repairs broken info-surface rewrite leftovers", () => {
    expect(resolveGroupColorClass("bg-[var(--color-info-surface)]0")).toBe(GROUP_COLOR_PALETTE[0]);
  });

  it("keeps existing palette classes", () => {
    expect(resolveGroupColorClass(GROUP_COLOR_PALETTE[3])).toBe(GROUP_COLOR_PALETTE[3]);
  });

  it("detects hex colors", () => {
    expect(isHexColor("#0f766e")).toBe(true);
    expect(isHexColor("bg-blue-500")).toBe(false);
  });
});
