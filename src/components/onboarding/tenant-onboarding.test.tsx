import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup } from "@testing-library/react";

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
import { TenantOnboarding } from "./tenant-onboarding";

function fillStep(fields: Record<string, string>) { Object.entries(fields).forEach(([label, value]) => fireEvent.change(screen.getByLabelText(label), { target: { value } })); }

describe("TenantOnboarding", () => {
  afterEach(() => { cleanup(); vi.restoreAllMocks(); replace.mockReset(); });
  it("blocks an administrator password that does not meet the policy", async () => {
    render(<TenantOnboarding />); fillStep({ "CNPJ":"1", "Razão social":"Nexo", "Nome fantasia":"Nexo", "Natureza jurídica":"LTDA", "CNAE principal":"1", "E-mail da empresa":"e@n.com", "Telefone":"1" }); fireEvent.change(screen.getByLabelText("Categoria"), { target:{value:"10"} }); fireEvent.click(screen.getByRole("button", {name:"Continuar"}));
    fillStep({ "Logradouro":"Rua", "Número":"1", "Complemento":"-", "Bairro":"Centro", "Cidade":"SP", "UF":"SP", "CEP":"1", "Inscrição estadual":"ISENTO", "Inscrição municipal":"1", "E-mail fiscal":"f@n.com" }); fireEvent.change(screen.getByLabelText("Regime tributário"), {target:{value:"SimplesNacional"}}); fireEvent.click(screen.getByRole("button", {name:"Continuar"}));
    fillStep({ "Nome do administrador":"Admin", "CPF":"1", "E-mail do administrador":"a@n.com", "Senha":"curta1!" }); fireEvent.click(screen.getByRole("button", {name:"Concluir cadastro"}));
    expect((await screen.findByRole("alert")).textContent).toContain("ao menos 12 caracteres");
  });
  it("confirms after registration without placing the token in navigation", async () => {
    const fetcher = vi.spyOn(globalThis,"fetch").mockResolvedValueOnce(Response.json({ message:"Criado", token:"verification-token" }, {status:201})).mockResolvedValueOnce(new Response(null,{status:204}));
    render(<TenantOnboarding />); fillStep({ "CNPJ":"1", "Razão social":"Nexo", "Nome fantasia":"Nexo", "Natureza jurídica":"LTDA", "CNAE principal":"1", "E-mail da empresa":"e@n.com", "Telefone":"1" }); fireEvent.change(screen.getByLabelText("Categoria"), {target:{value:"10"}}); fireEvent.click(screen.getByRole("button", {name:"Continuar"})); fillStep({ "Logradouro":"Rua", "Número":"1", "Complemento":"-", "Bairro":"Centro", "Cidade":"SP", "UF":"SP", "CEP":"1", "Inscrição estadual":"ISENTO", "Inscrição municipal":"1", "E-mail fiscal":"f@n.com" }); fireEvent.change(screen.getByLabelText("Regime tributário"), {target:{value:"SimplesNacional"}}); fireEvent.click(screen.getByRole("button", {name:"Continuar"})); fillStep({ "Nome do administrador":"Admin", "CPF":"1", "E-mail do administrador":"a@n.com", "Senha":"SenhaSegura123!" }); fireEvent.click(screen.getByRole("button", {name:"Concluir cadastro"}));
    await screen.findByRole("button", {name:"Confirmar e-mail"}); expect(fetcher.mock.calls[0][0]).toBe("/api/tenants/register"); expect((fetcher.mock.calls[0][1] as RequestInit).body).toContain('"cnpj":"1"'); expect((fetcher.mock.calls[0][1] as RequestInit).body).toContain('"addressStreet":"Rua"'); fireEvent.click(screen.getByRole("button", {name:"Confirmar e-mail"})); await waitFor(()=>expect(replace).toHaveBeenCalledWith("/login")); expect(fetcher).toHaveBeenLastCalledWith("/api/auth/email-verifications", expect.objectContaining({ body: JSON.stringify({token:"verification-token"}) }));
  });
});
