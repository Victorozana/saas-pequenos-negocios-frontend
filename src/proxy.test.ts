import { NextRequest } from "next/server";
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { describe, expect, it } from "vitest";

import { config, proxy } from "./proxy";

describe("dashboard proxy", () => {
  it.each([
    "/dashboard", "/dashboard/agenda", "/clientes", "/clientes/123",
    "/servicos", "/servicos/novo", "/orcamentos", "/orcamentos/123/editar",
    "/agenda", "/agenda/semana",
  ])("matches the protected operational path %s", (pathname) => {
    expect(unstable_doesMiddlewareMatch({ config, url: `https://app.example.com${pathname}` })).toBe(true);
  });

  it.each(["/", "/login", "/cadastro", "/api/company-registry/123"])("does not match public path %s", (pathname) => {
    expect(unstable_doesMiddlewareMatch({ config, url: `https://app.example.com${pathname}` })).toBe(false);
  });

  it("redirects anonymous requests to login and preserves the destination", () => {
    const request = new NextRequest("https://app.example.com/dashboard/agenda");

    const response = proxy(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://app.example.com/login?next=%2Fdashboard%2Fagenda",
    );
  });

  it("allows the request when a session cookie exists", () => {
    const request = new NextRequest("https://app.example.com/dashboard", {
      headers: { cookie: "agendamento_session=private-token" },
    });

    const response = proxy(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });
});
