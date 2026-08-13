import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup } from "@testing-library/react";

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
import { TenantOnboarding } from "./tenant-onboarding";

function fillStep(fields: Record<string, string>) { Object.entries(fields).forEach(([label, value]) => fireEvent.change(screen.getByLabelText(label), { target: { value } })); }

function fillCompanyStep() {
  fillStep({ "CNPJ":"1", "Razão social":"Nexo", "Nome fantasia":"Nexo", "Natureza jurídica":"LTDA", "CNAE principal":"1", "E-mail da empresa":"e@n.com", "Telefone":"1" });
  fireEvent.change(screen.getByLabelText("Categoria"), { target:{value:"10"} });
  fireEvent.click(screen.getByRole("button", {name:"Continuar"}));
}

function fillFiscalStep() {
  fillStep({ "Logradouro":"Rua", "Número":"1", "Complemento":"-", "Bairro":"Centro", "Cidade":"SP", "UF":"SP", "CEP":"1", "Inscrição estadual":"ISENTO", "Inscrição municipal":"1", "E-mail fiscal":"f@n.com" });
  fireEvent.change(screen.getByLabelText("Regime tributário"), {target:{value:"SimplesNacional"}});
  fireEvent.click(screen.getByRole("button", {name:"Continuar"}));
}

function fillAdministratorStep() {
  fillStep({ "Nome do administrador":"Admin", "CPF":"1", "E-mail do administrador":"a@n.com", "Senha":"SenhaSegura123!" });
}

function reachRegistrationStep() {
  fillCompanyStep();
  fillFiscalStep();
  fillAdministratorStep();
}

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

  it("disables completion and announces loading while registration is pending", async () => {
    let resolveRegistration: ((response: Response) => void) | undefined;
    vi.spyOn(globalThis, "fetch").mockImplementationOnce(() => new Promise<Response>((resolve) => { resolveRegistration = resolve; }));
    render(<TenantOnboarding />);
    reachRegistrationStep();

    fireEvent.click(screen.getByRole("button", {name:"Concluir cadastro"}));

    const loadingButton = await screen.findByRole("button", { name: "Enviando…" });
    expect((loadingButton as HTMLButtonElement).disabled).toBe(true);
    resolveRegistration?.(Response.json({ message: "Criado", token: "verification-token" }, { status: 201 }));
    await screen.findByRole("button", { name: "Confirmar e-mail" });
  });

  it.each([
    [400, "Dados de cadastro inválidos."],
    [422, "CNPJ inválido"],
    [409, "Já existe um cadastro conflitante. Revise os dados e tente novamente."],
    [503, "O serviço está temporariamente indisponível. Tente novamente."],
  ])("shows the safe registration message for HTTP %i and retains form values", async (status, message) => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ message }, { status }));
    render(<TenantOnboarding />);
    reachRegistrationStep();

    fireEvent.click(screen.getByRole("button", { name: "Concluir cadastro" }));

    expect((await screen.findByRole("alert")).textContent).toBe(message);
    expect((screen.getByLabelText("Nome do administrador") as HTMLInputElement).value).toBe("Admin");
    fireEvent.click(screen.getByRole("button", { name: "Voltar" }));
    fireEvent.click(screen.getByRole("button", { name: "Voltar" }));
    expect((screen.getByLabelText("Razão social") as HTMLInputElement).value).toBe("Nexo");
  });

  it("hides internal network details after a registration failure", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("database endpoint leaked"));
    render(<TenantOnboarding />);
    reachRegistrationStep();

    fireEvent.click(screen.getByRole("button", { name: "Concluir cadastro" }));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toBe("Não foi possível concluir o cadastro agora. Tente novamente.");
  });
});
