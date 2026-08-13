"use client";

import {
  ArrowUpRight,
  Clock,
  Download,
  LoaderCircle,
  TrendingUp,
  Wallet,
  Wrench,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { type DashboardSummary } from "@/lib/dashboard/backend";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function DashboardMetrics() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadMetrics() {
      try {
        const response = await fetch("/api/dashboard/summary");
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            window.location.href = "/login";
            return;
          }
          const body = await response.json().catch(() => ({}));
          if (isMounted) {
            setError(
              typeof body.message === "string"
                ? body.message
                : "Não foi possível carregar as métricas agora. Tente novamente.",
            );
          }
          return;
        }

        const data = await response.json();
        if (isMounted) {
          setSummary(data.summary);
          setError(null);
        }
      } catch {
        if (isMounted) {
          setError(
            "Não foi possível carregar as métricas agora. Tente novamente.",
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadMetrics();
    return () => {
      isMounted = false;
    };
  }, []);

  async function handleExport() {
    setExporting(true);
    try {
      const response = await fetch("/api/dashboard/report");
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          window.location.href = "/login";
          return;
        }
        setError("Não foi possível exportar o relatório agora. Tente novamente.");
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "relatorio-desempenho.csv";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      setError("Não foi possível exportar o relatório agora. Tente novamente.");
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return (
      <div
        aria-label="Carregando métricas executivas"
        role="status"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {[1, 2, 3, 4].map((id) => (
          <div
            key={id}
            className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-slate-100/80 p-5"
          />
        ))}
      </div>
    );
  }

  if (error && !summary) {
    return (
      <div
        role="alert"
        className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 shadow-sm"
      >
        {error}
      </div>
    );
  }

  if (!summary) return null;

  const {
    totalReceivedAmount,
    totalReceivableAmount,
    pendingWorkOrdersCount,
    conversionMetrics,
  } = summary;

  return (
    <div className="space-y-4">
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700"
        >
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">
            Resumo Executivo
          </h2>
          <p className="text-xs text-slate-500">
            Métricas operacionais e consolidadas de faturamento.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          disabled={exporting}
          onClick={handleExport}
          className="inline-flex items-center gap-2 self-start rounded-lg border-slate-300 bg-white font-medium text-slate-700 shadow-sm hover:bg-slate-50 sm:self-auto"
        >
          {exporting ? (
            <>
              <LoaderCircle className="size-4 animate-spin" /> Exportando…
            </>
          ) : (
            <>
              <Download className="size-4 text-slate-500" /> Exportar CSV
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Faturamento Recebido */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:border-slate-300 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Recebido
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Wallet className="size-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold tracking-tight text-slate-950">
              {formatCurrency(totalReceivedAmount)}
            </div>
            <p className="mt-1 text-xs text-emerald-600 font-medium flex items-center gap-1">
              <ArrowUpRight className="size-3.5" /> Confirmado no caixa
            </p>
          </div>
        </div>

        {/* Card 2: A Receber */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:border-slate-300 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              A Receber
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Clock className="size-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold tracking-tight text-slate-950">
              {formatCurrency(totalReceivableAmount)}
            </div>
            <p className="mt-1 text-xs text-amber-600 font-medium">
              Orçamentos / Faturas a baixar
            </p>
          </div>
        </div>

        {/* Card 3: OS Pendentes */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:border-slate-300 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              OS Pendentes
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Wrench className="size-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold tracking-tight text-slate-950">
              {pendingWorkOrdersCount}
            </div>
            <p className="mt-1 text-xs text-slate-500 font-medium">
              Em andamento ou agendadas
            </p>
          </div>
        </div>

        {/* Card 4: Taxa de Conversão */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:border-slate-300 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Conversão
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <TrendingUp className="size-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold tracking-tight text-slate-950">
              {formatPercent(conversionMetrics.conversionRatePercentage)}
            </div>
            <p className="mt-1 text-xs text-indigo-600 font-medium">
              {conversionMetrics.approvedQuotations} de {conversionMetrics.totalQuotations} aprovados
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
