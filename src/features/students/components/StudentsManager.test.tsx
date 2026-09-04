import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { I18nProvider } from "../../../app/providers/I18nProvider";
import { useAppStore } from "../../../app/store/appStore";
import { ConfirmDialogProvider } from "../../../core/components/ConfirmDialog";
import { ToastProvider } from "../../../core/components/Toast";
import { StudentsManager } from "./StudentsManager";

function renderStudentForm() {
  return render(
    <I18nProvider>
      <ToastProvider>
        <ConfirmDialogProvider>
          <StudentsManager openNewForm />
        </ConfirmDialogProvider>
      </ToastProvider>
    </I18nProvider>,
  );
}

describe("StudentsManager form validation", () => {
  beforeEach(() => {
    useAppStore.setState({ students: [] });
  });

  it("warns when first and last name are missing", async () => {
    const user = userEvent.setup();
    renderStudentForm();

    await user.click(screen.getByRole("button", { name: "Guardar Cliente" }));

    expect(
      screen.getByText("Por favor, rellena al menos el nombre y apellidos."),
    ).toBeInTheDocument();
    expect(useAppStore.getState().students).toHaveLength(0);
  });

  it("saves a student when required names are provided", async () => {
    const user = userEvent.setup();
    renderStudentForm();

    const firstName = document.querySelector('input[name="guardianFirstName"]');
    const lastName = document.querySelector('input[name="guardianLastName"]');
    if (!(firstName instanceof HTMLInputElement) || !(lastName instanceof HTMLInputElement)) {
      throw new Error("Name fields were not found.");
    }

    await user.type(firstName, "Ana");
    await user.type(lastName, "Lopez");
    await user.click(screen.getByRole("button", { name: "Guardar Cliente" }));

    expect(useAppStore.getState().students).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          guardianFirstName: "Ana",
          guardianLastName: "Lopez",
        }),
      ]),
    );
  });
});
