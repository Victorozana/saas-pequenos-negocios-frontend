import { describe, expect, it, vi } from "vitest";

import { POST } from "./route";

describe("email verification BFF", () => {
  it("forwards the token only in the POST JSON body and preserves 204", async () => {
    const fetcher = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 204 }));
    const response = await POST(new Request("http://test/api/auth/email-verifications", { method: "POST", body: JSON.stringify({ token: "verification-token" }) }));
    expect(response.status).toBe(204);
    expect(fetcher).toHaveBeenCalledWith(expect.stringContaining("/api/v1/auth/email-verifications"), expect.objectContaining({ method: "POST", body: JSON.stringify({ token: "verification-token" }) }));
  });

  it("returns a safe error when confirmation is unavailable", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network"));
    const response = await POST(new Request("http://test/api/auth/email-verifications", { method: "POST", body: JSON.stringify({ token: "verification-token" }) }));
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ message: "O serviço está temporariamente indisponível. Tente novamente." });
  });
});
