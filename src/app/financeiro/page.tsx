import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { FinancialScreen } from "@/components/financial/financial-screen";
import { getSessionUser } from "@/lib/auth/server-session";
export default async function FinanceiroPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/financeiro");
  return (
    <AppShell user={user}>
      {user.permissions.includes("financial.read") ? (
        <FinancialScreen user={user} />
      ) : (
        <section>
          <h1 className="text-2xl font-semibold">Financeiro</h1>
          <p className="mt-4 text-slate-600">
            Você não tem permissão para acessar o financeiro. Solicite acesso ao
            administrador.
          </p>
        </section>
      )}
    </AppShell>
  );
}
