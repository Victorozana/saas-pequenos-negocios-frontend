import { describe, expect, it } from "vitest";

import { MODULES, canAccessModule, hasPermission } from "./permissions";

const permissions = ["customers.read", "appointments.read"];

describe("permission helpers", () => {
  it("uses explicit permissions instead of inferring access from a role", () => {
    expect(hasPermission(permissions, "customers.read")).toBe(true);
    expect(hasPermission(permissions, "financial.read")).toBe(false);
  });

  it("enables financial and team modules only with their read permission", () => {
    const financial = MODULES.find((module) => module.id === "financial")!;
    const team = MODULES.find((module) => module.id === "team")!;
    expect(canAccessModule(financial, ["financial.read"])).toBe(true);
    expect(canAccessModule(team, ["team.read"])).toBe(true);
    expect(canAccessModule(financial, ["financial.write"])).toBe(false);
    expect(canAccessModule(team, [])).toBe(false);
  });

  it("allows access to available modules when permission exists", () => {
    const customers = MODULES.find((module) => module.id === "customers")!;
    const appointments = MODULES.find((module) => module.id === "appointments")!;
    expect(canAccessModule(customers, permissions)).toBe(true);
    expect(canAccessModule(appointments, permissions)).toBe(true);
  });
});
