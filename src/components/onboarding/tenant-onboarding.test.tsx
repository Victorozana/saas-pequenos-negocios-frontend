import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup } from "@testing-library/react";

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
import { TenantOnboarding } from "./tenant-onboarding";

const expectedRegistrationRequest = {
  cnpj: "1",
  companyName: "Nexo",
  tradeName: "Nexo",
  legalNature: "LTDA",
  primaryCnae: "1",
  categoryId: 10,
  email: "e@n.com",
  phone: "1",
  addressStreet: "Rua",
  addressNumber: "1",
  addressComplement: "-",
  addressNeighborhood: "Centro",
  addressCity: "SP",
  addressState: "SP",
  addressZipCode: "1",
  stateRegistration: "ISENTO",
  municipalRegistration: "1",
  isTaxExempt: false,
  taxRegime: "SimplesNacional",
  fiscalEmail: "f@n.com",
  adminName: "Admin",
  adminCpf: "1",
  adminEmail: "a@n.com",
  adminPassword: "SenhaSegura123!",
  isLegalRepresentative: false,
};

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
  afterEach(() => { cleanup(); vi.restoreAllMocks(); replace.mockReset(); window.history.replaceState({}, "", "/"); localStorage.clear(); sessionStorage.clear(); });
  it("consults the BFF and populates every mapped company field while keeping them editable", async () => {
    const company = {
      cnpj: "00000000000191",
      corporateName: "Empresa Exemplo LTDA",
      tradeName: "Empresa Exemplo",
      legalNature: "Sociedade Empresária Limitada",
      cnaes: ["2391503", "4744005"],
      status: "ATIVA",
      address: { street:"Rua das Flores", number:"10", complement:"Sala 2", neighborhood:"Centro", city:"São Paulo", state:"SP", zipCode:"01001000" },
    };
    const fetcher = vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json(company));
    render(<TenantOnboarding />);
    fillStep({ "CNPJ":"00.000.000/0001-91", "E-mail da empresa":"contato@empresa.com", "Telefone":"11999999999" });
    fireEvent.change(screen.getByLabelText("Categoria"), { target:{value:"10"} });

    fireEvent.click(screen.getByRole("button", { name:"Consultar CNPJ" }));

    await waitFor(() => expect(fetcher).toHaveBeenCalledWith("/api/company-registry/00.000.000%2F0001-91"));
    expect((screen.getByLabelText("CNPJ") as HTMLInputElement).value).toBe(company.cnpj);
    expect((screen.getByLabelText("Razão social") as HTMLInputElement).value).toBe(company.corporateName);
    expect((screen.getByLabelText("Nome fantasia") as HTMLInputElement).value).toBe(company.tradeName);
    expect((screen.getByLabelText("Natureza jurídica") as HTMLInputElement).value).toBe(company.legalNature);
    expect((screen.getByLabelText("CNAE principal") as HTMLInputElement).value).toBe(company.cnaes[0]);
    expect((screen.getByLabelText("E-mail da empresa") as HTMLInputElement).value).toBe("contato@empresa.com");
    expect((screen.getByLabelText("Telefone") as HTMLInputElement).value).toBe("11999999999");

    fireEvent.change(screen.getByLabelText("Razão social"), { target:{value:"Empresa Revisada LTDA"} });
    fireEvent.click(screen.getByRole("button", { name:"Continuar" }));
    expect((screen.getByLabelText("Logradouro") as HTMLInputElement).value).toBe(company.address.street);
    expect((screen.getByLabelText("Número") as HTMLInputElement).value).toBe(company.address.number);
    expect((screen.getByLabelText("Complemento") as HTMLInputElement).value).toBe(company.address.complement);
    expect((screen.getByLabelText("Bairro") as HTMLInputElement).value).toBe(company.address.neighborhood);
    expect((screen.getByLabelText("Cidade") as HTMLInputElement).value).toBe(company.address.city);
    expect((screen.getByLabelText("UF") as HTMLInputElement).value).toBe(company.address.state);
    expect((screen.getByLabelText("CEP") as HTMLInputElement).value).toBe(company.address.zipCode);
    fireEvent.click(screen.getByRole("button", { name:"Voltar" }));
    expect((screen.getByLabelText("Razão social") as HTMLInputElement).value).toBe("Empresa Revisada LTDA");
  });

  it("disables lookup and announces progress while the request is pending", async () => {
    let resolveLookup: ((response: Response) => void) | undefined;
    vi.spyOn(globalThis, "fetch").mockImplementationOnce(() => new Promise<Response>((resolve) => { resolveLookup = resolve; }));
    render(<TenantOnboarding />);
    fillStep({ "CNPJ":"00000000000191" });

    fireEvent.click(screen.getByRole("button", { name:"Consultar CNPJ" }));

    const loadingButton = await screen.findByRole("button", { name:"Consultando…" });
    expect((loadingButton as HTMLButtonElement).disabled).toBe(true);
    resolveLookup?.(Response.json({}));
  });

  it.each([
    [400, "CNPJ inválido."],
    [404, "Empresa não encontrada."],
    [422, "A empresa não está ativa."],
    [503, "Não foi possível consultar o CNPJ agora."],
  ])("keeps company values and does not advance after lookup HTTP %i", async (status, message) => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ message }, { status }));
    render(<TenantOnboarding />);
    fillStep({ "CNPJ":"00000000000191", "Razão social":"Valor preservado" });

    fireEvent.click(screen.getByRole("button", { name:"Consultar CNPJ" }));

    expect((await screen.findByRole("alert")).textContent).toBe(message);
    expect(screen.getByRole("heading", { name:"Dados da empresa" })).toBeDefined();
    expect((screen.getByLabelText("Razão social") as HTMLInputElement).value).toBe("Valor preservado");
  });
  it.each([
    ["minimum of 12 characters", "Aa1!curta"],
    ["an uppercase character", "senhasegura123!"],
    ["a lowercase character", "SENHASEGURA123!"],
    ["a number", "SenhaSeguraABC!"],
    ["a special character", "SenhaSegura1234"],
  ])("blocks a password without %s and associates the error with the field", async (_rule, password) => {
    render(<TenantOnboarding />); fillStep({ "CNPJ":"1", "Razão social":"Nexo", "Nome fantasia":"Nexo", "Natureza jurídica":"LTDA", "CNAE principal":"1", "E-mail da empresa":"e@n.com", "Telefone":"1" }); fireEvent.change(screen.getByLabelText("Categoria"), { target:{value:"10"} }); fireEvent.click(screen.getByRole("button", {name:"Continuar"}));
    fillStep({ "Logradouro":"Rua", "Número":"1", "Complemento":"-", "Bairro":"Centro", "Cidade":"SP", "UF":"SP", "CEP":"1", "Inscrição estadual":"ISENTO", "Inscrição municipal":"1", "E-mail fiscal":"f@n.com" }); fireEvent.change(screen.getByLabelText("Regime tributário"), {target:{value:"SimplesNacional"}}); fireEvent.click(screen.getByRole("button", {name:"Continuar"}));
    fillStep({ "Nome do administrador":"Admin", "CPF":"1", "E-mail do administrador":"a@n.com", "Senha":password }); fireEvent.click(screen.getByRole("button", {name:"Concluir cadastro"}));
    const alert = await screen.findByRole("alert");
    const passwordField = screen.getByLabelText("Senha");
    expect(alert.textContent).toBe("A senha deve ter ao menos 12 caracteres, com maiúscula, minúscula, número e caractere especial.");
    expect(passwordField.getAttribute("aria-describedby")).toBe(alert.id);
    expect(passwordField.getAttribute("aria-invalid")).toBe("true");
  });
  it("confirms after registration without placing the token in navigation", async () => {
    let resolveVerification: ((response: Response) => void) | undefined;
    const fetcher = vi.spyOn(globalThis,"fetch").mockResolvedValueOnce(Response.json({ message:"Criado", token:"verification-token" }, {status:201})).mockImplementationOnce(() => new Promise<Response>((resolve) => { resolveVerification = resolve; }));
    render(<TenantOnboarding />); fillStep({ "CNPJ":"1", "Razão social":"Nexo", "Nome fantasia":"Nexo", "Natureza jurídica":"LTDA", "CNAE principal":"1", "E-mail da empresa":"e@n.com", "Telefone":"1" }); fireEvent.change(screen.getByLabelText("Categoria"), {target:{value:"10"}}); fireEvent.click(screen.getByRole("button", {name:"Continuar"})); fillStep({ "Logradouro":"Rua", "Número":"1", "Complemento":"-", "Bairro":"Centro", "Cidade":"SP", "UF":"SP", "CEP":"1", "Inscrição estadual":"ISENTO", "Inscrição municipal":"1", "E-mail fiscal":"f@n.com" }); fireEvent.change(screen.getByLabelText("Regime tributário"), {target:{value:"SimplesNacional"}}); fireEvent.click(screen.getByRole("button", {name:"Continuar"})); fillStep({ "Nome do administrador":"Admin", "CPF":"1", "E-mail do administrador":"a@n.com", "Senha":"SenhaSegura123!" }); fireEvent.click(screen.getByRole("button", {name:"Concluir cadastro"}));
    await screen.findByRole("button", {name:"Confirmar e-mail"});
    expect(fetcher.mock.calls[0][0]).toBe("/api/tenants/register");
    const registrationInit = fetcher.mock.calls[0][1] as RequestInit;
    const registrationHeaders = registrationInit.headers as Record<string, string>;
    expect(JSON.parse(String(registrationInit.body))).toEqual(expectedRegistrationRequest);
    expect(registrationHeaders["Idempotency-Key"]).toEqual(expect.any(String));
    expect(registrationHeaders["Idempotency-Key"].trim()).not.toBe("");
    fireEvent.click(screen.getByRole("button", {name:"Confirmar e-mail"})); await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2)); expect(fetcher).toHaveBeenLastCalledWith("/api/auth/email-verifications", expect.objectContaining({ body: JSON.stringify({token:"verification-token"}) })); expect(replace).not.toHaveBeenCalled(); resolveVerification?.(new Response(null,{status:204})); await waitFor(()=>expect(replace).toHaveBeenCalledWith("/login"));
  });

  it("keeps the verification token out of the URL, persistent storage, and logs", async () => {
    const token = "verification-token";
    const storageWriter = vi.spyOn(Storage.prototype, "setItem");
    const loggers = [vi.spyOn(console, "log"), vi.spyOn(console, "info"), vi.spyOn(console, "warn"), vi.spyOn(console, "error")];
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(Response.json({ message: "Criado", token }, { status: 201 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    window.history.replaceState({}, "", "/cadastro");
    render(<TenantOnboarding />);
    reachRegistrationStep();

    fireEvent.click(screen.getByRole("button", { name: "Concluir cadastro" }));
    fireEvent.click(await screen.findByRole("button", { name: "Confirmar e-mail" }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));

    expect(window.location.href).not.toContain(token);
    expect(Array.from({ length: localStorage.length }, (_, index) => localStorage.getItem(localStorage.key(index)!)).join("")).not.toContain(token);
    expect(Array.from({ length: sessionStorage.length }, (_, index) => sessionStorage.getItem(sessionStorage.key(index)!)).join("")).not.toContain(token);
    expect(JSON.stringify(storageWriter.mock.calls)).not.toContain(token);
    expect(JSON.stringify(loggers.flatMap((logger) => logger.mock.calls))).not.toContain(token);
  });

  it("shows a safe message and remains on email confirmation when confirmation fails", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(Response.json({ message: "Criado", token: "verification-token" }, { status: 201 }))
      .mockResolvedValueOnce(Response.json({ message: "database connection leaked" }, { status: 500 }));
    render(<TenantOnboarding />);
    reachRegistrationStep();

    fireEvent.click(screen.getByRole("button", { name: "Concluir cadastro" }));
    fireEvent.click(await screen.findByRole("button", { name: "Confirmar e-mail" }));

    expect((await screen.findByRole("alert")).textContent).toBe("Não foi possível confirmar o e-mail.");
    expect(screen.getByRole("heading", { name: "Confirme seu e-mail" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Confirmar e-mail" })).toBeDefined();
    expect(replace).not.toHaveBeenCalled();
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

  it.each([
    [
      "without a verification token",
      () => Response.json({ message: "A confirmação não pode continuar neste ambiente." }, { status: 201 }),
      "A confirmação não pode continuar neste ambiente.",
    ],
    [
      "with an invalid body",
      () => new Response("not-json", { status: 201, headers: { "Content-Type": "application/json" } }),
      "Não foi possível concluir o cadastro agora. Tente novamente.",
    ],
  ])("keeps the registration step after a 201 response %s", async (_scenario, createResponse, message) => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(createResponse());
    render(<TenantOnboarding />);
    reachRegistrationStep();

    fireEvent.click(screen.getByRole("button", { name: "Concluir cadastro" }));

    expect((await screen.findByRole("alert")).textContent).toBe(message);
    expect(screen.queryByRole("heading", { name: "Confirme seu e-mail" })).toBeNull();
    expect(screen.getByRole("heading", { name: "Administrador" })).toBeDefined();
    expect((screen.getByLabelText("E-mail do administrador") as HTMLInputElement).value).toBe("a@n.com");
    fireEvent.click(screen.getByRole("button", { name: "Voltar" }));
    fireEvent.click(screen.getByRole("button", { name: "Voltar" }));
    expect((screen.getByLabelText("Razão social") as HTMLInputElement).value).toBe("Nexo");
  });
});
