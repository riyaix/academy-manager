import { describe, expect, it } from "vitest";
import { parseCourseFee } from "./course-fee";

describe("parseCourseFee", () => {
  it("parses decimal strings with comma or dot", () => {
    expect(parseCourseFee("45,50")).toBe(45.5);
    expect(parseCourseFee("45.50")).toBe(45.5);
  });

  it("rejects empty or non-positive values", () => {
    expect(parseCourseFee("")).toBeNull();
    expect(parseCourseFee("0")).toBeNull();
    expect(parseCourseFee("abc")).toBeNull();
  });
});
