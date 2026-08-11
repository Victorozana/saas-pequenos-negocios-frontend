import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app/app-shell";
import { getSessionUser } from "@/lib/auth/server-session";

const overview = [
  {
    label: "Atendimentos hoje",
    value: "—",
    helper: "Aguardando módulo de agenda",
    icon: CalendarDays,
  },
  {
    label: "Clientes ativos",
    value: "—",
    helper: "Aguardando módulo de clientes",
    icon: UsersRound,
  },
  {
    label: "Serviços concluídos",
    value: "—",
    helper: "Aguardando ordens de serviço",
    icon: CheckCircle2,
  },
];

export default async function DashboardPage() {
  const user = await getSessionUser();

  if (!user) redirect("/login");

  const firstName = user.name.split(/\s+/)[0] || user.name;

  return (
    <AppShell user={user}>
      <section>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              <Sparkles className="size-3.5" /> Base inicial conectada
            </div>
            <h1 className="text-3xl font-semibold tracking-[-0.035em] text-slate-950">
              Olá, {firstName}.
            </h1>
            <p className="mt-2 text-slate-500">
              Sua sessão está ativa. Esta visão será preenchida pelos próximos módulos.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Clock3 className="size-4" /> Atualização em tempo real em breve
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {overview.map(({ label, value, helper, icon: Icon }) => (
            <article
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/40"
              key={label}
            >
              <div className="flex items-start justify-between">
                <div className="grid size-10 place-items-center rounded-xl bg-slate-100 text-slate-600">
                  <Icon className="size-5" />
                </div>
                <ArrowUpRight className="size-4 text-slate-300" />
              </div>
              <p className="mt-7 text-sm font-medium text-slate-500">{label}</p>
              <p className="mt-1 text-3xl font-semibold tracking-tight">{value}</p>
              <p className="mt-3 text-xs text-slate-400">{helper}</p>
            </article>
          ))}
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <article className="min-h-80 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/40">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">Movimento da operação</h2>
                <p className="mt-1 text-sm text-slate-400">
                  O gráfico será conectado aos endpoints do dashboard.
                </p>
              </div>
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                Próxima fase
              </span>
            </div>
            <div className="mt-10 flex h-40 items-end gap-3 rounded-xl bg-slate-50 px-5 pt-8 pb-5">
              {[36, 52, 43, 68, 58, 82, 72, 91, 65, 78, 55, 88].map(
                (height, index) => (
                  <div
                    className="flex-1 rounded-t bg-slate-200"
                    key={`${height}-${index}`}
                    style={{ height: `${height}%` }}
                  />
                ),
              )}
            </div>
          </article>

          <article className="rounded-2xl bg-[#0b1739] p-6 text-white shadow-xl shadow-slate-900/10">
            <div className="grid size-11 place-items-center rounded-xl bg-blue-500/20 text-blue-300">
              <CheckCircle2 className="size-5" />
            </div>
            <h2 className="mt-8 text-xl font-semibold tracking-tight">
              Fundação pronta
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Login seguro, sessão validada no backend e permissões granulares já
              orientam a interface.
            </p>
            <div className="mt-7 space-y-3 text-sm text-slate-300">
              <p>✓ Token protegido por cookie HttpOnly</p>
              <p>✓ Perfil e tenant carregados pela API</p>
              <p>✓ Navegação filtrada por permissão</p>
            </div>
          </article>
        </div>
      </section>
    </AppShell>
  );
}
