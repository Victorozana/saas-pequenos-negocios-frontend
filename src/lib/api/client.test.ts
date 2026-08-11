import { describe, expect, it } from "vitest";

import { normalizeApiBaseUrl } from "./client";

describe("normalizeApiBaseUrl", () => {
  it("normalizes a valid HTTP API address", () => {
    expect(normalizeApiBaseUrl(" http://localhost:5050/ ")).toBe(
      "http://localhost:5050",
    );
  });

  it("rejects an empty API address", () => {
    expect(() => normalizeApiBaseUrl("   ")).toThrow(
      "API base URL is required",
    );
  });

  it("rejects protocols that cannot call the HTTP API", () => {
    expect(() => normalizeApiBaseUrl("file:///tmp/openapi.json")).toThrow(
      "API base URL must use HTTP or HTTPS",
    );
  });
});
