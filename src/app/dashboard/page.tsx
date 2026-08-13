import { CalendarDays, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app/app-shell";
import { AgendaToday } from "@/components/dashboard/agenda-today";
import { DashboardMetrics } from "@/components/dashboard/dashboard-metrics";
import { getSessionUser } from "@/lib/auth/server-session";

export default async function DashboardPage() {
  const user = await getSessionUser();

  if (!user) redirect("/login");

  const firstName = user.name.split(/\s+/)[0] || user.name;

  return (
    <AppShell user={user}>
      <section className="mx-auto max-w-5xl space-y-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              <CalendarDays className="size-3.5" /> Visão Geral
            </div>
            <h1 className="text-3xl font-semibold tracking-[-0.035em] text-slate-950">
              Olá, {firstName}.
            </h1>
            <p className="mt-2 text-slate-500">
              Acompanhe o desempenho do seu negócio e seus compromissos de hoje.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 self-start rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600 sm:self-auto">
            <ShieldCheck className="size-4 text-emerald-600" />
            {user.role}
          </div>
        </div>

        <DashboardMetrics />

        <div className="pt-2">
          <AgendaToday />
        </div>
      </section>
    </AppShell>
  );
}
