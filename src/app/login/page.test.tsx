import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }) }));

import LoginPage from "./page";

describe("LoginPage", () => {
  afterEach(cleanup);

  it("links people without an account to registration", () => {
    render(<LoginPage />);
    expect(screen.getByRole("link", { name: "Cadastre seu negócio" }).getAttribute("href")).toBe("/cadastro");
  });

  it("does not link to unavailable public modules", () => {
    render(<LoginPage />);
    expect(screen.getAllByRole("link").map((link) => link.getAttribute("href"))).toEqual(["/cadastro"]);
  });
});
