import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }) }));

import LoginPage from "./page";

describe("LoginPage", () => {
  it("links people without an account to registration", () => {
    render(<LoginPage />);
    expect(screen.getByRole("link", { name: "Cadastre seu negócio" }).getAttribute("href")).toBe("/cadastro");
  });
});
