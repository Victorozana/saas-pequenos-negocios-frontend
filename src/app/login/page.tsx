import { BarChart3, CalendarCheck2, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { LoginForm } from "@/components/auth/login-form";

const benefits = [
  {
    icon: CalendarCheck2,
    title: "Rotina em um só lugar",
    text: "Agenda, clientes e operação conectados.",
  },
  {
    icon: BarChart3,
    title: "Decisões mais claras",
    text: "Acompanhe o negócio sem depender de planilhas soltas.",
  },
  {
    icon: ShieldCheck,
    title: "Acesso sob controle",
    text: "Cada pessoa vê apenas o que precisa para trabalhar.",
  },
];

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-white lg:grid lg:grid-cols-[minmax(420px,0.9fr)_1.1fr]">
      <section className="relative hidden overflow-hidden bg-[#0b1739] px-12 py-14 text-white lg:flex lg:flex-col xl:px-20">
        <div className="absolute -top-36 -left-24 size-96 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute right-0 bottom-0 size-80 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-blue-500 font-bold shadow-lg shadow-blue-500/25">
            N
          </div>
          <div>
            <p className="font-semibold tracking-tight">Nexo Local</p>
            <p className="text-xs text-blue-200/70">Seu negócio, bem conectado</p>
          </div>
        </div>

        <div className="relative my-auto max-w-xl py-16">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.24em] text-blue-300">
            Gestão feita para a vida real
          </p>
          <h1 className="text-4xl font-semibold leading-tight tracking-[-0.04em] xl:text-5xl">
            Menos improviso.
            <br />
            Mais negócio acontecendo.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-slate-300">
            Uma base simples e confiável para pequenos negócios organizarem o dia,
            atenderem melhor e crescerem com controle.
          </p>

          <div className="mt-12 grid gap-5">
            {benefits.map(({ icon: Icon, title, text }) => (
              <div className="flex items-start gap-4" key={title}>
                <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5">
                  <Icon className="size-5 text-blue-300" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="mt-1 text-sm text-slate-400">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-slate-500">
          © 2026 Nexo Local · Ambiente seguro
        </p>
      </section>

      <section className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_right,#eff6ff,transparent_42%)] px-5 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <div className="grid size-10 place-items-center rounded-xl bg-blue-600 font-bold text-white">
              N
            </div>
            <p className="font-semibold tracking-tight">Nexo Local</p>
          </div>

          <p className="text-sm font-semibold text-blue-600">Bem-vindo de volta</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-slate-950">
            Acesse sua conta
          </h2>
          <p className="mt-3 leading-7 text-slate-500">
            Entre com os dados cadastrados para continuar sua operação.
          </p>

          <LoginForm />

          <p className="mt-6 text-sm text-slate-600">
            Ainda não tem uma conta?{" "}
            <Link className="font-semibold text-blue-600 hover:underline" href="/cadastro">
              Cadastre seu negócio
            </Link>
          </p>

          <div className="mt-8 flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="size-4" />
            Seu acesso é protegido e o token não fica exposto no navegador.
          </div>
        </div>
      </section>
    </main>
  );
}
