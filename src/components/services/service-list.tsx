"use client";

import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Search,
  Wrench,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type PaginatedServices, type ServiceItem } from "@/lib/services/backend";

interface ServiceListProps {
  onEditService: (service: ServiceItem) => void;
  onNewService: () => void;
  refreshTrigger?: number;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function ServiceList({
  onEditService,
  onNewService,
  refreshTrigger = 0,
}: ServiceListProps) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PaginatedServices | null>(null);

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
      try {
        const queryParams = new URLSearchParams();
        if (debouncedSearch.trim()) {
          queryParams.set("searchTerm", debouncedSearch.trim());
        }
        queryParams.set("page", page.toString());
        queryParams.set("pageSize", "10");

        const response = await fetch(`/api/services?${queryParams.toString()}`);
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
                : "Não foi possível carregar a lista de serviços agora. Tente novamente.",
            );
          }
          return;
        }

        const resData = await response.json();
        if (isMounted) {
          setData(resData.services);
          setError(null);
        }
      } catch {
        if (isMounted) {
          setError("Não foi possível carregar a lista de serviços agora. Tente novamente.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [debouncedSearch, page, refreshTrigger]);

  const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / data.pageSize)) : 1;

  return (
    <div className="space-y-4">
      {/* Top Bar: Search & Action CTA */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            placeholder="Buscar serviço por nome ou descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white border-slate-200"
          />
        </div>

        <Button
          onClick={onNewService}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          <Wrench className="size-4" /> Novo Serviço
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
          aria-label="Carregando lista de serviços"
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
            <Wrench className="size-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-slate-900">
            Nenhum serviço encontrado
          </h3>
          <p className="mt-1 text-sm text-slate-500 max-w-sm">
            {debouncedSearch
              ? `Nenhum resultado corresponde à busca "${debouncedSearch}".`
              : "Cadastre seu primeiro serviço para compor o catálogo e emitir orçamentos."}
          </p>
          <Button
            onClick={onNewService}
            variant="outline"
            className="mt-5 inline-flex items-center gap-2 rounded-xl border-slate-300 bg-white text-slate-700"
          >
            <Wrench className="size-4 text-blue-600" /> Cadastrar Primeiro Serviço
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="border-b border-slate-100 bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th scope="col" className="px-5 py-3.5 font-semibold">
                    Serviço / Descrição
                  </th>
                  <th scope="col" className="px-5 py-3.5 font-semibold">
                    Unidade
                  </th>
                  <th scope="col" className="px-5 py-3.5 font-semibold">
                    Preço Base
                  </th>
                  <th scope="col" className="px-5 py-3.5 font-semibold">
                    Status
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-right font-semibold">
                    Ação
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((service) => (
                  <tr
                    key={service.id}
                    className="transition-colors hover:bg-slate-50/60"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-semibold">
                          <Wrench className="size-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-950">
                            {service.name}
                          </div>
                          {service.description && (
                            <div className="text-xs text-slate-500 line-clamp-1">
                              {service.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        {service.unit}
                      </span>
                    </td>

                    <td className="px-5 py-4 font-bold text-slate-950">
                      {formatCurrency(service.basePrice)}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          service.isActive
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {service.isActive ? "Ativo" : "Inativo"}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEditService(service)}
                        className="inline-flex items-center gap-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      >
                        <Pencil className="size-3.5" /> Editar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
              <div>
                Página {data.page} de {totalPages} ({data.totalCount} serviços)
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
