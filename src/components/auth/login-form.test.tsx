import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { replace, refresh } = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh }),
}));

import { LoginForm } from "./login-form";

describe("LoginForm", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    replace.mockReset();
    refresh.mockReset();
  });

  it("authenticates and navigates to the dashboard", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(Response.json({ authenticated: true }));
    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText("E-mail"), {
      target: { value: "vitoria@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Senha"), {
      target: { value: "secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard"));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/login",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("shows the safe error returned by the BFF", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json(
        { message: "E-mail ou senha incorretos." },
        { status: 401 },
      ),
    );
    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText("E-mail"), {
      target: { value: "vitoria@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Senha"), {
      target: { value: "wrong" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Entrar" }).closest("form")!);

    expect((await screen.findByRole("alert")).textContent).toContain(
      "E-mail ou senha incorretos.",
    );
    expect(replace).not.toHaveBeenCalled();
  });
});
