"use client";

export default function ModuleError({ reset }: { reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-6">
      <section
        role="alert"
        className="max-w-lg space-y-4 rounded-2xl border border-slate-200 bg-white p-6"
      >
        <h1 className="text-xl font-semibold">
          Não foi possível carregar este módulo
        </h1>
        <p className="text-sm text-slate-600">
          O serviço pode estar temporariamente indisponível. Seus dados foram
          preservados.
        </p>
        <button
          onClick={reset}
          className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white"
        >
          Tentar novamente
        </button>
      </section>
    </main>
  );
}
