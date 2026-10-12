"use client";

import { AppointmentModal } from "@/components/agenda/appointment-modal";

import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Plus,
  Search,
  XCircle,
  Clock,
  MoreVertical,
  BriefcaseBusiness,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { PaginatedQuotations, QuotationStatus } from "@/lib/quotations/backend";

interface QuotationListProps {
  onNewQuotation: () => void;
  refreshTrigger?: number;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(dateString));
}

const statusConfig: Record<QuotationStatus, { label: string; colorClass: string; icon: React.ElementType }> = {
  Draft: { label: "Rascunho", colorClass: "bg-slate-100 text-slate-700 border-slate-200", icon: FileText },
  Pending: { label: "Pendente", colorClass: "bg-blue-50 text-blue-700 border-blue-200", icon: Clock },
  Approved: { label: "Aprovado", colorClass: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  Rejected: { label: "Rejeitado", colorClass: "bg-red-50 text-red-700 border-red-200", icon: XCircle },
  Expired: { label: "Expirado", colorClass: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
  Canceled: { label: "Cancelado", colorClass: "bg-slate-100 text-slate-700 border-slate-200", icon: XCircle },
  Converted: { label: "Convertido em OS", colorClass: "bg-violet-50 text-violet-700 border-violet-200", icon: BriefcaseBusiness },
};

export function QuotationList({
  onNewQuotation,
  refreshTrigger = 0,
}: QuotationListProps) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<QuotationStatus | "All">("All");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PaginatedQuotations | null>(null);
  const [localRefresh, setLocalRefresh] = useState(0);
  const [generatedOrderId, setGeneratedOrderId] = useState<string | null>(null);
  const [schedulingOrder, setSchedulingOrder] = useState(false);
  const [convertingId, setConvertingId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (debouncedSearch.trim()) queryParams.set("search", debouncedSearch.trim());
        if (statusFilter !== "All") queryParams.set("status", statusFilter);
        queryParams.set("page", page.toString());
        queryParams.set("pageSize", "10");

        const response = await fetch(`/api/quotations?${queryParams.toString()}`);
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
                : "Não foi possível carregar a lista de orçamentos agora. Tente novamente.",
            );
          }
          return;
        }

        const resData = await response.json();
        if (isMounted) {
          setData(resData.quotations);
          setError(null);
        }
      } catch {
        if (isMounted) {
          setError("Não foi possível carregar a lista de orçamentos agora. Tente novamente.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [debouncedSearch, statusFilter, page, refreshTrigger, localRefresh]);

  const handleUpdateStatus = async (id: string, newStatus: QuotationStatus) => {
    try {
      const res = await fetch(`/api/quotations/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      setLocalRefresh((prev) => prev + 1);
    } catch {
      alert("Não foi possível atualizar o status do orçamento.");
    }
  };

  const handleConvertToOS = async (id: string) => {
    if (convertingId) return;
    setConvertingId(id);
    try {
      const res = await fetch(`/api/quotations/${id}/convert`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || "Não foi possível gerar a Ordem de Serviço.");
        return;
      }
      const data = await res.json();
      setGeneratedOrderId(data.id);
      setError(null);
      setLocalRefresh((prev) => prev + 1);
    } catch {
      setError("Não foi possível gerar a Ordem de Serviço agora.");
    } finally {
      setConvertingId(null);
    }
  };

  const handleDownloadPdf = async (id: string) => {
    try {
      const res = await fetch(`/api/quotations/${id}/export`);
      if (!res.ok) throw new Error();
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `orcamento-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Não foi possível exportar o PDF do orçamento.");
    }
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / data.pageSize)) : 1;

  return (
    <div className="space-y-4">
      {generatedOrderId && (
        <div role="status" className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          Ordem de serviço salva com sucesso.
          <Button className="ml-3" onClick={() => setSchedulingOrder(true)}>Agendar esta OS</Button>
        </div>
      )}
      {schedulingOrder && generatedOrderId && <AppointmentModal key={generatedOrderId} isOpen={true} initialWorkOrderId={generatedOrderId} onClose={() => setSchedulingOrder(false)} onSaved={() => setSchedulingOrder(false)} />}
      {/* Top Bar: Search, Filters & Action CTA */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center flex-1 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Buscar orçamento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white border-slate-200"
            />
          </div>
          <div className="flex flex-wrap bg-slate-100 p-1 rounded-lg">
            {(["All", "Draft", "Pending", "Approved", "Rejected", "Expired", "Canceled", "Converted"] as const).map((status) => (
              <button
                key={status}
                onClick={() => {
                  setStatusFilter(status);
                  setPage(1);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  statusFilter === status
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                }`}
              >
                {status === "All" ? "Todos" : statusConfig[status as QuotationStatus].label}
              </button>
            ))}
          </div>
        </div>

        <Button
          onClick={onNewQuotation}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          <Plus className="size-4" /> Novo Orçamento
        </Button>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700"
        >
          {error}
        </div>
      )}

      {loading ? (
        <div
          role="status"
          aria-label="Carregando orçamentos"
          className="space-y-3"
        >
          {[1, 2, 3, 4].map((id) => (
            <div
              key={id}
              className="h-16 animate-pulse rounded-2xl border border-slate-200 bg-slate-100/80 p-4"
            />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <FileText className="size-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-slate-900">
            Nenhum orçamento encontrado
          </h3>
          <p className="mt-1 text-sm text-slate-500 max-w-sm">
            {debouncedSearch || statusFilter !== "All"
              ? "Nenhum resultado corresponde aos filtros aplicados."
              : "Comece criando o primeiro orçamento para seus clientes."}
          </p>
          {(debouncedSearch || statusFilter !== "All") ? (
            <Button
              onClick={() => {
                setSearch("");
                setStatusFilter("All");
              }}
              variant="outline"
              className="mt-5 rounded-xl border-slate-300 bg-white text-slate-700"
            >
              Limpar Filtros
            </Button>
          ) : (
            <Button
              onClick={onNewQuotation}
              variant="outline"
              className="mt-5 inline-flex items-center gap-2 rounded-xl border-slate-300 bg-white text-slate-700"
            >
              <Plus className="size-4 text-blue-600" /> Criar Orçamento
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="border-b border-slate-100 bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th scope="col" className="px-5 py-3.5 font-semibold">Cliente</th>
                  <th scope="col" className="px-5 py-3.5 font-semibold">Data</th>
                  <th scope="col" className="px-5 py-3.5 font-semibold">Valor Total</th>
                  <th scope="col" className="px-5 py-3.5 font-semibold">Status</th>
                  <th scope="col" className="px-5 py-3.5 text-right font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((quotation) => {
                  const statusInfo = statusConfig[quotation.status];
                  const StatusIcon = statusInfo.icon;

                  return (
                    <tr
                      key={quotation.id}
                      className="transition-colors hover:bg-slate-50/60"
                    >
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-950">
                          {quotation.customerName}
                        </div>
                        <div className="text-xs text-slate-400">
                          {quotation.code}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-500">
                        {formatDate(quotation.issueDate)}
                      </td>
                      <td className="px-5 py-4 font-medium text-slate-900">
                        {formatCurrency(quotation.totalAmount)}
                      </td>
                      <td className="px-5 py-4">
                        <div className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold ${statusInfo.colorClass}`}>
                          <StatusIcon className="size-3.5" />
                          {statusInfo.label}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500 hover:text-slate-900">
                              <MoreVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => handleDownloadPdf(quotation.id)}>
                              <Download className="mr-2 size-4 text-slate-500" />
                              Baixar PDF
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel className="text-xs text-slate-400 font-medium">Atualizar Status</DropdownMenuLabel>
                            {quotation.status === "Draft" && (
                              <DropdownMenuItem onClick={() => handleUpdateStatus(quotation.id, "Pending")}>
                                <Clock className="mr-2 size-4 text-blue-500" />
                                Marcar como Pendente
                              </DropdownMenuItem>
                            )}
                            {quotation.status === "Pending" && (
                              <DropdownMenuItem onClick={() => handleUpdateStatus(quotation.id, "Approved")}>
                                <CheckCircle2 className="mr-2 size-4 text-emerald-500" />
                                Marcar como Aprovado
                              </DropdownMenuItem>
                            )}
                            {quotation.status === "Approved" && (
                              <DropdownMenuItem disabled={convertingId !== null} onClick={() => handleConvertToOS(quotation.id)}>
                                <BriefcaseBusiness className="mr-2 size-4 text-emerald-600" />
                                Gerar Ordem de Serviço (OS)
                              </DropdownMenuItem>
                            )}
                            {quotation.status === "Pending" && (
                              <DropdownMenuItem onClick={() => handleUpdateStatus(quotation.id, "Rejected")}>
                                <XCircle className="mr-2 size-4 text-red-500" />
                                Marcar como Rejeitado
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
              <div>
                Página {data.page} de {totalPages} ({data.totalCount} orçamentos)
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-8 rounded-lg px-2.5"
                >
                  <ChevronLeft className="size-3.5" /> Anterior
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="h-8 rounded-lg px-2.5"
                >
                  Próxima <ChevronRight className="size-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
