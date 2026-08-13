import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { replace, refresh } = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh }),
}));

import { AgendaToday } from "./agenda-today";

describe("AgendaToday", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    replace.mockReset();
    refresh.mockReset();
  });

  it("shows the agenda returned by the BFF", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({
        appointments: [
          {
            id: "appointment-1",
            type: "OnSite",
            startTime: "2026-08-12T13:00:00.000Z",
            endTime: "2026-08-12T14:00:00.000Z",
            address: "Rua das Flores, 10",
          },
        ],
      }),
    );

    render(<AgendaToday />);

    expect(screen.getByText("Carregando agenda…")).toBeTruthy();
    expect(await screen.findByText("OnSite")).toBeTruthy();
    expect(screen.getByText("Rua das Flores, 10")).toBeTruthy();
  });

  it("shows the no-appointments CTA without a new route", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ appointments: [] }),
    );

    render(<AgendaToday />);

    expect(await screen.findByText("Nenhum agendamento para hoje")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Criar primeiro agendamento" }),
    ).toHaveProperty("disabled", true);
    expect(
      screen.queryByRole("link", { name: "Criar primeiro agendamento" }),
    ).toBeNull();
  });

  it("shows a safe error after a BFF or network failure", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network details"));

    render(<AgendaToday />);

    expect(
      await screen.findByText("Não foi possível carregar sua agenda agora. Tente novamente."),
    ).toBeTruthy();
    expect(screen.queryByText("network details")).toBeNull();
  });

  it("redirects to login when the BFF reports an expired session", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json(
        { message: "Sua sessão expirou. Entre novamente." },
        { status: 401 },
      ),
    );

    render(<AgendaToday />);

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/login");
      expect(refresh).toHaveBeenCalledOnce();
    });
  });
});
