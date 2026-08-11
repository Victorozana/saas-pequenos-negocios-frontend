import { describe, expect, it } from "vitest";

import { POST } from "./route";

describe("logout BFF route", () => {
  it("expires the local session cookie", async () => {
    const response = await POST();
    const cookie = response.headers.get("set-cookie");

    expect(response.status).toBe(200);
    expect(cookie).toContain("agendamento_session=");
    expect(cookie).toContain("Max-Age=0");
    expect(cookie).toContain("HttpOnly");
  });
});

