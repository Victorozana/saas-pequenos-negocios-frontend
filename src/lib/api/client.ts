import createClient from "openapi-fetch";

import type { paths } from "./generated/schema";

export function normalizeApiBaseUrl(value: string): string {
  const candidate = value.trim();

  if (!candidate) {
    throw new Error("API base URL is required");
  }

  const url = new URL(candidate);

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("API base URL must use HTTP or HTTPS");
  }

  return url.toString().replace(/\/$/, "");
}

export function createApiClient(baseUrl: string) {
  return createClient<paths>({ baseUrl: normalizeApiBaseUrl(baseUrl) });
}
