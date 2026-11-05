"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { browserRequest } from "@/lib/api/browser-request";
import {
  actionClass,
  Field,
  fieldClass,
  Notice,
} from "@/components/app/module-ui";

export default function AcceptInvitationPage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const element = event.currentTarget;
    const form = new FormData(element);
    const password = String(form.get("password") || "");
    if (password !== form.get("confirmation")) {
      setError("As senhas devem ser iguais.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      await browserRequest("/api/team-members/invitations/accept", "POST", {
        token: String(form.get("token") || "").trim(),
        password,
        name: String(form.get("name") || "").trim() || null,
      });
      element.reset();
      setSuccess(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold text-blue-600">Nexo Local</p>
        <h1 className="mt-2 text-2xl font-semibold">
          Aceitar convite da equipe
        </h1>
        {success ? (
          <div className="mt-6 space-y-4">
            <Notice>
              Convite aceito com sucesso. Entre com o e-mail que recebeu o
              convite. Se você já tinha uma conta, sua senha anterior foi
              mantida.
            </Notice>
            <Link className={actionClass} href="/login">
              Ir para o login
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <p className="text-sm text-slate-500">
              Informe o código recebido e seus dados. O convite pode ser
              utilizado uma única vez e vale por 7 dias.
            </p>
            <Field label="Código do convite">
              <input
                className={fieldClass}
                type="password"
                name="token"
                required
                autoComplete="off"
                spellCheck={false}
              />
            </Field>
            <Field label="Seu nome (opcional)">
              <input
                className={fieldClass}
                name="name"
                maxLength={200}
                autoComplete="name"
              />
            </Field>
            <Field label="Senha (mínimo de 12 caracteres)">
              <input
                className={fieldClass}
                name="password"
                type="password"
                minLength={12}
                required
                autoComplete="new-password"
              />
            </Field>
            <Field label="Confirme a senha">
              <input
                className={fieldClass}
                name="confirmation"
                type="password"
                minLength={12}
                required
                autoComplete="new-password"
              />
            </Field>
            <p className="text-xs text-slate-500">
              Já possui uma conta? O aceite mantém sua senha existente. A senha
              informada aqui só é definida para contas novas.
            </p>
            {error && <Notice error>{error}</Notice>}
            <button className={`${actionClass} w-full`} disabled={busy}>
              {busy ? "Aceitando…" : "Aceitar convite"}
            </button>
            <Link
              href="/login"
              className="block text-center text-sm text-blue-700 underline"
            >
              Voltar ao login
            </Link>
          </form>
        )}
      </section>
    </main>
  );
}
