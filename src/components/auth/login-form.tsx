"use client";

import { ArrowRight, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";

type LoginError = {
  message?: unknown;
};

export function LoginForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.get("email"),
          password: formData.get("password"),
        }),
      });

      if (!response.ok) {
        const problem = (await response.json().catch(() => ({}))) as LoginError;
        throw new Error(
          typeof problem.message === "string"
            ? problem.message
            : "Não foi possível entrar. Tente novamente.",
        );
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Não foi possível entrar. Tente novamente.",
      );
      setIsSubmitting(false);
    }
  }

  return (
    <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="email">
          E-mail
        </label>
        <input
          autoComplete="email"
          className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-[15px] text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          id="email"
          name="email"
          placeholder="voce@empresa.com.br"
          required
          type="email"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <label className="text-sm font-medium text-slate-700" htmlFor="password">
            Senha
          </label>
          <span className="text-xs font-medium text-slate-400">
            Recuperação em breve
          </span>
        </div>
        <input
          autoComplete="current-password"
          className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-[15px] text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          id="password"
          minLength={1}
          name="password"
          placeholder="Digite sua senha"
          required
          type="password"
        />
      </div>

      {error ? (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <Button
        className="h-12 w-full rounded-xl bg-blue-600 px-5 text-[15px] shadow-lg shadow-blue-600/20 hover:bg-blue-700"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? (
          <>
            <LoaderCircle className="animate-spin" /> Entrando…
          </>
        ) : (
          <>
            Entrar <ArrowRight />
          </>
        )}
      </Button>
    </form>
  );
}
