import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { proxy } from "./proxy";

describe("dashboard proxy", () => {
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
