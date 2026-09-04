import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { I18nProvider } from "../../../app/providers/I18nProvider";
import { DuplicateBatchWarning } from "./DuplicateBatchWarning";

describe("DuplicateBatchWarning", () => {
  it("does not render when there are no conflicts", () => {
    const { container } = render(
      <I18nProvider>
        <DuplicateBatchWarning conflicts={[]} />
      </I18nProvider>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the duplicate billing warning with each conflict", () => {
    render(
      <I18nProvider>
        <DuplicateBatchWarning
          conflicts={[
            {
              recordId: "F-2026-001",
              payerName: "Ana Lopez",
              billingPeriod: "2026-02",
              groupIds: ["G001"],
            },
          ]}
        />
      </I18nProvider>,
    );

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Cobros duplicados detectados");
    expect(alert).toHaveTextContent("F-2026-001");
    expect(alert).toHaveTextContent("Ana Lopez");
  });
});
