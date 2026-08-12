import { describe, expect, it } from "vitest";

import {
  isRegisterTenantRequest,
  isValidPassword,
  messageForOnboardingStatus,
} from "./tenant-onboarding";

const validRequest = {
  cnpj: "12.345.678/0001-90",
  companyName: "Nexo Local Ltda",
  tradeName: "Nexo Local",
  legalNature: "Sociedade limitada",
  primaryCnae: "6201-5/01",
  categoryId: 10,
  email: "contato@nexo.local",
  phone: "11999999999",
  addressStreet: "Rua das Flores",
  addressNumber: "123",
  addressComplement: "Sala 2",
  addressNeighborhood: "Centro",
  addressCity: "São Paulo",
  addressState: "SP",
  addressZipCode: "01001000",
  stateRegistration: "ISENTO",
  municipalRegistration: "12345",
  isTaxExempt: true,
  taxRegime: "SimplesNacional",
  fiscalEmail: "fiscal@nexo.local",
  adminName: "Vitória Silva",
  adminCpf: "12345678909",
  adminEmail: "vitoria@nexo.local",
  adminPassword: "SenhaSegura123!",
  isLegalRepresentative: true,
};

describe("tenant onboarding contract", () => {
  it("accepts a request with every required RegisterTenantRequest field", () => {
    expect(isRegisterTenantRequest(validRequest)).toBe(true);
  });

  it("rejects a request missing a mandatory field", () => {
    const requestWithoutPassword = { ...validRequest };
    delete (requestWithoutPassword as Partial<typeof validRequest>).adminPassword;
    expect(isRegisterTenantRequest(requestWithoutPassword)).toBe(false);
  });

  it("enforces the backend password policy", () => {
    expect(isValidPassword("SenhaSegura123!")).toBe(true);
    expect(isValidPassword("curta1!")).toBe(false);
    expect(isValidPassword("senhasemnumero!")).toBe(false);
  });

  it("uses distinct safe messages for validation, conflicts and unavailable service", () => {
    expect(messageForOnboardingStatus(422, { title: "CNPJ inválido" })).toBe(
      "CNPJ inválido",
    );
    expect(messageForOnboardingStatus(409)).toContain("conflitante");
    expect(messageForOnboardingStatus(503)).toContain("indisponível");
  });
});
