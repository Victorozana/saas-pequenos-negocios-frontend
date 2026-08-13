import { describe, expect, it, vi } from "vitest";

import { POST } from "./route";

describe("email verification BFF", () => {
  it("forwards the token only in the POST JSON body and preserves 204", async () => {
    const fetcher = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 204 }));
    const response = await POST(new Request("http://test/api/auth/email-verifications", { method: "POST", body: JSON.stringify({ token: "verification-token" }) }));
    const [upstreamInput, upstreamInit] = fetcher.mock.calls[0];
    const upstreamUrl = new URL(String(upstreamInput));

    expect(response.status).toBe(204);
    expect(upstreamUrl.href).toBe("http://localhost:5050/api/v1/auth/email-verifications");
    expect(upstreamUrl.pathname).not.toContain("verification-token");
    expect(upstreamUrl.search).not.toContain("verification-token");
    expect(upstreamUrl.hash).not.toContain("verification-token");
    expect(upstreamInit).toEqual(expect.objectContaining({ method: "POST", body: JSON.stringify({ token: "verification-token" }) }));
  });

  it.each([
    [400, { title: "Token inválido" }, "Token inválido"],
    [500, { title: "database connection leaked" }, "O serviço está temporariamente indisponível. Tente novamente."],
  ])("preserves upstream HTTP %i as a safe confirmation failure", async (status, problem, message) => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json(problem, { status }));

    const response = await POST(new Request("http://test/api/auth/email-verifications", { method: "POST", body: JSON.stringify({ token: "verification-token" }) }));

    expect(response.status).toBe(status);
    await expect(response.json()).resolves.toEqual({ message });
  });

  it("returns a safe error when confirmation is unavailable", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network"));
    const response = await POST(new Request("http://test/api/auth/email-verifications", { method: "POST", body: JSON.stringify({ token: "verification-token" }) }));
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ message: "O serviço está temporariamente indisponível. Tente novamente." });
  });
});
