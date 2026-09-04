import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { I18nProvider } from "../../app/providers/I18nProvider";
import { Modal } from "./Modal";

describe("Modal focus trap", () => {
  it("moves focus into the dialog when opened", () => {
    render(
      <I18nProvider>
        <button type="button">Outside</button>
        <Modal open onClose={() => undefined} title="Detalles">
          <input aria-label="Campo" />
        </Modal>
      </I18nProvider>,
    );

    expect(screen.getByRole("dialog")).toHaveFocus();
  });

  it("cycles Tab from the last control back to the first", async () => {
    const user = userEvent.setup();
    render(
      <I18nProvider>
        <Modal open onClose={() => undefined} title="Detalles">
          <button type="button">Primero</button>
          <button type="button">Segundo</button>
        </Modal>
      </I18nProvider>,
    );

    const dialog = screen.getByRole("dialog");
    const closeButton = within(dialog).getByRole("button", { name: "Cerrar" });
    const first = screen.getByRole("button", { name: "Primero" });
    const second = screen.getByRole("button", { name: "Segundo" });

    second.focus();
    await user.tab();
    expect(closeButton).toHaveFocus();

    closeButton.focus();
    await user.tab({ shift: true });
    expect(second).toHaveFocus();

    first.focus();
    await user.tab({ shift: true });
    expect(closeButton).toHaveFocus();
  });

  it("calls onClose when Escape is pressed", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <I18nProvider>
        <Modal open onClose={onClose} title="Detalles">
          contenido
        </Modal>
      </I18nProvider>,
    );

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
