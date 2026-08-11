import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { replace, refresh } = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh }),
}));

import { LogoutButton } from "./logout-button";

describe("LogoutButton", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    replace.mockReset();
    refresh.mockReset();
  });

  it("ends the local session and returns to login", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(Response.json({ authenticated: false }));
    render(<LogoutButton />);

    fireEvent.click(screen.getByRole("button", { name: "Sair da conta" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/auth/logout", {
        method: "POST",
      });
      expect(replace).toHaveBeenCalledWith("/login");
      expect(refresh).toHaveBeenCalledOnce();
    });
  });
});
