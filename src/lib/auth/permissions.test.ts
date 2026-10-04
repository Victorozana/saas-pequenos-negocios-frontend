import { describe, expect, it } from "vitest";

import { MODULES, canAccessModule, hasPermission } from "./permissions";

const permissions = ["customers.read", "appointments.read"];

describe("permission helpers", () => {
  it("uses explicit permissions instead of inferring access from a role", () => {
    expect(hasPermission(permissions, "customers.read")).toBe(true);
    expect(hasPermission(permissions, "financial.read")).toBe(false);
  });

  it("keeps unavailable modules disabled even when permission exists", () => {
    const financial = MODULES.find((module) => module.id === "financial")!;
    expect(canAccessModule(financial, ["financial.read"])).toBe(false);
  });

  it("allows access to available modules when permission exists", () => {
    const customers = MODULES.find((module) => module.id === "customers")!;
    const appointments = MODULES.find((module) => module.id === "appointments")!;
    expect(canAccessModule(customers, permissions)).toBe(true);
    expect(canAccessModule(appointments, permissions)).toBe(true);
  });
});
