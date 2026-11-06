import { expect, test, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

const api = process.env.E2E_BACKEND_URL ?? "http://localhost:5075";

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL("**/dashboard");
}

async function invitationCode(directory: string, email: string) {
  for (const entry of await readdir(directory)) {
    if (!entry.endsWith(".eml")) continue;
    const raw = await readFile(join(directory, entry), "utf8");
    if (!raw.includes(email)) continue;
    const body = raw.split(/\r?\n\r?\n/).slice(1).join("\n").trim();
    const decoded = /transfer-encoding:\s*base64/i.test(raw)
      ? Buffer.from(body, "base64").toString("utf8")
      : body.replace(/=\r?\n/g, "");
    const token = decoded.match(/\b[A-F0-9]{64}\b/);
    if (token) return token[0];
  }
  return undefined;
}

test("orçamento gera OS individuais e em equipe e baixa PDF real", async ({ page, browser, request }) => {
  const directory = process.env.E2E_PICKUP_DIRECTORY;
  const password = process.env.E2E_ADMIN_PASSWORD;
  expect(!!directory && !!password, "Execute scripts/regression.ps1 para iniciar os serviços de teste").toBe(true);

  const email = process.env.E2E_ADMIN_EMAIL ?? "victor@gmail.com";
  const admin = await request.post(api + "/api/v1/auth/sessions", { data: { email, password } });
  expect(admin.ok(), "Sessão administrativa de teste").toBe(true);
  const headers = { Authorization: "Bearer " + (await admin.json()).accessToken };
  const suffix = randomUUID().slice(0, 8);
  const members = [
    { name: "João " + suffix, email: "joao-" + suffix + "@example.test" },
    { name: "Maria " + suffix, email: "maria-" + suffix + "@example.test" },
  ];
  for (const member of members) {
    const invited = await request.post(api + "/api/v1/team-members/invitations", {
      headers, data: { email: member.email, role: "Colaborador", permissions: ["appointments.read"] },
    });
    expect(invited.status()).toBe(201);
  }
  const memberPassword = randomUUID();
  for (const member of members) {
    let token: string | undefined;
    await expect.poll(async () => {
      token = await invitationCode(directory!, member.email);
      return !!token;
    }, { timeout: 50_000 }).toBe(true);
    const accepted = await request.post(api + "/api/v1/team-members/invitations/accept", {
      data: { token, password: memberPassword, name: member.name },
    });
    expect(accepted.status()).toBe(200);
  }

  const customer = await request.post(api + "/api/v1/customers", {
    headers, data: { name: "Cliente teste " + suffix, phone: "11999990000" },
  });
  expect(customer.status()).toBe(201);
  const code = "E2E-" + suffix;
  const quotation = await request.post(api + "/api/v1/quotations", {
    headers, data: {
      code, customerId: (await customer.json()).id, issueDate: new Date().toISOString(),
      items: [{ serviceName: "Instalação de teste", unit: "un", quantity: 1, unitPrice: 125, discountAmount: 0 }],
    },
  });
  expect(quotation.status()).toBe(201);
  const { id } = await quotation.json();
  expect((await request.patch(api + "/api/v1/quotations/" + id + "/status", {
    headers, data: { newStatus: 3 },
  })).status()).toBe(204);

  await login(page, email, password!);
  await page.goto("/orcamentos");
  const actions = page.getByRole("button", { name: "Ações do orçamento " + code });
  await actions.click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("menuitem", { name: "Baixar PDF" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("orcamento-" + id + ".pdf");
  expect((await readFile((await download.path())!)).subarray(0, 5).toString()).toBe("%PDF-");

  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo" }).format(new Date());
  async function schedule(type: string, people: string[], start: string, end: string, address: string) {
    await actions.click();
    await page.getByRole("menuitem", { name: "Criar ordem de serviço" }).click();
    const dialog = page.getByRole("dialog", { name: "Criar ordem de serviço" });
    await dialog.getByLabel("Atividade").selectOption(type);
    await dialog.getByLabel("Início (São Paulo)").fill(today + "T" + start);
    await dialog.getByLabel("Término (São Paulo)").fill(today + "T" + end);
    for (const person of people) await dialog.getByRole("checkbox", { name: person }).check();
    await dialog.getByLabel("Endereço").fill(address);
    const responsePromise = page.waitForResponse((response) => response.url().endsWith("/convert") && response.request().method() === "POST");
    await dialog.getByRole("button", { name: "Criar e agendar OS" }).click();
    expect((await responsePromise).status()).toBe(201);
    await expect(dialog).toBeHidden();
  }

  const joaoVisit = "Visita exclusiva " + suffix;
  const mariaVisit = "Instalação exclusiva " + suffix;
  const sharedVisit = "Compromisso conjunto " + suffix;
  await schedule("1", [members[0].name], "08:00", "09:00", joaoVisit);
  await schedule("3", [members[1].name], "09:00", "10:00", mariaVisit);
  await schedule("2", members.map((member) => member.name), "10:00", "11:00", sharedVisit);

  await page.goto("/dashboard");
  for (const address of [joaoVisit, mariaVisit, sharedVisit]) await expect(page.getByText(address)).toBeVisible();
  for (const [index, member] of members.entries()) {
    const context = await browser.newContext();
    try {
      const memberPage = await context.newPage();
      await login(memberPage, member.email, memberPassword);
      await expect(memberPage.getByText(sharedVisit)).toBeVisible();
      await expect(memberPage.getByText(index === 0 ? joaoVisit : mariaVisit)).toBeVisible();
      await expect(memberPage.getByText(index === 0 ? mariaVisit : joaoVisit)).toHaveCount(0);
    } finally {
      await context.close();
    }
  }
});
